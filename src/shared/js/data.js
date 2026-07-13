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
  { id: "moon", name: "달", image: "/images/moon.png" },
];

// Figma "/store"(4278:843) 실측 그대로 반영 — 이름/카테고리/가격/이미지 매핑
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
