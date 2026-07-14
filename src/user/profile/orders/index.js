/*
  주문 내역 (/user/profile/orders/)
  참조: Figma "profile/orders"(4376:1786) — Desktop Bridge 플러그인 경로로 실측(REST API rate limit 우회)

  - 페이지 상단 "헤더" 구성은 실측 프레임에 앱바 톤 중복(레이어 잔재)도 있었지만, blueprint.md
    라우팅 표에 이미 "헤더"로 확정돼 있어 그대로 mountHeader() 사용.
  - "나의 포인트" 바는 상점 페이지와 동일한 라벨+초록 필(pill) 패턴(아이콘 이미지 아님).
  - 주문 카드: 상태(아이콘+텍스트, 상태별 색) → 제품(가격 20px semibold이 이름 위, 구매 페이지와
    동일 순서) → 구분선 → "사용 후 포인트" 박스 → 주문 취소 버튼.
  - 주문 취소 버튼은 "주문 접수 중"일 때만 활성화(초록), "취소 접수 중"·"주문 배송 중"이면
    비활성화(연한 초록 --color-primary-disabled-bg, 실측 색상과 정확히 일치 — 사용자 지정 규칙).
*/

import { mountHeader } from "/shared/components/header.js";
import { mountNavDrawer } from "/shared/components/nav-drawer.js";
import { renderSkeleton, clearSkeleton } from "/shared/components/skeleton.js";
import { openModal } from "/shared/components/modal.js";
import { showToast } from "/shared/components/toast.js";
import { getProfile, getOrders, cancelOrder, getProducts, hasUnreadNotifications } from "/shared/js/api.js";
import { requireAuth } from "/shared/js/utils.js";
import { createElement, Info } from "https://cdn.jsdelivr.net/npm/lucide@latest/+esm";

await requireAuth();

mountHeader("#header", { hasNotification: await hasUnreadNotifications() });
mountNavDrawer("#nav-drawer");

const app = document.querySelector("#app");
app.innerHTML = `
  <div class="orders">
    <div class="orders__points">
      <span class="orders__points-label">나의 포인트</span>
      <span class="orders__points-pill" data-points></span>
    </div>
    <p class="orders__count" data-count></p>
    <div class="orders__list" data-list></div>
  </div>
`;

let products = [];

load();

async function load() {
  const pointsEl = document.querySelector("[data-points]");
  const countEl = document.querySelector("[data-count]");
  const listEl = document.querySelector("[data-list]");

  // Figma "주문 내역 - 스켈레톤"(4376:1962): 포인트 값만 자리표시자고 "나의 포인트"/"주문 내역"
  // 라벨은 고정 문구라 실제 텍스트 그대로 두고, 건수(N건) 자리에만 작은 배지를 붙인다.
  // 카드도 여러 장이 아니라 실제 카드 한 장 높이(265px)만큼 한 장만 보여준다.
  renderSkeleton(pointsEl, { width: 109, height: 19 });
  countEl.innerHTML = "주문 내역 ";
  const countSkeleton = document.createElement("span");
  countSkeleton.className = "orders__count-skeleton";
  countEl.appendChild(countSkeleton);
  renderSkeleton(countSkeleton, { width: 25, height: 21 });

  listEl.innerHTML = "";
  const item = document.createElement("div");
  renderSkeleton(item, { width: "100%", height: 265, radius: "12px" });
  listEl.appendChild(item);

  const [profile, orders, productList] = await Promise.all([getProfile(), getOrders(), getProducts()]);
  products = productList;

  clearSkeleton(pointsEl);
  pointsEl.textContent = `${profile.points.toLocaleString()} 포인트`;
  countEl.innerHTML = `주문 내역 <strong>${orders.length}건</strong>`;

  renderList(orders);
}

function renderList(orders) {
  const listEl = document.querySelector("[data-list]");
  listEl.innerHTML = "";

  if (orders.length === 0) {
    listEl.innerHTML = `<p class="orders__empty">주문 내역이 없습니다.</p>`;
    return;
  }

  orders.forEach((order) => {
    const product = products.find((p) => p.id === order.productId);
    const isCancelling = order.status === "취소 접수 중";
    const isShipping = order.status === "주문 배송 중";
    const canCancel = order.status === "주문 접수 중";

    const item = document.createElement("div");
    item.className =
      "orders__item" + (isCancelling ? " is-cancelling" : "") + (isShipping ? " is-shipping" : "");
    item.innerHTML = `
      <div class="orders__item-status-row">
        <span class="orders__item-status-icon" data-status-icon></span>
        <span class="orders__item-status">${order.status}</span>
      </div>
      <div class="orders__item-product">
        <img class="orders__item-image" src="${product?.image || ""}" alt="${product?.name || ""}" />
        <div>
          <p class="orders__item-price">${order.pointsUsed.toLocaleString()} 포인트</p>
          <p class="orders__item-name">${product?.name || "알 수 없는 제품"}</p>
        </div>
      </div>
      <div class="orders__item-divider"></div>
      <div class="orders__item-remaining">
        <span class="orders__item-remaining-label">사용 후 포인트</span>
        <span class="orders__item-remaining-value">${order.remainingAfter.toLocaleString()} 포인트</span>
      </div>
      <button class="orders__item-cancel" type="button" ${canCancel ? "" : "disabled"} data-cancel="${order.id}">주문 취소</button>
    `;
    item.querySelector("[data-status-icon]").appendChild(createElement(Info, { width: 14, height: 14 }));
    listEl.appendChild(item);
  });

  listEl.querySelectorAll("[data-cancel]:not(:disabled)").forEach((btn) => {
    btn.addEventListener("click", () => openCancelModal(btn.dataset.cancel));
  });
}

function openCancelModal(orderId) {
  openModal({
    title: "주문 취소",
    body: "주문을 취소 하시겠습니까?",
    confirmLabel: "주문 취소",
    onConfirm: async () => {
      await cancelOrder(orderId);
      showToast("주문 취소를 요청했습니다.");
      const orders = await getOrders();
      renderList(orders);
    },
  });
}
