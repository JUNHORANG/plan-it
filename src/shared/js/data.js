/*
  목 데이터 — 일정
  참조: blueprint.md §8 데이터 모델, §3 shared/js/data.js
*/

import { toISODate } from "./utils.js";

function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

const today = addDays(0);
const tomorrow = addDays(1);

export const plans = [
  { id: "p1", date: today, time: "07:00", title: "모닝 러닝 하기", done: true, pinned: false },
  { id: "p2", date: today, time: "08:34", title: "통근 버스 탑승", done: false, pinned: false },
  {
    id: "p3",
    date: today,
    time: "09:30",
    title: "팀 스프린트 회의 및 외부 에이전트 사전 미팅 정보 공유",
    done: false,
    pinned: false,
  },
  { id: "p4", date: today, time: "12:00", title: "외부 에이전트 점심 식사 미팅", done: false, pinned: false },
  { id: "p5", date: today, time: "19:00", title: "필라테스 3회차", done: false, pinned: false },
  { id: "p6", date: tomorrow, time: "10:00", title: "치과 예약", done: false, pinned: false },
];
