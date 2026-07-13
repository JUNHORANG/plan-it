/*
  모달 — 공통 UI 컴포넌트
  참조: spec.md "모달 - 공통 UI", Figma 재사용 컴포넌트(4132:588) "모달" 섹션(4132:650)

  동작
  1. X 아이콘 클릭 → 닫기
  2. 취소 버튼 클릭 → 닫기
  3. 외부(배경) 클릭 → 닫기
  4. onConfirm 결과가 실패(ok:false)면 에러 토스트 + 모달 유지, 그 외엔 닫힘

  bottom-sheet.js와 동일하게 #overlay-root에 mount 한다.
*/

import { createElement, X } from "https://cdn.jsdelivr.net/npm/lucide@latest/+esm";
import { showToast } from "./toast.js";

let active = null;

export function closeModal() {
  if (!active) return;
  const { el } = active;
  el.classList.remove("is-open");
  active = null;
  setTimeout(() => el.remove(), 200);
}

export function openModal({ title = "", body = "", confirmLabel = "확인", cancelLabel = "취소하기", onConfirm } = {}) {
  closeModal();

  const root = document.querySelector("#overlay-root");
  const el = document.createElement("div");
  el.className = "modal";
  el.innerHTML = `
    <div class="modal__backdrop" data-modal-close></div>
    <div class="modal__panel" role="dialog" aria-label="${title}">
      <div class="modal__head">
        <h2 class="modal__title">${title}</h2>
        <button class="modal__close" type="button" aria-label="닫기" data-modal-close></button>
      </div>
      <p class="modal__body">${body}</p>
      <div class="modal__actions">
        <button class="modal__cancel" type="button" data-modal-close>${cancelLabel}</button>
        <button class="modal__confirm" type="button" data-modal-confirm>${confirmLabel}</button>
      </div>
    </div>
  `;
  root.appendChild(el);

  el.querySelector(".modal__close").appendChild(createElement(X, { size: 18 }));

  el.addEventListener("click", (event) => {
    if (event.target.closest("[data-modal-close]")) closeModal();
  });

  el.querySelector("[data-modal-confirm]").addEventListener("click", async () => {
    if (!onConfirm) return closeModal();
    const result = await onConfirm();
    if (result && result.ok === false) {
      showToast(result.message || "요청에 실패 했습니다.", "error");
      return;
    }
    closeModal();
  });

  const escHandler = (event) => {
    if (event.key === "Escape") closeModal();
  };
  window.addEventListener("keydown", escHandler, { once: true });

  requestAnimationFrame(() => el.classList.add("is-open"));

  active = { el };
  return active;
}
