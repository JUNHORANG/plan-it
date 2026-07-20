/*
  나브 드로워 — 공통 UI 컴포넌트
  참조: Figma "나브" 모바일(4007:333) / 타블렛(4146:1022), spec.md "나브 드로워 - 공통UI"

  동작 요약
  - 로고 클릭 → /user/plans 이동
  - X 아이콘 클릭 / 외부(backdrop) 클릭 → 드로워 닫기
  - 메뉴 항목 클릭 → 각 도메인 이동 (홈/캘린더/스토어/랭킹/프로필/알림)
  - 현재 활성 메뉴(현재 페이지) 라벨 옆에 유저가 선택한 행성 아이콘(22x22)이 붙는다
    (Figma 실측: 활성 항목 "홈" 텍스트 바로 뒤 6px — `.nav-drawer__menu-link`의 기존
    `gap:6px`가 원래 이 아이콘을 위해 준비돼 있었는데 마크업에 실제로 안 넣어져 있었음).
    profile/index.js의 applyAvatar()와 동일하게 planets에서 profile.planet id로 찾고
    없으면 planets[0](지구) 기본값.

  아이콘: lucide-icons 사용 (프로젝트 공통 규약, CLAUDE.md 참조)
  TODO: shared/js/utils.js의 navigate() 헬퍼가 만들어지면 location.href 직접 대입을 교체할 것.
*/

import {
  createElement,
  X,
} from "https://cdn.jsdelivr.net/npm/lucide@latest/+esm";
import { getProfile } from "/shared/js/api.js";
import { planets } from "/shared/js/data.js";

const MENU_ITEMS = [
  { label: "홈", path: "/user/plans/" },
  { label: "캘린더", path: "/user/calendar/" },
  { label: "스토어", path: "/user/store/" },
  { label: "랭킹", path: "/user/ranking/" },
  { label: "프로필", path: "/user/profile/" },
  { label: "알림", path: "/user/notification/" },
];

function isActivePath(path) {
  return window.location.pathname === path;
}

function renderMenu() {
  return MENU_ITEMS.map(
    (item) => `
      <li class="nav-drawer__menu-item">
        <a
          class="nav-drawer__menu-link${isActivePath(item.path) ? " is-active" : ""}"
          href="${item.path}"
          data-nav-path="${item.path}"
        >${item.label}</a>
      </li>
    `,
  ).join("");
}

function render() {
  return `
    <div class="nav-drawer__backdrop" data-nav-close></div>
    <div class="nav-drawer__panel" role="dialog" aria-label="내비게이션">
      <div class="nav-drawer__header">
        <a class="nav-drawer__logo" href="/user/plans/" data-nav-logo>
          PLAN <span class="nav-drawer__logo-primary">!</span>T
        </a>
        <button class="nav-drawer__close" type="button" aria-label="닫기" data-nav-close></button>
      </div>
      <ul class="nav-drawer__menu">
        ${renderMenu()}
      </ul>
    </div>
  `;
}

async function applyActivePlanetIcon(root) {
  const activeLink = root.querySelector(".nav-drawer__menu-link.is-active");
  if (!activeLink) return;

  const profile = await getProfile();
  const planet = planets.find((p) => p.id === profile?.planet) || planets[0];

  const icon = document.createElement("img");
  icon.className = "nav-drawer__menu-icon";
  icon.src = planet.image;
  icon.alt = "";
  activeLink.appendChild(icon);
}

export function mountNavDrawer(selector) {
  const root = document.querySelector(selector);
  if (!root) return null;

  root.classList.add("nav-drawer");
  root.innerHTML = render();
  root
    .querySelector(".nav-drawer__close")
    .appendChild(createElement(X, { size: 24 }));
  applyActivePlanetIcon(root);

  const open = () => root.classList.add("is-open");
  const close = () => root.classList.remove("is-open");

  root.addEventListener("click", (event) => {
    if (event.target.closest("[data-nav-close]")) {
      close();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });

  window.addEventListener("nav-drawer:open", open);
  window.addEventListener("nav-drawer:close", close);

  return { open, close };
}

export function openNavDrawer() {
  window.dispatchEvent(new CustomEvent("nav-drawer:open"));
}

export function closeNavDrawer() {
  window.dispatchEvent(new CustomEvent("nav-drawer:close"));
}
