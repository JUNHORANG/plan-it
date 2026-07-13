/*
  앱바 — 공통 UI 컴포넌트
  참조: spec.md "앱바 - 공통 UI", Figma 재사용 컴포넌트(4132:588) "앱바" 섹션

  동작: 뒤로 가기 버튼 클릭 → 기본은 history.back(), onBack 옵션으로 특정 도메인/모달 등으로 재정의 가능
        (예: 회원가입 화면은 뒤로가기 클릭 시 확인 모달을 띄운다 — spec.md "회원가입" §2 참조)
*/

import { createElement, ArrowLeft } from "https://cdn.jsdelivr.net/npm/lucide@latest/+esm";

export function mountAppBar(selector, { title = "", onBack } = {}) {
  const root = document.querySelector(selector);
  if (!root) return null;

  root.classList.add("app-bar");
  root.innerHTML = `
    <button class="app-bar__back" type="button" aria-label="뒤로 가기" data-app-bar-back></button>
    <span class="app-bar__title">${title}</span>
  `;

  root.querySelector('[data-app-bar-back]').appendChild(createElement(ArrowLeft, { size: 14 }));

  root.querySelector('[data-app-bar-back]').addEventListener("click", () => {
    if (onBack) onBack();
    else history.back();
  });

  return {
    setTitle: (text) => {
      root.querySelector(".app-bar__title").textContent = text;
    },
  };
}
