/*
  일정 추가 (/user/plans/add)
  참조: plan-form.js(공용 폼 로직 — add/edit이 공유)
*/

import { initPlanForm } from "./plan-form.js";
import { addPlan } from "/shared/js/api.js";
import { requireAuth } from "/shared/js/utils.js";

await requireAuth();

const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

initPlanForm({
  pageTitle: "일정 추가",
  submitLabel: "일정 추가",
  initial: {
    title: "",
    hour: now.getHours(),
    minute: now.getMinutes(),
    startDate: today,
    endDate: today,
    recurrence: "day",
  },
  onSubmit: async (payload) => {
    await addPlan(payload);
    location.href = "/user/plans/";
  },
});
