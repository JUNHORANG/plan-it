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

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split("?")[0]);
    const filePath = resolveFile(urlPath);

    if (!filePath) {
      const notFound = path.join(SRC_DIR, "404", "index.html");
      if (fs.existsSync(notFound)) {
        res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
        res.end(fs.readFileSync(notFound));
      } else {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(`404 Not Found: ${urlPath}`);
      }
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(res);
  })
  .listen(PORT, () => {
    console.log(`Plan It dev server → http://localhost:${PORT}`);
    console.log(`  src:    ${SRC_DIR}`);
    console.log(`  public: ${PUBLIC_DIR}`);
  });
