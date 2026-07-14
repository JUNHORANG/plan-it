/*
  목 API — 성공/지연 시뮬레이션
  참조: blueprint.md §3 shared/js/api.js
*/

import { plans, user, products, orders, notifications, ranking, rankingMeta, adminOrders } from "./data.js";
import { storage } from "./utils.js";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 회원가입 — 실제 백엔드 없이 목 동작만 흉내낸다.
// 닉네임 중복 목록은 데모용 하드코딩(로그인의 test@planit.com 계정과 같은 성격),
// 이메일 인증번호는 항상 "123456"이 정답인 것으로 검증한다.
const TAKEN_NICKNAMES = ["관리자", "테스트유저", "admin", "test"];
const MOCK_VERIFICATION_CODE = "123456";

export async function checkNickname(nickname) {
  await delay(500);
  return { ok: !TAKEN_NICKNAMES.includes(nickname) };
}

export async function sendVerificationCode() {
  await delay(500);
  return { ok: true };
}

export async function verifyEmailCode(code) {
  await delay(400);
  return { ok: code === MOCK_VERIFICATION_CODE };
}

export async function signup({ nickname, email, password }) {
  await delay(600);
  return { ok: true, user: { nickname, email, password } };
}

export async function getProfile() {
  await delay(400);
  return { ...user };
}

export async function setPlanet(id) {
  await delay(300);
  user.planet = id;
  return { ...user };
}

export async function logout() {
  await delay(300);
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

export async function getPlan(id) {
  await delay(300);
  return plans.find((p) => p.id === id) || null;
}

export async function updatePlan(id, { title, time, startDate, endDate, recurrence }) {
  await delay(500);
  const plan = plans.find((p) => p.id === id);
  if (!plan) return null;
  Object.assign(plan, { title, time, date: startDate, startDate, endDate, recurrence });
  return plan;
}

function generatePlanId() {
  return "p" + String(Math.floor(100000 + Math.random() * 900000));
}

// startDate/endDate/recurrence는 일정 추가 폼 필드를 그대로 보관하지만(수정 화면에서
// 프리필하는 용도), 실제 목록 조회(getPlansByDate)는 여전히 date(=startDate) 단일
// 필드만 본다 — 주기(매일/매주 등)에 따라 여러 날짜에 걸쳐 항목을 늘리는 반복 일정
// 전개는 이 목데이터 계층 범위 밖이라 구현하지 않는다.
export async function addPlan({ title, time, startDate, endDate, recurrence }) {
  await delay(500);
  const plan = {
    id: generatePlanId(),
    date: startDate,
    time,
    title,
    done: false,
    pinned: false,
    startDate,
    endDate,
    recurrence,
  };
  plans.push(plan);
  return plan;
}

export async function getProducts() {
  await delay(500);
  return products;
}

export async function getProduct(id) {
  await delay(300);
  return products.find((p) => p.id === id);
}

export async function getAddress() {
  await delay(150);
  return storage.get("planit.address");
}

export async function saveAddress(address) {
  await delay(300);
  storage.set("planit.address", address);
  return address;
}

export async function clearAddress() {
  await delay(300);
  storage.remove("planit.address");
}

function generateOrderId() {
  return String(Math.floor(10000000 + Math.random() * 90000000));
}

export async function createOrder({ productId, address }) {
  await delay(600);
  const product = products.find((p) => p.id === productId);
  if (!product) return { ok: false, message: "제품을 찾을 수 없습니다." };
  if (user.points < product.price) return { ok: false, message: "포인트가 부족합니다." };

  user.points -= product.price;
  const order = {
    id: generateOrderId(),
    productId,
    status: "주문 접수 중",
    pointsUsed: product.price,
    remainingAfter: user.points,
    address,
  };
  orders.unshift(order);
  return { ok: true, order };
}

export async function getOrders() {
  await delay(500);
  return orders;
}

export async function cancelOrder(id) {
  await delay(400);
  const order = orders.find((o) => o.id === id);
  if (order) order.status = "취소 접수 중";
  return order;
}

export async function getNotifications() {
  await delay(500);
  return notifications;
}

export async function getRanking() {
  await delay(500);
  return { meta: rankingMeta, list: ranking };
}

// 관리자 - 주문 관리
export async function getAdminOrders() {
  await delay(400);
  return adminOrders;
}

export async function shipOrder(id) {
  await delay(400);
  const order = adminOrders.find((o) => o.id === id);
  if (order) order.status = "주문 배송 중";
  return order;
}

export async function cancelAdminOrder(id) {
  await delay(400);
  const index = adminOrders.findIndex((o) => o.id === id);
  if (index !== -1) adminOrders.splice(index, 1);
}

// 관리자 - 상점 관리 (제품 CRUD)
function generateProductId() {
  return `p${Date.now()}`;
}

export async function addProduct({ name, price, category, image }) {
  await delay(400);
  const product = { id: generateProductId(), name, price, category, image };
  products.push(product);
  return product;
}

export async function updateProduct(id, { name, price, category, image }) {
  await delay(400);
  const product = products.find((p) => p.id === id);
  if (!product) return { ok: false, message: "제품을 찾을 수 없습니다." };
  Object.assign(product, { name, price, category, image });
  return { ok: true, product };
}

export async function deleteProduct(id) {
  await delay(300);
  const index = products.findIndex((p) => p.id === id);
  if (index !== -1) products.splice(index, 1);
}
