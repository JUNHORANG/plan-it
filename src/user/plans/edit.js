/*
  일정 수정 (/user/plans/edit.html?planId=)
  참조: plan-form.js(공용 폼 로직 — add/edit이 공유), blueprint.md §4단계
        "user/plans/edit.* — add 로직 재사용 + ?planId= 프리필"

  시드 데이터(add 화면을 거치지 않고 처음부터 있던 일정)엔 startDate/endDate/recurrence가
  없을 수 있어(date만 있음) — 그 경우 date를 시작/종료 날짜로, 주기는 "당일"로 간주해
  프리필한다.
*/

import { initPlanForm } from "./plan-form.js";
import { getPlan, updatePlan } from "/shared/js/api.js";

const planId = new URLSearchParams(location.search).get("planId");
const plan = await getPlan(planId);

if (!plan) {
  location.href = "/user/plans/";
} else {
  const [hour, minute] = plan.time.split(":").map(Number);

  initPlanForm({
    pageTitle: "일정 수정",
    submitLabel: "일정 수정",
    initial: {
      title: plan.title,
      hour,
      minute,
      startDate: parseDate(plan.startDate || plan.date),
      endDate: plan.recurrence && plan.recurrence !== "day" ? null : parseDate(plan.endDate || plan.date),
      recurrence: plan.recurrence || "day",
    },
    onSubmit: async (payload) => {
      await updatePlan(planId, payload);
      location.href = "/user/plans/";
    },
  });
}

function parseDate(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d);
}
