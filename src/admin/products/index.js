/*
  관리자 - 상점 관리 (/admin/products/)
  참조: spec.md "상점 관리", Figma "관리자 - 상점 관리 - 기본"(4392:2654) /
        "관리자 - 상점 관리 - 제품 수정"(4404:1119)

  - 좌측 제품 목록 + 우측 추가/수정 폼(같은 폼을 재사용, 수정 버튼 클릭 시 프리필).
  - 카테고리는 spec.md의 "씨앗·식물·묘목"이 아니라 상점(user/store/products)에서 이미 확정한
    실제 카테고리 "나무"/"다육식물"을 그대로 사용 — Figma 제품 수정(4404:1119) 목업의 드롭다운엔
    "묘목"이 선택돼 있었지만, 정작 그 제품(사과 나무 묘목)은 목록에 "나무"로 분류돼 있어
    드롭다운 쪽이 갱신 안 된 낡은 값으로 판단(§9 참조).
  - Figma엔 폼 제출 버튼이 없어(레이아웃 끝에서 잘림으로 추정) 실제 동작을 위해
    공용 `createCtaButton`으로 추가/수정 버튼을 붙였다.
*/

import { mountAdminHeader } from "/shared/components/admin-header.js";
import { createCtaButton } from "/shared/components/cta-button.js";
import { showToast } from "/shared/components/toast.js";
import { getProducts, addProduct, updateProduct, deleteProduct } from "/shared/js/api.js";
import { createElement, ImageUp, ChevronDown } from "https://cdn.jsdelivr.net/npm/lucide@latest/+esm";

mountAdminHeader("#admin-header");

const CATEGORIES = ["나무", "다육식물"];

const app = document.querySelector("#app");
app.innerHTML = `
  <div class="admin-content">
    <p class="admin-content__title">제품 <span class="admin-content__count" data-product-count>0개</span></p>
    <div class="admin-products">
      <div class="admin-products__list" data-product-list></div>
      <div class="product-form" data-product-form></div>
    </div>
  </div>
`;

let editingId = null;
let currentImage = null;
let cta = null;

renderForm();
loadProducts();

async function loadProducts() {
  const items = await getProducts();
  renderList(items);
}

function renderList(items) {
  document.querySelector("[data-product-count]").textContent = `${items.length}개`;

  const list = document.querySelector("[data-product-list]");
  list.innerHTML = "";

  items.forEach((product) => {
    const row = document.createElement("div");
    row.className = "product-row";
    row.innerHTML = `
      <div class="product-row__thumb"><img src="${product.image}" alt="" /></div>
      <div class="product-row__info">
        <span class="product-row__category">${product.category}</span>
        <span class="product-row__name">${product.name}</span>
        <span class="product-row__price">${product.price.toLocaleString()} 포인트</span>
      </div>
      <div class="product-row__actions">
        <button class="product-row__action" type="button" data-edit>수정</button>
        <button class="product-row__action" type="button" data-delete>삭제</button>
      </div>
    `;
    row.querySelector("[data-edit]").addEventListener("click", () => startEdit(product));
    row.querySelector("[data-delete]").addEventListener("click", () => removeProduct(product.id));
    list.appendChild(row);
  });
}

async function removeProduct(id) {
  await deleteProduct(id);
  if (editingId === id) {
    editingId = null;
    currentImage = null;
    renderForm();
  }
  showToast("제품을 삭제했습니다.");
  loadProducts();
}

function startEdit(product) {
  editingId = product.id;
  currentImage = product.image;
  renderForm(product);
}

function renderForm(values = {}) {
  const isEdit = editingId != null;
  const formEl = document.querySelector("[data-product-form]");

  formEl.innerHTML = `
    <p class="product-form__label">제품 사진 추가</p>
    <div class="product-form__photo" data-photo-area></div>

    <p class="product-form__label">제품명</p>
    <input class="product-form__input" type="text" placeholder="제품명을 작성해 주세요." data-field="name" value="${values.name ?? ""}" />

    <p class="product-form__label">제품 가격</p>
    <input class="product-form__input" type="number" min="0" placeholder="제품 가격을 작성해 주세요." data-field="price" value="${values.price ?? ""}" />

    <p class="product-form__label">제품 카테고리</p>
    <div class="product-form__select-wrap">
      <select class="product-form__select" data-field="category" required>
        <option value="" disabled ${!values.category ? "selected" : ""}>카테고리를 선택해 주세요.</option>
        ${CATEGORIES.map(
          (c) => `<option value="${c}" ${values.category === c ? "selected" : ""}>${c}</option>`,
        ).join("")}
      </select>
    </div>

    <div class="product-form__cta" data-cta-slot></div>
  `;

  formEl.querySelector(".product-form__select-wrap").appendChild(createElement(ChevronDown, { size: 18 }));

  renderPhotoArea(values.image ?? null);

  cta = createCtaButton({
    label: isEdit ? "수정하기" : "추가하기",
    disabled: true,
    onClick: submit,
  });
  formEl.querySelector("[data-cta-slot]").appendChild(cta.el);

  ["name", "price", "category"].forEach((field) => {
    formEl.querySelector(`[data-field="${field}"]`).addEventListener("input", refreshDisabled);
    formEl.querySelector(`[data-field="${field}"]`).addEventListener("change", refreshDisabled);
  });
  refreshDisabled();
}

function renderPhotoArea(image) {
  const area = document.querySelector("[data-photo-area]");
  area.innerHTML = image
    ? `
      <img class="product-form__preview" src="${image}" alt="" />
      <label class="product-form__photo-trigger">
        <input type="file" accept="image/*" hidden data-photo-input />
        <span data-photo-icon></span>
        <span>사진 변경</span>
      </label>
    `
    : `
      <label class="product-form__photo-trigger product-form__photo-trigger--full">
        <input type="file" accept="image/*" hidden data-photo-input />
        <span data-photo-icon></span>
        <span>사진 추가</span>
      </label>
    `;

  area.querySelector("[data-photo-icon]").appendChild(createElement(ImageUp, { size: 24 }));

  area.querySelector("[data-photo-input]").addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      currentImage = reader.result;
      renderPhotoArea(currentImage);
      refreshDisabled();
    };
    reader.readAsDataURL(file);
  });
}

function refreshDisabled() {
  const formEl = document.querySelector("[data-product-form]");
  const name = formEl.querySelector('[data-field="name"]').value.trim();
  const price = formEl.querySelector('[data-field="price"]').value;
  const category = formEl.querySelector('[data-field="category"]').value;
  cta?.setDisabled(!(name && price && category && currentImage));
}

async function submit() {
  const formEl = document.querySelector("[data-product-form]");
  const name = formEl.querySelector('[data-field="name"]').value.trim();
  const price = Number(formEl.querySelector('[data-field="price"]').value);
  const category = formEl.querySelector('[data-field="category"]').value;

  cta.setLoading(true);
  const payload = { name, price, category, image: currentImage };

  if (editingId != null) {
    await updateProduct(editingId, payload);
    showToast("제품을 수정했습니다.");
  } else {
    await addProduct(payload);
    showToast("제품을 추가했습니다.");
  }
  cta.setLoading(false);

  editingId = null;
  currentImage = null;
  renderForm();
  loadProducts();
}
