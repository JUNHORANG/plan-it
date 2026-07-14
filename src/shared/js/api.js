/*
  목 API — 성공/지연 시뮬레이션
  참조: blueprint.md §3 shared/js/api.js, §5 상태 관리(localStorage 키 규약)

  user/plans/products/orders는 이제 data.js의 메모리 배열이 아니라 state.js(localStorage
  `planit.state`)를 거쳐 읽고 쓴다 — MPA라 페이지 이동마다 모듈이 재실행돼도(예: 포인트
  차감, 일정 완료 체크) 값이 유지되게 하기 위함. notifications/ranking/rankingMeta/
  adminOrders는 이번 범위 밖이라 여전히 data.js의 정적 배열을 그대로 쓴다.
*/

import { notifications, ranking, rankingMeta, adminOrders } from "./data.js";
import { getState, updateState, resetState } from "./state.js";
import { storage } from "./utils.js";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 회원가입 — 실제 백엔드 없이 목 동작만 흉내낸다.
// 닉네임 중복 목록은 데모용 하드코딩, 이메일 인증번호는 항상 "123456"이 정답인 것으로 검증한다.
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
  return { ...getState().user };
}

export async function setPlanet(id) {
  await delay(300);
  const { user } = updateState((s) => {
    s.user.planet = id;
  });
  return { ...user };
}

// 일정 완료 보상 — 완료한 일정 개수만큼 지급된 포인트(user/plans/index.js에서 계산)를
// 실제로 user.points에 반영한다. 예전엔 success.html에 애니메이션으로 숫자만 보여주고
// 실제 잔액엔 반영되지 않던 드리프트 버그가 있었다(blueprint.md §9 25번 참조).
export async function awardPoints(points) {
  await delay(150);
  const { user } = updateState((s) => {
    s.user.points += points;
  });
  return { ...user };
}

export async function logout() {
  await delay(300);
}

export async function resetDemoState() {
  await delay(200);
  resetState();
  return true;
}

export async function getPlansByDate(dateISO) {
  await delay(500);
  const { plans } = getState();
  return plans
    .filter((p) => p.date === dateISO)
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.time.localeCompare(b.time);
    });
}

export async function setPlanDone(id, done) {
  await delay(150);
  let updated = null;
  updateState((s) => {
    const plan = s.plans.find((p) => p.id === id);
    if (plan) {
      plan.done = done;
      updated = plan;
    }
  });
  return updated;
}

export async function pinPlan(id) {
  await delay(300);
  let updated = null;
  updateState((s) => {
    const plan = s.plans.find((p) => p.id === id);
    if (plan) {
      plan.pinned = true;
      updated = plan;
    }
  });
  return updated;
}

export async function deletePlan(id) {
  await delay(300);
  updateState((s) => {
    const index = s.plans.findIndex((p) => p.id === id);
    if (index !== -1) s.plans.splice(index, 1);
  });
}

export async function getPlan(id) {
  await delay(300);
  const { plans } = getState();
  return plans.find((p) => p.id === id) || null;
}

export async function updatePlan(id, { title, time, startDate, endDate, recurrence }) {
  await delay(500);
  let updated = null;
  updateState((s) => {
    const plan = s.plans.find((p) => p.id === id);
    if (!plan) return;
    Object.assign(plan, { title, time, date: startDate, startDate, endDate, recurrence });
    updated = plan;
  });
  return updated;
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
  updateState((s) => {
    s.plans.push(plan);
  });
  return plan;
}

export async function getProducts() {
  await delay(500);
  return getState().products;
}

export async function getProduct(id) {
  await delay(300);
  return getState().products.find((p) => p.id === id);
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
  const { user, products } = getState();
  const product = products.find((p) => p.id === productId);
  if (!product) return { ok: false, message: "제품을 찾을 수 없습니다." };
  if (user.points < product.price) return { ok: false, message: "포인트가 부족합니다." };

  let order;
  updateState((s) => {
    s.user.points -= product.price;
    order = {
      id: generateOrderId(),
      productId,
      status: "주문 접수 중",
      pointsUsed: product.price,
      remainingAfter: s.user.points,
      address,
    };
    s.orders.unshift(order);
  });
  return { ok: true, order };
}

export async function getOrders() {
  await delay(500);
  return getState().orders;
}

export async function cancelOrder(id) {
  await delay(400);
  let updated = null;
  updateState((s) => {
    const order = s.orders.find((o) => o.id === id);
    if (order) {
      order.status = "취소 접수 중";
      updated = order;
    }
  });
  return updated;
}

export async function getNotifications() {
  await delay(500);
  return notifications;
}

export async function getRanking() {
  await delay(500);
  // "나의 순위" 항목은 ranking[]에 시드 시점 포인트로 고정돼 있어, 그대로 두면 랭킹만
  // 계속 옛날 포인트를 보여주는 눈에 띄는 불일치가 생긴다 — 실시간 user로 덮어쓴다.
  const { user } = getState();
  const list = ranking.map((r) =>
    r.isMe ? { ...r, nickname: user.nickname, points: user.points, planet: user.planet } : r
  );
  return { meta: rankingMeta, list };
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
  return `pl${Date.now()}`;
}

export async function addProduct({ name, price, category, image }) {
  await delay(400);
  const product = { id: generateProductId(), name, price, category, image };
  updateState((s) => {
    s.products.push(product);
  });
  return product;
}

export async function updateProduct(id, { name, price, category, image }) {
  await delay(400);
  let updated = null;
  updateState((s) => {
    const product = s.products.find((p) => p.id === id);
    if (product) {
      Object.assign(product, { name, price, category, image });
      updated = product;
    }
  });
  if (!updated) return { ok: false, message: "제품을 찾을 수 없습니다." };
  return { ok: true, product: updated };
}

export async function deleteProduct(id) {
  await delay(300);
  updateState((s) => {
    const index = s.products.findIndex((p) => p.id === id);
    if (index !== -1) s.products.splice(index, 1);
  });
}
