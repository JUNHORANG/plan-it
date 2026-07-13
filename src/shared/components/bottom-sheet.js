/*
  바텀 시트 — 공통 UI 컴포넌트
  참조: spec.md "바텀 시트 - 공통 UI", Figma "일정 - 바텀 시트"(4006:323)

  동작
  1. X 아이콘 클릭 → 닫기
  2. 배경(외부 영역) 클릭 → 닫기
  3. 아래→위 애니메이션으로 노출
  4. 목록형은 선택한 항목을 색상으로 강조
  5. onSubmit 콜백이 요청을 흉내내는 동안 CTA에 로딩 스피너 표시
  6. 성공(result.ok !== false) → 닫히고 성공 토스트, 실패 → 실패 토스트 + 시트 유지

  openBottomSheet()는 임의 콘텐츠를 넣을 수 있는 범용 셸이고,
  openListBottomSheet()는 그 위에 만든 "목록형" 헬퍼(고정/수정/삭제, 일정 주기 등 재사용).
*/

import { createElement, X } from "https://cdn.jsdelivr.net/npm/lucide@latest/+esm";
import { createCtaButton } from "./cta-button.js";
import { showToast } from "./toast.js";
import { lockScroll, unlockScroll } from "../js/utils.js";

let active = null;

export function closeBottomSheet() {
  if (!active) return;
  const { el } = active;
  el.classList.remove("is-open");
  active = null;
  unlockScroll();
  setTimeout(() => el.remove(), 250);
}

export function openBottomSheet({ title = "", render, submitLabel = "저장", getValue, onSubmit } = {}) {
  closeBottomSheet();
  lockScroll();

  const root = document.querySelector("#overlay-root");
  const el = document.createElement("div");
  el.className = "bottom-sheet";
  el.innerHTML = `
    <div class="bottom-sheet__backdrop" data-sheet-close></div>
    <div class="bottom-sheet__panel" role="dialog" aria-label="${title}">
      <div class="bottom-sheet__header">
        <h2 class="bottom-sheet__title">${title}</h2>
        <button class="bottom-sheet__close" type="button" aria-label="닫기" data-sheet-close></button>
      </div>
      <div class="bottom-sheet__body"></div>
      <div class="bottom-sheet__footer"></div>
    </div>
  `;
  root.appendChild(el);

  el.querySelector(".bottom-sheet__close").appendChild(createElement(X, { size: 24 }));

  const body = el.querySelector(".bottom-sheet__body");
  if (render) render(body);

  const submit = createCtaButton({
    label: submitLabel,
    disabled: getValue ? getValue() == null : false,
    onClick: async () => {
      if (!onSubmit) return closeBottomSheet();
      submit.setLoading(true);
      const result = await onSubmit(getValue ? getValue() : undefined);
      submit.setLoading(false);

      if (!result || result.ok !== false) {
        closeBottomSheet();
        showToast(result?.message || "완료했습니다.");
      } else {
        showToast(result.message || "요청에 실패 했습니다.", "error");
      }
    },
  });
  el.querySelector(".bottom-sheet__footer").appendChild(submit.el);

  el.addEventListener("click", (event) => {
    if (event.target.closest("[data-sheet-close]")) closeBottomSheet();
  });

  const escHandler = (event) => {
    if (event.key === "Escape") closeBottomSheet();
  };
  window.addEventListener("keydown", escHandler, { once: true });

  requestAnimationFrame(() => el.classList.add("is-open"));

  active = {
    el,
    refreshDisabled: () => submit.setDisabled(getValue ? getValue() == null : false),
  };
  return active;
}

/** 목록형 바텀시트 (예: 고정/수정/삭제, 일정 주기 등) */
export function openListBottomSheet({ title, items, defaultValue, submitLabel = "저장", onSubmit }) {
  let selected = defaultValue ?? items[0]?.value ?? null;

  return openBottomSheet({
    title,
    submitLabel,
    getValue: () => selected,
    render(body) {
      const list = document.createElement("div");
      list.className = "bottom-sheet__list";

      items.forEach((item) => {
        const row = document.createElement("button");
        row.type = "button";
        row.className = "bottom-sheet__list-item" + (item.value === selected ? " is-selected" : "");
        row.textContent = item.label;
        row.addEventListener("click", () => {
          selected = item.value;
          list.querySelectorAll(".bottom-sheet__list-item").forEach((el) => {
            el.classList.toggle("is-selected", el === row);
          });
          active?.refreshDisabled();
        });
        list.appendChild(row);
      });

      body.appendChild(list);
    },
    onSubmit,
  });
}
