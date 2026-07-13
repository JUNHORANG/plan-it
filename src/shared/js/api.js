/*
  목 API — 성공/지연 시뮬레이션
  참조: blueprint.md §3 shared/js/api.js
*/

import { plans, user, products, orders, notifications, ranking, rankingMeta, adminOrders } from "./data.js";
import { storage } from "./utils.js";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
