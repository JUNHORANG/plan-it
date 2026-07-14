/*
  공통 유틸 — 날짜 포맷, storage 래퍼
  참조: blueprint.md §3 shared/js/utils.js
*/

export function toISODate(date) {
  const d = new Date(date);
  const offsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 10);
}

/** date가 포함된 주(월~일) 7일을 Date 배열로 반환 */
export function getWeekDates(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun ... 6=Sat
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const cur = new Date(monday);
    cur.setDate(monday.getDate() + i);
    return cur;
  });
}

/** "Friday, May 11" 형식 (홈 화면 날짜 헤딩) */
export function formatFullDateLabel(date) {
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const month = date.toLocaleDateString("en-US", { month: "long" });
  return `${weekday}, ${month} ${date.getDate()}`;
}

/** "2026.07.12" 형식 (일정 추가/수정 화면 날짜 필드, Figma 4355:1141 실측) */
export function formatDotDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}.${m}.${d}`;
}

/*
  오버레이(바텀시트 등)가 떠 있는 동안 배경 스크롤을 막는다. body에 overflow:hidden만 주면
  iOS Safari에서는 여전히 터치 스크롤이 새는 경우가 있어, body를 position:fixed로 고정하고
  스크롤 위치를 저장했다가 닫힐 때 복원하는 방식을 쓴다. 카운터를 둬서 겹쳐 열려도 안전하게
  동작한다(마지막 하나가 닫힐 때만 실제로 풀림).

  주의: left/right를 0으로 명시해야 한다 — 그냥 position:fixed만 주면(left/right 미지정)
  body의 기존 max-width:600px + margin:0 auto 가운데 정렬 계산 기준이 되는 "가용 폭"이
  달라져 데스크탑 폭에서 중앙 정렬이 깨진다(실측: 600px였다가 잠그면 폭도 좁아지고 왼쪽으로
  붙어버림). left:0;right:0으로 뷰포트 전체를 가용 폭으로 잡아줘야 margin:auto가 원래처럼
  그 안에서 600px를 가운데 정렬한다.
*/
let scrollLockCount = 0;
let savedScrollY = 0;

export function lockScroll() {
  if (scrollLockCount === 0) {
    savedScrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
  }
  scrollLockCount++;
}

export function unlockScroll() {
  if (scrollLockCount === 0) return;
  scrollLockCount--;
  if (scrollLockCount === 0) {
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    // 전역 scroll-behavior:smooth 때문에 여기서도 애니메이션으로 스크롤되면 닫을 때마다
    // 눈에 띄게 움직이는 것처럼 보인다 — 위치 복원은 항상 즉시(instant) 이동해야 한다
    window.scrollTo({ top: savedScrollY, left: 0, behavior: "instant" });
  }
}

const storage = {
  get(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key) {
    localStorage.removeItem(key);
  },
};

export { storage };
