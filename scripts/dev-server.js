/*
  개발용 정적 서버 — src/ 와 public/ 을 하나의 루트로 합쳐서 서빙한다.
  빌드 스텝 없는 순수 정적 MPA 전제(blueprint.md §0)를 유지하기 위한 최소 구현.

  탐색 순서: 요청 경로를 src/<path> 에서 먼저 찾고, 없으면 public/<path> 로 폴백한다.
  (src/ = index.html, user/, admin/, shared/ 등 소스 코드 / public/ = fonts, images 등 정적 자산)

  실행: npm run dev (기본 포트 3000, PORT 환경변수로 변경 가능)
*/

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT, "src");
const PUBLIC_DIR = path.join(ROOT, "public");
const PORT = Number(process.env.PORT || 3000);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".otf": "font/otf",
  ".ttf": "font/ttf",
};

// MPA라 라우트 이동마다 문서를 통째로 새로 받는다 — 지금까지 캐시 헤더가 하나도 없어서
// 폰트·이미지처럼 페이지마다 반복되는 정적 자산까지 라우트를 옮길 때마다 매번 새로 받아왔다
// (이게 "폰트/이미지가 라우트 바뀔 때마다 늦게 뜬다"는 증상의 원인). 폰트는 사실상 절대
// 안 바뀌니 1년 캐시, 이미지는 개발 중 갱신될 수 있어 1일 캐시로 두고, CSS/JS/HTML은
// ETag만으로 즉시 반영되게 하면서도(no-cache는 "매번 서버에 물어는 보되 안 바뀌었으면
// 304로 몸통 없이 끝낸다"는 뜻 — 무조건 재전송이 아니다) 안 바뀐 파일은 304로 몸통 전송을
// 건너뛴다.
const IMMUTABLE_EXT = new Set([".woff2", ".woff", ".otf", ".ttf"]);
const DAY_CACHE_EXT = new Set([".png", ".jpg", ".jpeg", ".svg"]);

function cacheControlFor(ext) {
  if (IMMUTABLE_EXT.has(ext)) return "public, max-age=31536000, immutable";
  if (DAY_CACHE_EXT.has(ext)) return "public, max-age=86400";
  return "no-cache"; // html/css/js: 항상 재검증하되 안 바뀌었으면 304로 짧게 끝낸다
}

function resolveFile(urlPath) {
  const candidates = [];
  const isDirLike = urlPath.endsWith("/");
  const relPath = urlPath.replace(/^\/+/, "");

  for (const base of [SRC_DIR, PUBLIC_DIR]) {
    if (isDirLike) {
      candidates.push(path.join(base, relPath, "index.html"));
    } else {
      candidates.push(path.join(base, relPath));
    }
  }

  for (const filePath of candidates) {
    if (!filePath.startsWith(SRC_DIR) && !filePath.startsWith(PUBLIC_DIR)) continue; // path traversal guard
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return filePath;
    }
  }
  return null;
}

function sendFile(req, res, filePath, statusCode = 200) {
  const ext = path.extname(filePath).toLowerCase();
  const stat = fs.statSync(filePath);
  const etag = `"${stat.size}-${stat.mtimeMs}"`;

  const headers = {
    "Content-Type": MIME[ext] || "application/octet-stream",
    "Cache-Control": cacheControlFor(ext),
    ETag: etag,
    "Last-Modified": stat.mtime.toUTCString(),
  };

  if (req.headers["if-none-match"] === etag) {
    res.writeHead(304, headers);
    res.end();
    return;
  }

  res.writeHead(statusCode, headers);
  fs.createReadStream(filePath).pipe(res);
}

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split("?")[0]);
    const filePath = resolveFile(urlPath);

    if (!filePath) {
      const notFound = path.join(SRC_DIR, "404", "index.html");
      if (fs.existsSync(notFound)) {
        sendFile(req, res, notFound, 404);
      } else {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(`404 Not Found: ${urlPath}`);
      }
      return;
    }

    sendFile(req, res, filePath);
  })
  .listen(PORT, () => {
    console.log(`Plan It dev server → http://localhost:${PORT}`);
    console.log(`  src:    ${SRC_DIR}`);
    console.log(`  public: ${PUBLIC_DIR}`);
  });
