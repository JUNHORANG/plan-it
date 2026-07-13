/*
  콘텐츠 드로워 — 공통 UI 컴포넌트 (오버레이)
  참조: spec.md "행성 변경 드로워"/"이용 약관 드로워"/"개인 정보 처리 방침 드로워"
  (전용 Figma 프레임을 API rate limit로 확인하지 못해, 앱바(뒤로가기+제목) 패턴을 그대로
  적용 — blueprint.md §9 참조)

  나브 드로워(왼쪽에서 슬라이드)와 달리, "하위 화면으로 들어간다"는 느낌을 주기 위해
  오른쪽에서 슬라이드해 들어오는 전체화면 오버레이. 뒤로가기 버튼/Escape로 닫힌다.

  openContentDrawer({ title, render(bodyEl) })
*/

import { createElement, ArrowLeft } from "https://cdn.jsdelivr.net/npm/lucide@latest/+esm";

let active = null;

export function closeContentDrawer() {
  if (!active) return;
  const { el } = active;
  el.classList.remove("is-open");
  active = null;
  setTimeout(() => el.remove(), 250);
}

export function openContentDrawer({ title = "", render } = {}) {
  closeContentDrawer();

  const root = document.querySelector("#overlay-root");
  const el = document.createElement("div");
  el.className = "content-drawer";
  el.innerHTML = `
    <div class="content-drawer__backdrop"></div>
    <div class="content-drawer__panel" role="dialog" aria-label="${title}">
      <div class="content-drawer__head">
        <button class="content-drawer__back" type="button" aria-label="뒤로 가기" data-drawer-close></button>
        <h2 class="content-drawer__title">${title}</h2>
      </div>
      <div class="content-drawer__body"></div>
    </div>
  `;
  root.appendChild(el);

  el.querySelector(".content-drawer__back").appendChild(createElement(ArrowLeft, { size: 14 }));
  el.querySelector(".content-drawer__back").addEventListener("click", closeContentDrawer);

  const body = el.querySelector(".content-drawer__body");
  if (render) render(body);

  const escHandler = (event) => {
    if (event.key === "Escape") closeContentDrawer();
  };
  window.addEventListener("keydown", escHandler, { once: true });

  requestAnimationFrame(() => el.classList.add("is-open"));

  active = { el };
  return active;
}
