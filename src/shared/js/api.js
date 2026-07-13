/*
  목 API — 성공/지연 시뮬레이션
  참조: blueprint.md §3 shared/js/api.js
*/

import { plans } from "./data.js";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getPlansByDate(dateISO) {
  await delay(500);
  return plans
    .filter((p) => p.date === dateISO)
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.time.localeCompare(b.time);
    });
}

export async function setPlanDone(id, done) {
  await delay(150);
  const plan = plans.find((p) => p.id === id);
  if (plan) plan.done = done;
  return plan;
}

export async function pinPlan(id) {
  await delay(300);
  const plan = plans.find((p) => p.id === id);
  if (plan) plan.pinned = true;
  return plan;
}

export async function deletePlan(id) {
  await delay(300);
  const index = plans.findIndex((p) => p.id === id);
  if (index !== -1) plans.splice(index, 1);
}
