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

export const user = {
  nickname: "행성지킴이",
  email: "test@email.com",
  points: 8000,
  planet: "earth",
};

export const planets = [
  { id: "earth", name: "지구", image: "/images/front_titi.png" },
  { id: "moon", name: "달", image: "/images/ranking_moon.png" },
];

// 식물 카탈로그(products)는 shared/js/plants.js(20종)로 대체되고 state.js의 시드로만
// 쓰인다 — data.js엔 더 이상 두지 않음(blueprint.md §9 25번 참조).
// orders(주문 내역)도 이제 항상 빈 배열로 시작해 state.js가 관리한다 — 여기 있던 2건의
// 시드 주문은 products가 사라지며 참조할 productId가 없어져 함께 정리함.

export const plans = [
  {
    id: "p1",
    date: today,
    time: "07:00",
    title: "모닝 러닝 하기",
    done: true,
    pinned: false,
  },
  {
    id: "p2",
    date: today,
    time: "08:34",
    title: "통근 버스 탑승",
    done: false,
    pinned: false,
  },
  {
    id: "p3",
    date: today,
    time: "09:30",
    title: "팀 스프린트 회의 및 외부 에이전트 사전 미팅 정보 공유",
    done: false,
    pinned: false,
  },
  {
    id: "p4",
    date: today,
    time: "12:00",
    title: "외부 에이전트 점심 식사 미팅",
    done: false,
    pinned: false,
  },
  {
    id: "p5",
    date: today,
    time: "19:00",
    title: "필라테스 3회차",
    done: false,
    pinned: false,
  },
  {
    id: "p6",
    date: tomorrow,
    time: "10:00",
    title: "치과 예약",
    done: false,
    pinned: false,
  },
];

// 알림 — Figma "/notification"(4293:1216) 실측: 오늘 일정은 해당 plans[]의 done 상태를 그대로
// 반영(완료되면 비활성화), 어제 알림은 오늘 plans에 대응하는 항목이 없어 별도 목데이터로 채움
export const notifications = [
  ...plans
    .filter((p) => p.date === today)
    .map((p) => ({
      id: `notif-${p.id}`,
      planId: p.id,
      time: p.time,
      title: p.title,
      done: p.done,
      section: "오늘",
    })),
  {
    id: "notif-y1",
    planId: null,
    time: "20:12",
    title: "무심천 러닝 뛰기",
    done: true,
    section: "어제",
  },
  {
    id: "notif-y2",
    planId: null,
    time: "18:00",
    title: "퇴근",
    done: true,
    section: "어제",
  },
  {
    id: "notif-y3",
    planId: null,
    time: "12:00",
    title: "점심 시간",
    done: true,
    section: "어제",
  },
];

// 랭킹 — Figma "/ranking"(4259:1235) 실측 그대로(닉네임·포인트·순위), "나의 순위"(6등) 항목만
// 실제 로그인 사용자(user) 데이터로 대체해 프로필 화면과 값이 어긋나지 않게 한다
export const ranking = [
  { rank: 1, nickname: "계획인간", points: 1024, planet: "earth" },
  { rank: 2, nickname: "404error", points: 824, planet: "moon" },
  { rank: 3, nickname: "키키", points: 810, planet: "earth" },
  { rank: 4, nickname: "캐치캐치", points: 620, planet: "earth" },
  { rank: 5, nickname: "스티키", points: 540, planet: "moon" },
  {
    rank: 6,
    nickname: user.nickname,
    points: user.points,
    planet: user.planet,
    isMe: true,
  },
  { rank: 7, nickname: "ADP", points: 420, planet: "moon" },
  { rank: 8, nickname: "레몬에이드", points: 380, planet: "moon" },
];

export const rankingMeta = { participants: 274 };

// 관리자 - 주문 관리(4388:2254) 실측 그대로 — 고객 닉네임·주문번호·상품·상태·주소지 매핑.
// 사용자(user)의 orders[]는 "내 주문 내역"(단일 사용자 기준)이라 소유자 구분이 없는데,
// admin은 "전체 고객 주문"을 봐야 해서 별도 배열로 분리했다(같은 orders[]를 썼다면 다른
// 고객 이름의 목데이터가 로그인한 사용자 자신의 주문 내역 화면에도 섞여 보이는 문제가 생김).
// productId는 shared/js/plants.js(pl1~pl20) 기준으로 맞춤(예전 p1~p7 카탈로그 폐기에 맞춰 갱신).
export const adminOrders = [
  {
    id: "202607011297",
    customer: "레몬에이드",
    productId: "pl3",
    status: "주문 배송 중",
    address: "어쩌구로 29번길 37, 106호",
  },
  {
    id: "202607091030",
    customer: "키키",
    productId: "pl6",
    status: "주문 접수 중",
    address: "어쩌구로 2번길 77, 303호",
  },
  {
    id: "202608220549",
    customer: "전재준",
    productId: "pl2",
    status: "취소 접수 중",
    address: "어쩌구로 11번길 7, 501호",
  },
];
