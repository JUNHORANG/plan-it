/*
  헤더 — 공통 UI 컴포넌트
  참조: spec.md "헤더 - 공통 UI", Figma 재사용 컴포넌트(4132:588) "헤더" 섹션

  동작
  1. 로고 클릭 → /user/plans/ 이동
  2. 종 아이콘 클릭 → /user/notification/ 이동
  3. 새 알림이 있으면 종 아이콘에 빨간 뱃지 표시
  4. 햄버거 클릭 → nav-drawer.js 의 openNavDrawer() 호출 (나브 드로워 참조)

  아이콘: lucide-icons. 종 아이콘은 Figma 원본이 solar 아이콘셋(solar:bell-outline)을 썼지만
  프로젝트 아이콘 컨벤션(CLAUDE.md)에 맞춰 lucide의 Bell로 대체.
*/

import { createElement, Bell, Menu } from "https://cdn.jsdelivr.net/npm/lucide@latest/+esm";
import { openNavDrawer } from "./nav-drawer.js";

function render() {
  return `
    <a class="header__logo" href="/user/plans/">PLAN <span class="header__logo-accent">!</span>T</a>
    <div class="header__actions">
      <a class="header__icon-btn" href="/user/notification/" aria-label="알림" data-header-bell>
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

  root.querySelector('[data-header-bell]').appendChild(createElement(Bell, { size: 22 }));
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
