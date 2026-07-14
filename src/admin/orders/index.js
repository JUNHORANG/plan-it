/*
  관리자 - 주문 관리 (/admin/orders/)
  참조: spec.md "주문 관리", Figma "관리자 - 주문 관리 - 주문 확인"(4388:2254 기본 / 4392:2529 모달)

  - 주문 상태는 점(dot) 색상으로만 표시: 주문 접수 중=주황(accent), 취소 접수 중=빨강(error),
    주문 배송 중=초록(primary). user/profile/orders와 동일한 상태-색상 규칙(6단계 참조).
  - 접수 중/취소 접수 중 행만 클릭 가능 — 배송 중은 이미 처리 완료된 최종 상태라 클릭 불가.
  - 접수 중 행 클릭 → "배송" 모달(CTA: 배송, 접수중→배송중으로 상태만 변경).
  - 취소 접수 중 행 클릭 → "주문 취소" 모달(CTA: 주문 취소, 성공 시 리스트에서 삭제).
    Figma 4392:2529는 이 두 모달이 같은 위치에 겹쳐 있는 두 변형(배송 모달/취소 모달)이라
    실제로는 주문 상태에 따라 이 중 하나만 열리도록 구현.
*/

import { mountAdminHeader } from "/shared/components/admin-header.js";
import { showToast } from "/shared/components/toast.js";
import { getAdminOrders, shipOrder, cancelAdminOrder } from "/shared/js/api.js";
import { products } from "/shared/js/data.js";
import { createElement, X } from "https://cdn.jsdelivr.net/npm/lucide@latest/+esm";

mountAdminHeader("#admin-header");

const app = document.querySelector("#app");
app.innerHTML = `
  <div class="admin-content">
    <p class="admin-content__title">들어온 주문 <span class="admin-content__count" data-order-count>0개</span></p>
    <div class="admin-table" data-order-table></div>
  </div>
`;

const STATUS_DOT_CLASS = {
  "주문 접수 중": "is-accent",
  "취소 접수 중": "is-error",
  "주문 배송 중": "is-primary",
};

loadOrders();

async function loadOrders() {
  const orders = await getAdminOrders();
  renderOrders(orders);
}

function productFor(order) {
  return products.find((p) => p.id === order.productId);
}

function renderOrders(orders) {
  document.querySelector("[data-order-count]").textContent = `${orders.length}개`;

  const table = document.querySelector("[data-order-table]");
  table.innerHTML = `
    <div class="admin-table__head">
      <span>주문 고객</span>
      <span>주문 상품</span>
      <span>주문 번호</span>
      <span>주문 상태</span>
      <span>주소지</span>
    </div>
    <div class="admin-table__body" data-order-rows></div>
  `;

  const rowsEl = table.querySelector("[data-order-rows]");
  orders.forEach((order) => {
    const clickable = order.status !== "주문 배송 중";
    const row = document.createElement(clickable ? "button" : "div");
    if (clickable) row.type = "button";
    row.className = "admin-table__row" + (clickable ? " is-clickable" : "");
    row.innerHTML = `
      <span>${order.customer}</span>
      <span>${productFor(order)?.name ?? ""}</span>
      <span>${order.id}</span>
      <span class="admin-table__status"><span class="admin-table__dot ${STATUS_DOT_CLASS[order.status]}"></span></span>
      <span>${order.address}</span>
    `;
    if (clickable) {
      row.addEventListener("click", () => openOrderModal(order));
    }
    rowsEl.appendChild(row);
  });
}

function openOrderModal(order) {
  const product = productFor(order);
  const isCancel = order.status === "취소 접수 중";

  const root = document.querySelector("#overlay-root");
  const el = document.createElement("div");
  el.className = "order-modal";
  el.innerHTML = `
    <div class="order-modal__backdrop" data-order-modal-close></div>
    <div class="order-modal__panel" role="dialog" aria-label="${order.status}">
      <p class="order-modal__status ${STATUS_DOT_CLASS[order.status]}">${order.status}</p>
      <button class="order-modal__close" type="button" aria-label="닫기" data-order-modal-close></button>
      <div class="order-modal__body">
        <img class="order-modal__image" src="${product?.image ?? ""}" alt="" />
        <div class="order-modal__info">
          <div class="order-modal__labels">
            <span>주문 번호</span>
            <span>주문 고객</span>
            <span>주문 상품</span>
          </div>
          <div class="order-modal__values">
            <span>${order.id}</span>
            <span>${order.customer}</span>
            <span>${product?.name ?? ""}</span>
          </div>
        </div>
      </div>
      <div class="order-modal__divider"></div>
      <div class="order-modal__address">
        <span>주소지</span>
        <span>${order.address}</span>
      </div>
      <button class="order-modal__cta" type="button" data-order-modal-cta>${isCancel ? "주문 취소" : "배송"}</button>
    </div>
  `;
  root.appendChild(el);

  el.querySelector(".order-modal__close").appendChild(createElement(X, { size: 16 }));

  function close() {
    el.remove();
  }

  el.addEventListener("click", (event) => {
    if (event.target.closest("[data-order-modal-close]")) close();
  });

  el.querySelector("[data-order-modal-cta]").addEventListener("click", async () => {
    if (isCancel) {
      await cancelAdminOrder(order.id);
      showToast("주문을 취소했습니다.");
    } else {
      await shipOrder(order.id);
      showToast("배송 처리했습니다.");
    }
    close();
    loadOrders();
  });
}
