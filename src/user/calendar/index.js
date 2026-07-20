/*
  캘린더 (/user/calendar/)
  참조: spec.md "캘린더", Figma 캘린더-기본(4107:736)/캘린더-리스트(4006:1076)/
        캘린더-바텀시트(4008:405)

  - 화살표로 월 이동, 날짜 클릭으로 선택 → 하단 "일정 바텀시트"가 해당 날짜로 갱신된다.
  - 하단 바텀시트는 모달이 아니라 페이지에 항상 붙어 있는 독(dock)형 패널이다. 핸들을
    드래그(포인터 이벤트)하면 패널 높이를 최소~최대 사이에서 조절할 수 있다(spec.md
    "바텀 시트 - 공통 UI" 9번: 높이 조절 가능한 바텀 시트는 최대 높이로 확장 가능).
  - 더보기(⋮) → 고정/수정/삭제는 홈(user/plans/index.js)과 동일하게
    shared/components/bottom-sheet.js의 openListBottomSheet를 그대로 재사용한다
    (Figma 4008:405가 홈의 "일정 - 바텀 시트"와 동일 레이아웃).
*/

import { mountHeader } from "/shared/components/header.js";
import { mountNavDrawer } from "/shared/components/nav-drawer.js";
import { openListBottomSheet } from "/shared/components/bottom-sheet.js";
import { renderSkeleton } from "/shared/components/skeleton.js";
import { getPlansByDate, pinPlan, deletePlan, hasUnreadNotifications } from "/shared/js/api.js";
import { toISODate, requireAuth } from "/shared/js/utils.js";
import {
  createElement,
  ChevronLeft,
  ChevronRight,
  EllipsisVertical,
  Plus,
} from "https://cdn.jsdelivr.net/npm/lucide@latest/+esm";

await requireAuth();

mountHeader("#header", { hasNotification: await hasUnreadNotifications() });
mountNavDrawer("#nav-drawer");

const app = document.querySelector("#app");
const today = new Date();
let viewMonth = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedDate = today;

const MIN_VIEWPORT_HEIGHT = 600; // spec.md 타블렛 최소 높이

app.innerHTML = `
  <div class="calendar">
    <div class="calendar__month">
      <div class="calendar__nav">
        <button class="calendar__nav-btn" type="button" aria-label="이전 달" data-calendar-prev></button>
        <p class="calendar__nav-label" data-calendar-month></p>
        <button class="calendar__nav-btn" type="button" aria-label="다음 달" data-calendar-next></button>
      </div>
      <div class="calendar__weekdays">
        ${["일", "월", "화", "수", "목", "금", "토"]
          .map((d, i) => `<span class="calendar__weekday${i === 0 || i === 6 ? " calendar__weekday--weekend" : ""}">${d}</span>`)
          .join("")}
      </div>
      <div class="calendar__grid" data-calendar-grid></div>
    </div>
    <div class="calendar-sheet" data-calendar-sheet>
      <div class="calendar-sheet__handle" data-calendar-handle>
        <span class="calendar-sheet__handle-bar"></span>
      </div>
      <div class="calendar-sheet__head">
        <p class="calendar-sheet__title" data-calendar-title></p>
        <button class="calendar-sheet__add" type="button" aria-label="일정 추가" data-calendar-add></button>
      </div>
      <div class="calendar-sheet__body" data-calendar-body></div>
    </div>
  </div>
`;

document.querySelector("[data-calendar-prev]").appendChild(createElement(ChevronLeft, { size: 24 }));
document.querySelector("[data-calendar-next]").appendChild(createElement(ChevronRight, { size: 24 }));
document.querySelector("[data-calendar-add]").appendChild(createElement(Plus, { size: 14 }));

document.querySelector("[data-calendar-prev]").addEventListener("click", () => {
  viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1);
  renderMonth();
  updateSheetLayout();
});
document.querySelector("[data-calendar-next]").addEventListener("click", () => {
  viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
  renderMonth();
  updateSheetLayout();
});
document.querySelector("[data-calendar-add]").addEventListener("click", () => {
  location.href = "/user/plans/add";
});

// 시트 기본 높이가 달력 실측 높이에서 역산되므로(updateSheetLayout), 달력 그리드부터
// 채워 넣은 뒤에 레이아웃을 계산해야 한다 — 순서를 바꾸면 빈 달력 기준으로 계산된다.
renderMonth();
initSheetResize();
loadDayPlans();

function renderMonth() {
  document.querySelector("[data-calendar-month]").textContent =
    `${viewMonth.getFullYear()}년 ${viewMonth.getMonth() + 1}월`;

  const gridEl = document.querySelector("[data-calendar-grid]");
  gridEl.innerHTML = "";

  const firstWeekday = viewMonth.getDay(); // 0=일 ... 6=토
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const selectedISO = toISODate(selectedDate);

  for (let i = 0; i < firstWeekday; i++) {
    gridEl.appendChild(document.createElement("div"));
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    const dow = date.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const isSelected = toISODate(date) === selectedISO;

    const cell = document.createElement("div");
    cell.className = "calendar__day";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "calendar__day-btn" +
      (isWeekend ? " calendar__day-btn--weekend" : "") +
      (isSelected ? " calendar__day-btn--selected" : "");
    btn.textContent = String(day);
    btn.addEventListener("click", () => {
      selectedDate = date;
      renderMonth();
      loadDayPlans();
    });

    cell.appendChild(btn);
    gridEl.appendChild(cell);
  }
}

async function loadDayPlans() {
  renderSheetSkeleton();

  const iso = toISODate(selectedDate);
  const plans = await getPlansByDate(iso);
  renderSheet(plans);
}

/** Figma "캘린더 - 스켈레톤"(4095:557) — 날짜/월 그리드는 즉시 계산되는 로컬 값이라 스켈레톤이
    필요 없고, 서버 응답을 기다리는 시트 쪽만 표시한다: 제목 옆 개수 배지(27x21) + 목록 자리에
    한 줄짜리 자리표시자(리스트 항목 1개와 동일한 343x60 비율) 하나. */
function renderSheetSkeleton() {
  const titleEl = document.querySelector("[data-calendar-title]");
  const bodyEl = document.querySelector("[data-calendar-body]");

  titleEl.innerHTML = `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일 일정 `;
  const countSkeleton = document.createElement("span");
  countSkeleton.className = "calendar-sheet__count-skeleton";
  titleEl.appendChild(countSkeleton);
  renderSkeleton(countSkeleton, { width: 27, height: 21 });

  bodyEl.innerHTML = "";
  const itemSkeleton = document.createElement("div");
  bodyEl.appendChild(itemSkeleton);
  renderSkeleton(itemSkeleton, { width: "100%", height: 60 });
}

function renderSheet(plans) {
  const titleEl = document.querySelector("[data-calendar-title]");
  const bodyEl = document.querySelector("[data-calendar-body]");

  titleEl.innerHTML =
    `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일 일정 ` +
    `<span class="calendar-sheet__count">${plans.length}개</span>`;

  bodyEl.innerHTML = "";

  if (plans.length === 0) {
    bodyEl.innerHTML = `
      <div class="calendar-sheet__empty">
        <img class="calendar-sheet__empty-image" src="/images/empty_list.png" alt="일정 없음" />
      </div>
    `;
    return;
  }

  const list = document.createElement("div");
  list.className = "calendar-sheet__list";

  plans.forEach((plan) => {
    const item = document.createElement("div");
    item.className = "calendar-sheet__item";
    item.innerHTML = `
      <span class="calendar-sheet__item-time">${plan.time}</span>
      <span class="calendar-sheet__item-text">
        <span class="calendar-sheet__item-title">${plan.title}</span>
        ${plan.pinned ? '<span class="calendar-sheet__item-pin-dot" aria-label="고정됨"></span>' : ""}
      </span>
      <button class="calendar-sheet__item-more" type="button" aria-label="더보기" data-more></button>
    `;
    item.querySelector("[data-more]").appendChild(createElement(EllipsisVertical, { size: 18 }));
    item.querySelector("[data-more]").addEventListener("click", () => openMoreSheet(plan));

    list.appendChild(item);
  });

  bodyEl.appendChild(list);
}

function openMoreSheet(plan) {
  openListBottomSheet({
    title: plan.title,
    items: [
      { value: "pin", label: "고정" },
      { value: "edit", label: "수정" },
      { value: "delete", label: "삭제" },
    ],
    defaultValue: "pin",
    onSubmit: async (value) => {
      if (value === "edit") {
        location.href = `/user/plans/edit?planId=${plan.id}`;
        return { ok: true };
      }
      if (value === "pin") {
        await pinPlan(plan.id);
        loadDayPlans();
        return { ok: true, message: "일정을 상단에 고정했습니다." };
      }
      if (value === "delete") {
        await deletePlan(plan.id);
        loadDayPlans();
        return { ok: true, message: "일정을 삭제했습니다." };
      }
      return { ok: false };
    },
  });
}

function getHeaderHeight() {
  return (
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-height")) || 56
  );
}

// 뷰포트 높이는 실제 window.innerHeight가 아니라 최소 600px(spec.md 타블렛 최소 높이)로
// 바닥을 깔아서, 브라우저 창을 그보다 짧게 줄여도 계산값이 음수/0으로 찌그러지며 레이어가
// 깨지지 않게 한다.
function getViewportHeight() {
  return Math.max(window.innerHeight, MIN_VIEWPORT_HEIGHT);
}

// 헤더가 투명해져 시트와 배경이 이어지므로, 드래그로 늘릴 수 있는 시트의 최대 높이는
// "뷰포트 - 헤더"로 제한해 헤더 영역만은 절대 침범하지 않게 한다.
function getSheetMaxHeight() {
  return Math.max(0, getViewportHeight() - getHeaderHeight());
}

// 시트의 최소 높이이자 마운트/월 전환 시 "기본" 높이 = 뷰포트 - 헤더 - 달력 실측 높이.
// 달력은 user/calendar/index.css의 .calendar 주석대로 문서 흐름에 맡겨 그 달의 주 수
// (5주/6주)만큼 자연스럽게 차지하므로, 여기서 그 실측값을 읽어 시트가 "남는 공간"만 정확히
// 가져가게 역산한다. 예전엔 이 값에 180px 절대 하한선을 씌웠는데, 모바일처럼 뷰포트가 좁아
// 남는 공간이 180보다 작아지면 그 하한선 때문에 시트가 실제 남는 공간보다 더 크게 잡혀
// 달력 아래쪽을 가려버리는 문제가 있었다 — 그래서 지금은 하한선 없이(0 미만만 방지) 계산값을
// 그대로 쓴다. 이 값이 곧 드래그로 줄일 수 있는 최소 높이이기도 하다(더 줄이면 달력과 시트
// 사이에 빈 배경만 남을 뿐 의미가 없음).
function computeSheetMinHeight() {
  const calendarHeight = document.querySelector(".calendar__month").getBoundingClientRect().height;
  return Math.max(0, getViewportHeight() - getHeaderHeight() - calendarHeight);
}

// 달력 실측 높이가 바뀔 수 있는 시점(마운트, 월 전환, 리사이즈)마다 호출해 시트를 그 시점
// 기준의 새 기본(=최소) 높이로 맞춘다 — 핸들로 늘리거나 줄인 값이 있어도 여기서 되돌린다
// (시트 높이는 항상 그 순간의 달력 값을 따라 유동적으로 바뀌어야 한다는 요구사항).
function updateSheetLayout() {
  const sheet = document.querySelector("[data-calendar-sheet]");
  sheet.style.maxHeight = `${getSheetMaxHeight()}px`;
  sheet.style.height = `${computeSheetMinHeight()}px`;
}

/** 바텀시트 핸들 드래그로 패널 높이 조절(spec.md "바텀 시트 - 공통 UI" 9번). 시트는
    position:fixed + z-index로 달력보다 위 레이어에 있어서, 기본 높이보다 커지면 달력 위로
    그대로 겹쳐 덮는다(의도된 동작). */
function initSheetResize() {
  const sheet = document.querySelector("[data-calendar-sheet]");
  const handle = document.querySelector("[data-calendar-handle]");

  updateSheetLayout();
  window.addEventListener("resize", updateSheetLayout);

  let startY = 0;
  let startHeight = 0;

  function onMove(event) {
    const delta = startY - event.clientY;
    const next = Math.min(getSheetMaxHeight(), Math.max(computeSheetMinHeight(), startHeight + delta));
    sheet.style.height = `${next}px`;
  }

  function onUp() {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
  }

  handle.addEventListener("pointerdown", (event) => {
    startY = event.clientY;
    startHeight = sheet.getBoundingClientRect().height;
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    event.preventDefault();
  });
}
