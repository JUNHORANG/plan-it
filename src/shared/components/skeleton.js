/*
  스켈레톤 — 공통 UI 컴포넌트
  참조: spec.md "스켈레톤 - 공통UI" — "첫 진입에 데이터가 필요한 부분에 스켈레톤을 제공한다."
*/

export function renderSkeleton(el, { width, height, radius = "5px" } = {}) {
  el.classList.add("skeleton");
  if (width) el.style.width = typeof width === "number" ? `${width}px` : width;
  if (height) el.style.height = typeof height === "number" ? `${height}px` : height;
  el.style.borderRadius = radius;
}

export function clearSkeleton(el) {
  el.classList.remove("skeleton");
  el.style.width = "";
  el.style.height = "";
  el.style.borderRadius = "";
}
