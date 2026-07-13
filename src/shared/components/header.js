/*
  헤더 — 공통 UI 컴포넌트
  참조: spec.md "헤더 - 공통 UI", Figma 재사용 컴포넌트(4132:588) "헤더" 섹션

  동작
  1. 로고 클릭 → /user/plans/ 이동
  2. 종 아이콘 클릭 → /user/notification/ 이동
  3. 새 알림이 있으면 종 아이콘에 빨간 뱃지 표시
  4. 햄버거 클릭 → nav-drawer.js 의 openNavDrawer() 호출 (나브 드로워 참조)

  아이콘: 기본은 lucide-icons(CLAUDE.md 컨벤션). 종 아이콘만 예외 — Figma 원본이 solar
  아이콘셋(solar:bell-outline)을 써서, 빌드 스텝 없이 CDN ESM으로 iconify-icon 웹 컴포넌트를
  불러와 <iconify-icon icon="solar:bell-outline">으로 렌더링(§9 10번 참조, 사용자 요청으로 확정).
*/

import { createElement, Menu } from "https://cdn.jsdelivr.net/npm/lucide@latest/+esm";
import "https://cdn.jsdelivr.net/npm/iconify-icon@2.1.0/+esm";
import { openNavDrawer } from "./nav-drawer.js";

function render() {
  return `
    <a class="header__logo" href="/user/plans/">PLAN <span class="header__logo-accent">!</span>T</a>
    <div class="header__actions">
      <a class="header__icon-btn" href="/user/notification/" aria-label="알림" data-header-bell>
        <iconify-icon icon="solar:bell-outline" width="22" height="22"></iconify-icon>
        <span class="header__badge" hidden></span>
      </a>
      <button class="header__icon-btn" type="button" aria-label="메뉴 열기" data-header-menu></button>
    </div>
  `;
}

export function mountHeader(selector, { hasNotification = false } = {}) {
  const root = document.querySelector(selector);
  if (!root) return null;

  root.classList.add("header");
  root.innerHTML = render();

  root.querySelector('[data-header-menu]').appendChild(createElement(Menu, { size: 24 }));

  const badge = root.querySelector(".header__badge");
  badge.hidden = !hasNotification;

  root.querySelector('[data-header-menu]').addEventListener("click", () => {
    openNavDrawer();
  });

  return {
    setHasNotification: (value) => {
      badge.hidden = !value;
    },
  };
}
