/*
  상점 (/user/store/products/)
  참조: Figma "/store"(4278:843) — 아이콘+"스토어" 타이틀, 나의 포인트(라벨+칩), 단일 열 상품 리스트
  (썸네일+카테고리/이름/가격) → 행 클릭 시 구매 확인 바텀시트 → /user/products/order/?id=
  카테고리는 spec.md의 "씨앗·식물·묘목"이 아니라 Figma 실측값 "나무"/"다육식물"을 그대로 사용
  (blueprint.md §9 참조).

  타블렛(≥600px, Figma 4324:1295): 카테고리/이름 묶음(.store__item-info)과 가격을
  세로로 쌓지 않고 한 행에서 좌우로 벌려 배치 — index.css 미디어쿼리 참조.
*/

import { mountHeader } from "/shared/components/header.js";
import { mountNavDrawer } from "/shared/components/nav-drawer.js";
import { renderSkeleton, clearSkeleton } from "/shared/components/skeleton.js";
import { openPurchaseSheet } from "/shared/components/purchase-sheet.js";
import { getProfile, getProducts } from "/shared/js/api.js";

mountHeader("#header");
mountNavDrawer("#nav-drawer");

const app = document.querySelector("#app");
app.innerHTML = `
  <div class="store">
    <div class="store__title">
      <img class="store__title-icon" src="/images/store_icon.png" alt="" />
      <h1 class="store__title-text">스토어</h1>
    </div>
    <div class="store__points">
      <span class="store__points-label">나의 포인트</span>
      <span class="store__points-pill" data-points></span>
    </div>
    <div class="store_line"></div>
    <div class="store__list" data-list></div>
  </div>
`;

let currentPoints = 0;

load();

async function load() {
  const pointsEl = document.querySelector("[data-points]");
  const listEl = document.querySelector("[data-list]");

  // Figma "스토어 - 스켈레톤"(4534:1055 모바일 343x77 / 4561:1796 타블렛 551x69) 실측: 포인트
  // 값 89x19, 리스트는 여러 줄이 아니라 한 줄짜리 자리표시자 하나. 다만 실측 높이(77·69)가
  // 실제 리스트 행 높이(.store__item, 88px — 모바일/타블렛 공통)보다 낮아서 그대로 쓰면 로딩이
  // 끝나고 실제 목록이 뜨는 순간 스켈레톤보다 커지며 "튀는" 게 보인다 — 실제 행 높이(88)에
  // 맞춰서 그 점프를 없앤다.
  renderSkeleton(pointsEl, { width: 89, height: 19 });
  listEl.innerHTML = "";
  const row = document.createElement("div");
  row.className = "store__item-skeleton";
  // 너비는 지정하지 않는다 — CSS margin(모바일 16px / 타블렛 16px 24px, index.css 참조)만으로
  // 좌우를 들여쓰게 두면 블록 요소가 남는 공간을 자동으로 채운다. 예전엔 width:calc(100% - 32px)를
  // 같이 줬는데, 그 32px(모바일 여백 16+16 기준)이 타블렛 여백(24+24=48px)과 안 맞아서 박스가
  // 16px만큼 넘쳐(overflow) 오른쪽만 여백이 이상하게 보였다.
  renderSkeleton(row, { height: 88 });
  listEl.appendChild(row);

  const [profile, products] = await Promise.all([getProfile(), getProducts()]);
  currentPoints = profile.points;

  clearSkeleton(pointsEl);
  pointsEl.textContent = `${profile.points.toLocaleString()} 포인트`;

  renderList(products);
}

function renderList(products) {
  const listEl = document.querySelector("[data-list]");
  listEl.innerHTML = "";

  products.forEach((product) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "store__item";
    item.innerHTML = `
      <div class="store__item-image-box">
        <img class="store__item-image" src="${product.image}" alt="${product.name}" />
      </div>
      <div class="store__item-body">
        <div class="store__item-info">
          <span class="store__item-category">${product.category}</span>
          <span class="store__item-name">${product.name}</span>
        </div>
        <span class="store__item-price">
          <span class="store__item-price-badge">P</span>
          <span class="store__item-price-value">${product.price.toLocaleString()}</span>
        </span>
      </div>
    `;
    item.addEventListener("click", () => openPurchaseConfirmSheet(product));
    listEl.appendChild(item);
  });
}

function openPurchaseConfirmSheet(product) {
  const remaining = currentPoints - product.price;

  openPurchaseSheet({
    name: product.name,
    remaining,
    submitLabel: `${product.price.toLocaleString()} 포인트 사용`,
    onConfirm: () => {
      location.href = `/user/products/order/index.html?id=${product.id}`;
    },
  });
}
