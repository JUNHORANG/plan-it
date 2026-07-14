/*
  홈 (/user/plans/)
  참조: spec.md "홈", Figma 일정-기본(4066:724)/리스트(4005:67)/스켈레톤(4095:444)

  - "다음 일정" 자리: 완료되지 않은 일정 중 가장 이른 시간 항목의 제목. 일정이 하나도 없으면
    "일정을 추가해 주세요!" 안내 문구로 대체.
  - empty_list 배경 이미지는 선택한 날짜에 일정이 하나도 없을 때만 표시.
  - 금주(월~일) 날짜를 클릭하면 해당 날짜의 일정을 다시 불러온다.

  일정 더보기(⋮) → 고정/수정/삭제 바텀시트, Figma "일정 - 바텀 시트"(4006:323) 기준.
  - 일정 체크박스: 매번 서버 재조회(loadPlans) + 스켈레톤을 띄우면 체크할 때마다 화면이
    깜빡여 UX가 나쁘다. 체크 시엔 로컬 상태만 낙관적으로 바꿔 리스트를 즉시 다시 그리고,
    저장 요청(setPlanDone)은 백그라운드로 보낸다(loadPlans의 500ms 지연·스켈레톤 없음).
    모든 일정이 완료되면 renderList 내부에서 "일정 완료" CTA가 나타나 success.html로 이동한다.
*/

import { mountHeader } from "/shared/components/header.js";
import { mountNavDrawer } from "/shared/components/nav-drawer.js";
import { renderSkeleton, clearSkeleton } from "/shared/components/skeleton.js";
import { openListBottomSheet } from "/shared/components/bottom-sheet.js";
import { maybeShowOnboarding } from "/user/plans/onboarding.js";
import { getPlansByDate, setPlanDone, pinPlan, deletePlan, awardPoints, hasUnreadNotifications } from "/shared/js/api.js";
import { getWeekDates, formatFullDateLabel, toISODate, requireAuth } from "/shared/js/utils.js";
import { createElement, Check, EllipsisVertical, Plus } from "https://cdn.jsdelivr.net/npm/lucide@latest/+esm";

await requireAuth();

mountHeader("#header", { hasNotification: await hasUnreadNotifications() });
mountNavDrawer("#nav-drawer");
maybeShowOnboarding();

const app = document.querySelector("#app");
let selectedDate = new Date();

app.innerHTML = `
  <div class="home">
    <div class="home__meta">
      <p class="home__date" data-home-date></p>
      <h1 class="home__next-title" data-home-next></h1>
    </div>
    <div class="home__week" data-home-week></div>
    <div class="home__plans-head">
      <p class="home__plans-title">오늘의 일정 <span class="home__plans-count" data-home-count>0개</span></p>
      <button class="home__add-btn" type="button" aria-label="일정 추가" data-home-add></button>
    </div>
    <div data-home-body></div>
  </div>
`;

document.querySelector("[data-home-add]").appendChild(createElement(Plus, { size: 14 }));
document.querySelector("[data-home-add]").addEventListener("click", () => {
  location.href = "/user/plans/add.html";
});

renderWeek();
loadPlans();

function renderWeek() {
  const weekEl = document.querySelector("[data-home-week]");
  const days = getWeekDates(selectedDate);
  const selectedISO = toISODate(selectedDate);

  weekEl.innerHTML = "";
  days.forEach((day) => {
    const iso = toISODate(day);
    const dow = day.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const isSelected = iso === selectedISO;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "home__week-day";
    btn.innerHTML = `
      <span class="home__week-day-label${isWeekend ? " home__week-day-label--weekend" : ""}">${day.toLocaleDateString("en-US", { weekday: "short" })}</span>
      <span class="home__week-date${isSelected ? " home__week-date--selected" : ""}">${day.getDate()}</span>
    `;
    btn.addEventListener("click", () => {
      selectedDate = day;
      renderWeek();
      loadPlans();
    });
    weekEl.appendChild(btn);
  });
}

async function loadPlans() {
  const dateLabel = document.querySelector("[data-home-date]");
  const nextTitle = document.querySelector("[data-home-next]");
  const bodyEl = document.querySelector("[data-home-body]");

  dateLabel.textContent = formatFullDateLabel(selectedDate);
  renderSkeleton(nextTitle, { width: 220, height: 29 });
  nextTitle.textContent = "";

  bodyEl.innerHTML = "";
  const listSkeleton = document.createElement("div");
  listSkeleton.style.padding = "0 16px";
  renderSkeleton(listSkeleton, { width: "100%", height: 80 });
  bodyEl.appendChild(listSkeleton);

  const iso = toISODate(selectedDate);
  const plans = await getPlansByDate(iso);

  clearSkeleton(nextTitle);
  renderNextTitle(plans);
  renderList(plans);
}

function renderNextTitle(plans) {
  const nextTitle = document.querySelector("[data-home-next]");
  const countEl = document.querySelector("[data-home-count]");
  countEl.textContent = `${plans.length}개`;

  const upcoming = plans.find((p) => !p.done) || plans[0];
  nextTitle.textContent = upcoming ? upcoming.title : "일정을 추가해 주세요!";
}

function renderList(plans) {
  const bodyEl = document.querySelector("[data-home-body]");
  bodyEl.innerHTML = "";

  if (plans.length === 0) {
    bodyEl.innerHTML = `
      <div class="home__empty">
        <img class="home__empty-image" src="/images/empty_list.png" alt="일정 없음" />
      </div>
    `;
    return;
  }

  const list = document.createElement("div");
  list.className = "home__list";

  plans.forEach((plan) => {
    const item = document.createElement("div");
    item.className = "home__item" + (plan.done ? " is-done" : "");
    item.innerHTML = `
      <button class="home__item-checkbox" type="button" aria-label="완료 체크" data-checkbox></button>
      <span class="home__item-time">${plan.time}</span>
      <span class="home__item-title-wrap">
        <span class="home__item-title">${plan.title}</span>
        ${plan.pinned ? '<span class="home__item-pin-dot" aria-label="고정됨"></span>' : ""}
      </span>
      <button class="home__item-more" type="button" aria-label="더보기" data-more></button>
    `;
    item.querySelector("[data-checkbox]").appendChild(createElement(Check, { size: 16 }));
    item.querySelector("[data-more]").appendChild(createElement(EllipsisVertical, { size: 18 }));

    item.querySelector("[data-checkbox]").addEventListener("click", () => {
      // 체크할 때마다 서버 재조회 + 스켈레톤을 띄우면 매번 화면이 깜빡여 UX가 나쁘므로,
      // 로컬 상태를 낙관적으로 바로 반영해 리스트만 다시 그리고 저장 요청은 백그라운드로 보낸다.
      plan.done = !plan.done;
      renderNextTitle(plans);
      renderList(plans);
      setPlanDone(plan.id, plan.done);
    });

    item.querySelector("[data-more]").addEventListener("click", () => {
      openMoreSheet(plan);
    });

    list.appendChild(item);
  });

  bodyEl.appendChild(list);

  if (plans.every((p) => p.done)) {
    list.classList.add("home__list--complete");

    const points = plans.length * 10;
    const cta = document.createElement("button");
    cta.type = "button";
    cta.className = "cta-button home__complete-cta";
    cta.textContent = "일정 완료!";
    cta.addEventListener("click", async () => {
      // success.html의 "+N POINT" 애니메이션은 그동안 보여주기만 하고 실제 잔액엔
      // 반영되지 않던 드리프트 버그가 있었다 — 이동하기 전 여기서 딱 한 번만 적립한다
      // (success.html 자체에서 하면 새로고침마다 중복 적립될 수 있음).
      await awardPoints(points);
      location.href = `/user/plans/success.html?points=${points}`;
    });
    bodyEl.appendChild(cta);
    requestAnimationFrame(() => cta.classList.add("is-visible"));
  }
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
        location.href = `/user/plans/edit.html?planId=${plan.id}`;
        return { ok: true };
      }
      if (value === "pin") {
        await pinPlan(plan.id);
        loadPlans();
        return { ok: true, message: "일정을 상단에 고정했습니다." };
      }
      if (value === "delete") {
        await deletePlan(plan.id);
        loadPlans();
        return { ok: true, message: "일정을 삭제했습니다." };
      }
      return { ok: false };
    },
  });
}
