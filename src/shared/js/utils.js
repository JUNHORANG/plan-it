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
