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
  email: "planit.user@example.com",
  points: 8000,
  planet: "earth",
};

export const planets = [
  { id: "earth", name: "지구", image: "/images/front_titi.png" },
  { id: "moon", name: "달", image: "/images/ranking_moon.png" },
];

// Figma "/store"(4278:843) 실측 그대로 반영 — 이름/카테고리/가격/이미지 매핑.
// (예전엔 이 7종이 실수로 3벌 복붙돼 21개였다 — id가 겹쳐서 admin 상점 관리의 수정/삭제가
// 어느 항목을 가리키는지 모호해지는 실제 버그였어서 정리함)
export const products = [
  {
    id: "p1",
    name: "사철 나무 묘목",
    category: "나무",
    price: 7000,
    image: "/images/tree3.png",
  },
  {
    id: "p2",
    name: "구슬 얽이",
    category: "다육식물",
    price: 5000,
    image: "/images/tree1.png",
  },
  {
    id: "p3",
    name: "고스티",
    category: "다육식물",
    price: 6000,
    image: "/images/tree1.png",
  },
  {
    id: "p4",
    name: "사과 나무 묘목",
    category: "나무",
    price: 9000,
    image: "/images/tree2.png",
  },
  {
    id: "p5",
    name: "고스티",
    category: "다육식물",
    price: 6000,
    image: "/images/tree1.png",
  },
  {
    id: "p6",
    name: "오육 나무 묘목",
    category: "나무",
    price: 9000,
    image: "/images/tree2.png",
  },
  {
    id: "p7",
    name: "달랑 나무 묘목",
    category: "나무",
    price: 7000,
    image: "/images/tree3.png",
  },
];

export const orders = [
  {
    id: "48213076",
    productId: "p2",
    status: "주문 접수 중",
    pointsUsed: 5000,
    remainingAfter: 13000,
    address: "서울특별시 강남구 테헤란로 123",
  },
  {
    id: "20948117",
    productId: "p1",
    status: "주문 배송 중",
    pointsUsed: 7000,
    remainingAfter: 8000,
    address: "서울특별시 강남구 테헤란로 123",
  },
];

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
export const adminOrders = [
  {
    id: "202607011297",
    customer: "레몬에이드",
    productId: "p7",
    status: "주문 배송 중",
    address: "어쩌구로 29번길 37, 106호",
  },
  {
    id: "202607091030",
    customer: "키키",
    productId: "p4",
    status: "주문 접수 중",
    address: "어쩌구로 2번길 77, 303호",
  },
  {
    id: "202608220549",
    customer: "전재준",
    productId: "p3",
    status: "취소 접수 중",
    address: "어쩌구로 11번길 7, 501호",
  },
];
