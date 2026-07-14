/*
  일정 추가/수정 공용 폼 — add.js/edit.js가 그대로 재사용한다(blueprint.md §4단계:
  "user/plans/edit.* — add 로직 재사용 + ?planId= 프리필").
  참조: spec.md "일정 추가"/"일정 수정", Figma "일정 추가/수정"(4355:1141) · 휠 피커 바텀 시트
        (4079:1055 시간, 4079:1096 시작 날짜, 4208:872 종료 날짜) · 주기 바텀 시트(4080:341)

  - 종료 날짜는 "일정 주기"가 당일일 때만 필수고, 다른 주기를 고르면 값이 사라지고
    선택도 막힌다(spec.md 6번). 반복 일정을 실제로 여러 날짜에 걸쳐 만드는 로직은
    목데이터 계층에 없다 — shared/js/api.js의 addPlan()/updatePlan() 주석 참조.
  - CTA 활성화 조건: 제목이 있고, (주기가 당일이면 종료 날짜도 있어야) 활성화된다.
    시간/시작 날짜는 항상 기본값이 있어 조건에서 제외.
  - initPlanForm({ pageTitle, submitLabel, initial, onSubmit })
    - initial: { title, hour, minute, startDate:Date, endDate:Date|null, recurrence }
    - onSubmit(payload): CTA 클릭 시 호출된다. 성공/리다이렉트 처리는 호출부(add.js/edit.js) 책임.
*/

import { mountAppBar } from "/shared/components/app-bar.js";
import { createCtaButton } from "/shared/components/cta-button.js";
import { openListBottomSheet } from "/shared/components/bottom-sheet.js";
import { openTimeWheelPicker, openDateWheelPicker } from "/shared/components/wheel-picker.js";
import { formatDotDate } from "/shared/js/utils.js";
import { createElement, PencilLine, ChevronRight } from "https://cdn.jsdelivr.net/npm/lucide@latest/+esm";

const RECURRENCE_OPTIONS = [
  { value: "day", label: "당일" },
  { value: "daily", label: "매일" },
  { value: "weekly", label: "매주" },
  { value: "biweekly", label: "격주" },
  { value: "monthly", label: "매월" },
  { value: "yearly", label: "매년" },
];

export function initPlanForm({ pageTitle, submitLabel, initial, onSubmit }) {
  mountAppBar("#app-bar", {
    title: pageTitle,
    onBack: () => {
      location.href = "/user/plans/";
    },
  });

  const state = { ...initial };

  const app = document.querySelector("#app");
  app.innerHTML = `
    <div class="plan-add">
      <div class="plan-add__textarea-wrap">
        <span class="plan-add__textarea-icon" data-title-icon></span>
        <textarea
          class="plan-add__textarea"
          data-title
          maxlength="30"
          rows="3"
          placeholder="일정을 작성해 주세요"
        ></textarea>
        <span class="plan-add__counter" data-counter>0 / 30</span>
      </div>

      <button class="plan-add__row" type="button" data-row="time">
        <span class="plan-add__label">일정 시간<span class="plan-add__required">*</span></span>
        <span class="plan-add__value-group">
          <span class="plan-add__value" data-value="time"></span>
          <span class="plan-add__chevron" data-chevron></span>
        </span>
      </button>

      <div class="plan-add__card">
        <button class="plan-add__row" type="button" data-row="start">
          <span class="plan-add__label">시작 날짜<span class="plan-add__required">*</span></span>
          <span class="plan-add__value-group">
            <span class="plan-add__value" data-value="start"></span>
            <span class="plan-add__chevron" data-chevron></span>
          </span>
        </button>
        <button class="plan-add__row" type="button" data-row="end">
          <span class="plan-add__label">종료 날짜<span class="plan-add__required" data-end-required>*</span></span>
          <span class="plan-add__value-group">
            <span class="plan-add__value" data-value="end"></span>
            <span class="plan-add__chevron" data-chevron></span>
          </span>
        </button>
      </div>

      <button class="plan-add__row" type="button" data-row="recurrence">
        <span class="plan-add__label">일정 주기</span>
        <span class="plan-add__value-group">
          <span class="plan-add__value" data-value="recurrence"></span>
          <span class="plan-add__chevron" data-chevron></span>
        </span>
      </button>
    </div>
  `;

  document.querySelector("[data-title-icon]").appendChild(createElement(PencilLine, { width: 12, height: 12 }));
  document
    .querySelectorAll("[data-chevron]")
    .forEach((el) => el.appendChild(createElement(ChevronRight, { width: 16, height: 16 })));

  const titleInput = document.querySelector("[data-title]");
  titleInput.value = state.title;
  document.querySelector("[data-counter]").textContent = `${state.title.length} / 30`;
  titleInput.addEventListener("input", () => {
    state.title = titleInput.value;
    document.querySelector("[data-counter]").textContent = `${titleInput.value.length} / 30`;
    updateCtaState();
  });

  document.querySelector('[data-row="time"]').addEventListener("click", () => {
    openTimeWheelPicker({
      hour: state.hour,
      minute: state.minute,
      onConfirm: (hour, minute) => {
        state.hour = hour;
        state.minute = minute;
        renderValues();
      },
    });
  });

  document.querySelector('[data-row="start"]').addEventListener("click", () => {
    openDateWheelPicker({
      title: "시작 날짜",
      date: state.startDate,
      onConfirm: (date) => {
        state.startDate = date;
        // 종료 날짜가 새 시작 날짜보다 이르면 시작 날짜로 같이 당겨서 항상 유효하게 유지한다
        if (state.endDate && state.endDate < date) state.endDate = date;
        renderValues();
        updateCtaState();
      },
    });
  });

  document.querySelector('[data-row="end"]').addEventListener("click", () => {
    if (state.recurrence !== "day") return; // 당일이 아니면 종료 날짜 선택 자체를 막는다
    openDateWheelPicker({
      title: "종료 날짜",
      date: state.endDate || state.startDate,
      minDate: state.startDate,
      onConfirm: (date) => {
        state.endDate = date;
        renderValues();
        updateCtaState();
      },
    });
  });

  document.querySelector('[data-row="recurrence"]').addEventListener("click", () => {
    openListBottomSheet({
      title: "일정 주기",
      items: RECURRENCE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
      defaultValue: state.recurrence,
      onSubmit: (value) => {
        state.recurrence = value;
        // spec.md "일정 추가" 6번: 당일이 아닌 주기를 고르면 종료 날짜는 값 없음으로 처리된다
        state.endDate = value === "day" ? state.startDate : null;
        renderValues();
        updateCtaState();
        return { ok: true, message: "일정 주기를 변경했습니다." };
      },
    });
  });

  const cta = createCtaButton({
    label: submitLabel,
    disabled: true,
    onClick: async () => {
      cta.setLoading(true);
      await onSubmit({
        title: state.title.trim(),
        time: `${String(state.hour).padStart(2, "0")}:${String(state.minute).padStart(2, "0")}`,
        startDate: toISODateOnly(state.startDate),
        endDate: state.endDate ? toISODateOnly(state.endDate) : null,
        recurrence: state.recurrence,
      });
      cta.setLoading(false);
    },
  });
  cta.el.classList.add("plan-add__cta");
  document.querySelector(".plan-add").after(cta.el);

  function toISODateOnly(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function renderValues() {
    document.querySelector('[data-value="time"]').textContent =
      `${String(state.hour).padStart(2, "0")}:${String(state.minute).padStart(2, "0")}`;
    document.querySelector('[data-value="start"]').textContent = formatDotDate(state.startDate);
    document.querySelector('[data-value="end"]').textContent = state.endDate
      ? formatDotDate(state.endDate)
      : "없음";
    document.querySelector('[data-value="recurrence"]').textContent =
      RECURRENCE_OPTIONS.find((o) => o.value === state.recurrence)?.label || "당일";

    const endRow = document.querySelector('[data-row="end"]');
    const isDay = state.recurrence === "day";
    endRow.classList.toggle("is-disabled", !isDay);
    document.querySelector("[data-end-required]").hidden = !isDay;
  }

  function updateCtaState() {
    const hasTitle = state.title.trim().length > 0;
    const hasEndDate = state.recurrence !== "day" || Boolean(state.endDate);
    cta.setDisabled(!(hasTitle && hasEndDate));
  }

  renderValues();
  updateCtaState();
}
