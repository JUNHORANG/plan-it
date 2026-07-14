/*
  관리자 헤더 — 공통 UI 컴포넌트
  참조: spec.md "관리자 기능 정의 - 헤더 - 공통 UI", Figma "관리자 - 주문 관리"(4388:2254)

  동작
  1. 로고 클릭 → /admin/orders/ 이동
  2. 주문 관리 클릭 → /admin/orders/ 이동
  3. 상점 관리 클릭 → /admin/products/ 이동
  4. 로그아웃 클릭 → logout() 요청 후 / 로 이동
*/

import { logout } from "/shared/js/api.js";

function isActive(path) {
  return window.location.pathname === path;
}

export function mountAdminHeader(selector) {
  const root = document.querySelector(selector);
  if (!root) return null;

  root.classList.add("admin-header");
  root.innerHTML = `
    <a class="admin-header__logo" href="/admin/orders/">PLAN <span class="admin-header__logo-accent">!</span>T</a>
    <nav class="admin-header__nav">
      <a class="admin-header__link${isActive("/admin/orders/") ? " is-active" : ""}" href="/admin/orders/">주문 관리</a>
      <a class="admin-header__link${isActive("/admin/products/") ? " is-active" : ""}" href="/admin/products/">상점 관리</a>
      <button class="admin-header__link" type="button" data-admin-logout>로그아웃</button>
    </nav>
  `;

  root.querySelector("[data-admin-logout]").addEventListener("click", async () => {
    await logout();
    location.href = "/";
  });

  return root;
}
