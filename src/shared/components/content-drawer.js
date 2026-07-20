/*
  콘텐츠 드로워 — 공통 UI 컴포넌트 (오버레이)
  참조: spec.md "행성 변경 드로워"/"이용 약관 드로워"/"개인 정보 처리 방침 드로워"
  (전용 Figma 프레임을 API rate limit로 확인하지 못해, 앱바(뒤로가기+제목) 패턴을 그대로
  적용 — blueprint.md §9 참조)

  나브 드로워(왼쪽에서 슬라이드)와 달리, "하위 화면으로 들어간다"는 느낌을 주기 위해
  오른쪽에서 슬라이드해 들어오는 전체화면 오버레이. 뒤로가기 버튼/Escape로 닫힌다.

  openContentDrawer({ title, render(bodyEl), renderFooter(footerEl) })

  renderFooter는 선택 사항 — 하단 고정 CTA가 필요한 화면(예: 행성 변경)만 쓴다.
  body는 스크롤되는 영역(.content-drawer__panel의 overflow-y:auto)이라 그 안에
  position:fixed 요소를 넣으면 안 된다 — panel이 will-change:transform도 같이 갖고 있어서
  fixed의 containing block이 진짜 뷰포트가 아니라 panel이 돼 버리고, 결과적으로 panel이
  스크롤될 때 "고정"이어야 할 요소가 스크롤한 만큼 같이 움직이는 버그가 생긴다(실측 확인:
  109px 스크롤 시 버튼도 109px 이동). 대신 footer를 body와 형제 관계의 별도 flex 자식으로
  두면 애초에 스크롤 영역 밖이라 이 문제 자체가 생기지 않는다.
*/

import { createElement, ArrowLeft } from "https://cdn.jsdelivr.net/npm/lucide@latest/+esm";

let active = null;

export function closeContentDrawer() {
  if (!active) return;
  const { el } = active;
  el.classList.remove("is-open");
  active = null;
  setTimeout(() => el.remove(), 380);
}

export function openContentDrawer({ title = "", render, renderFooter, hideScrollbar = false } = {}) {
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
      <div class="content-drawer__scroll-hint" aria-hidden="true"></div>
    </div>
  `;
  root.appendChild(el);

  el.querySelector(".content-drawer__back").appendChild(createElement(ArrowLeft, { size: 14 }));
  el.querySelector(".content-drawer__back").addEventListener("click", closeContentDrawer);

  const body = el.querySelector(".content-drawer__body");
  const scrollHint = el.querySelector(".content-drawer__scroll-hint");

  if (hideScrollbar) body.classList.add("content-drawer__body--no-scrollbar");

  // 약관/개인정보처리방침처럼 내용이 길어 스크롤이 필요한 드로워는 실제로 overflow-y:auto로
  // 스크롤이 되는데도, OS/브라우저의 오버레이 스크롤바(맥 오토하이드 등)가 평소엔 안 보여서
  // "스크롤이 안 되는 것"처럼 보인다는 피드백이 있었다 — 오버레이 스크롤바는 CSS로 항상
  // 보이게 강제할 수 없어서(content-drawer.css 주석 참조), 대신 아래쪽에 더 볼 내용이 남아
  // 있을 때만 옅은 그림자를 띄워 스크롤 가능함을 알려준다. 내용이 짧아 애초에 안 넘치는
  // 드로워(예: 행성 변경)는 조건이 항상 거짓이라 그대로 안 보인다.
  function updateScrollHint() {
    const hasMore = body.scrollHeight - body.scrollTop - body.clientHeight > 4;
    scrollHint.classList.toggle("is-visible", hasMore);
  }
  body.addEventListener("scroll", updateScrollHint);

  // render가 비동기(예: openLegalDrawer의 fetch)일 수 있어, 완료된 뒤에도 다시 계산한다.
  const renderResult = render ? render(body) : undefined;
  Promise.resolve(renderResult).then(updateScrollHint);
  requestAnimationFrame(updateScrollHint);

  if (renderFooter) {
    const panel = el.querySelector(".content-drawer__panel");
    const footer = document.createElement("div");
    footer.className = "content-drawer__footer";
    panel.appendChild(footer);
    renderFooter(footer);
  }

  const escHandler = (event) => {
    if (event.key === "Escape") closeContentDrawer();
  };
  window.addEventListener("keydown", escHandler, { once: true });

  requestAnimationFrame(() => el.classList.add("is-open"));

  active = { el };
  return active;
}
