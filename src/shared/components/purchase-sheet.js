/*
  구매 확인 바텀시트 — Figma "구매창"(4278:893) 실측 그대로 커스텀 마크업으로 구현.
  shared/components/bottom-sheet.js(제목+X 헤더 있는 공용 UI)는 이 디자인과 안 맞아
  별도 컴포넌트로 분리. 상점 목록(user/store/index.js)과 구매(user/store/buy.js)
  양쪽에서 재사용 — 구매 페이지에서는 backdrop:false로 배경 딤 없이 사용한다
  (외부 클릭 시 닫히는 동작 자체는 유지하기 위해 backdrop 엘리먼트는 그대로 두고
  시각적 딤/블러만 뺀다 — purchase-sheet--no-backdrop 참조).

  openPurchaseSheet({ name, remaining, submitLabel, onConfirm, backdrop = true, onClose })

  onConfirm은 async 가능 — {ok:false, message}를 반환하면 에러 토스트를 띄우고 시트를 유지한다
  (bottom-sheet.js와 동일한 규약). onClose는 X/배경 클릭이든 Esc든 확인 성공 후 닫힘이든
  실제로 시트가 닫힐 때 항상 한 번 호출된다(호출측에서 체크박스 등 트리거 상태를 되돌릴 때 사용).
*/

import { createCtaButton } from "./cta-button.js";
import { showToast } from "./toast.js";
import { lockScroll, unlockScroll } from "../js/utils.js";

export function openPurchaseSheet({ name, remaining, submitLabel, onConfirm, backdrop = true, onClose } = {}) {
  const el = document.createElement("div");
  el.className = "purchase-sheet" + (backdrop ? "" : " purchase-sheet--no-backdrop");
  el.innerHTML = `
    <div class="purchase-sheet__backdrop" data-sheet-close></div>
    <div class="purchase-sheet__panel" role="dialog" aria-label="${name}">
      <div class="purchase-sheet__row">
        <span class="purchase-sheet__name">${name}</span>
        <span class="purchase-sheet__remaining">
          <span class="purchase-sheet__remaining-badge">P</span>
          <span class="purchase-sheet__remaining-text">결제 후 포인트 ${remaining.toLocaleString()}</span>
        </span>
      </div>
      <div data-cta></div>
      <p class="purchase-sheet__disclaimer">주문 내용을 확인 하였으며, 정보 제공 등에 동의 합니다.</p>
    </div>
  `;
  document.querySelector("#overlay-root").appendChild(el);
  lockScroll();

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    el.classList.remove("is-open");
    unlockScroll();
    setTimeout(() => el.remove(), 250);
    if (onClose) onClose();
  }

  const cta = createCtaButton({
    label: submitLabel,
    disabled: false,
    onClick: async () => {
      if (!onConfirm) return close();
      cta.setLoading(true);
      const result = await onConfirm();
      cta.setLoading(false);
      if (result && result.ok === false) {
        showToast(result.message || "요청에 실패 했습니다.", "error");
        return;
      }
      close();
    },
  });
  el.querySelector("[data-cta]").appendChild(cta.el);

  el.addEventListener("click", (event) => {
    if (event.target.closest("[data-sheet-close]")) close();
  });

  window.addEventListener(
    "keydown",
    function escHandler(event) {
      if (event.key === "Escape") close();
    },
    { once: true }
  );

  requestAnimationFrame(() => el.classList.add("is-open"));

  return { el, close };
}
