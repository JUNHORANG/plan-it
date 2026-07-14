/*
  API 계층 — 로그인/일정/알림/포인트/상점/주문/관리자는 전부 Supabase(실 DB)를 거친다.
  남은 목데이터는 data.js의 랭킹 목록(다른 유저 15명 분, 실제 여러 유저 랭킹 집계는
  이번 범위 밖)뿐 — "나의 순위" 항목만 실시간 프로필로 덮어써서 프로필 화면과 어긋나지
  않게 한다.

  참조: blueprint.md §3 shared/js/api.js
*/

import { ranking, rankingMeta } from "./data.js";
import { storage, toISODate } from "./utils.js";
import { supabase } from "./supabase-client.js";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 회원가입 — Supabase Auth 이메일 OTP(6자리) 흐름으로 동작한다.
// 1단계(닉네임 중복확인)는 profiles.nickname을 확인하는 전용 RPC(anon 호출 가능)를 쓰고,
// 2단계에서 signInWithOtp로 인증번호를 보낼 때 그 닉네임을 user_metadata에 실어 보내면
// 계정 생성 시점(handle_new_user 트리거)에 그대로 profiles.nickname으로 들어간다.
// 3단계는 2단계에서 이미 발급된 세션에 updateUser로 비밀번호만 추가한다.
export async function checkNickname(nickname) {
  const { data, error } = await supabase.rpc("is_nickname_available", { p_nickname: nickname });
  if (error) return { ok: false, message: "닉네임 확인 중 오류가 발생했습니다." };
  return { ok: data === true };
}

export async function sendVerificationCode(email, nickname) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, data: { nickname } },
  });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export async function verifyEmailCode(email, code) {
  const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export async function signup({ password }) {
  const { data, error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, message: error.message };
  return { ok: true, user: data.user };
}

// 로그인 — profiles.is_admin으로 관리자 여부를 판단(예전 하드코딩 admin@email.com 대체)
export async function login(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, message: error.message };
  const profile = await getProfile();
  return { ok: true, isAdmin: !!profile?.isAdmin };
}

function mapProfile(row) {
  return {
    nickname: row.nickname,
    email: row.email,
    points: row.points,
    planet: row.planet_id,
    isAdmin: row.is_admin,
  };
}

export async function getProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("nickname, email, points, planet_id, is_admin")
    .eq("id", user.id)
    .single();
  if (error) return null;
  return mapProfile(data);
}

export async function setPlanet(id) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("profiles")
    .update({ planet_id: id })
    .eq("id", user.id)
    .select("nickname, email, points, planet_id, is_admin")
    .single();
  if (error) return null;
  return mapProfile(data);
}

// 일정 완료 보상 — 완료한 일정 개수만큼 지급된 포인트(user/plans/index.js에서 계산)를
// award_points RPC(DB에서 원자적으로 points += delta)로 실제 profiles.points에 반영한다.
// 예전엔 success.html에 애니메이션으로 숫자만 보여주고 실제 잔액엔 반영되지 않던 드리프트
// 버그가 있었다(blueprint.md §9 25번 참조).
export async function awardPoints(points) {
  const { data, error } = await supabase.rpc("award_points", { delta: points });
  if (error) return null;
  return mapProfile(data);
}

export async function logout() {
  await supabase.auth.signOut();
}

// 일정 — public.plans 테이블. repeat 컬럼은 한글 값(당일/매일/매주/격주/매월/매년)인데
// 프론트(plan-form.js)는 영문 토큰(day/daily/weekly/biweekly/monthly/yearly)을 쓰므로
// 이 계층에서 서로 변환한다.
const RECURRENCE_TO_DB = {
  day: "당일",
  daily: "매일",
  weekly: "매주",
  biweekly: "격주",
  monthly: "매월",
  yearly: "매년",
};
const RECURRENCE_FROM_DB = Object.fromEntries(
  Object.entries(RECURRENCE_TO_DB).map(([token, label]) => [label, token])
);

function mapPlanFromDb(row) {
  return {
    id: row.id,
    date: row.start_date, // getPlansByDate가 조회에 쓰는 필드 — startDate와 항상 동일
    time: row.plan_time.slice(0, 5), // "07:00:00" -> "07:00"
    title: row.title,
    done: row.done,
    pinned: row.pinned,
    startDate: row.start_date,
    endDate: row.end_date,
    recurrence: RECURRENCE_FROM_DB[row.repeat] || "day",
  };
}

// 반복 주기(매일/매주 등)에 따라 여러 날짜에 걸쳐 일정을 전개하는 로직은 아직 없다 —
// addPlan은 start_date 한 날짜에만 행을 하나 만든다(plan-form.js와 동일한 기존 한계).
export async function getPlansByDate(dateISO) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("user_id", user.id)
    .eq("start_date", dateISO)
    .order("pinned", { ascending: false })
    .order("plan_time", { ascending: true });
  if (error) return [];
  return data.map(mapPlanFromDb);
}

export async function setPlanDone(id, done) {
  const { data, error } = await supabase.from("plans").update({ done }).eq("id", id).select().single();
  if (error) return null;
  return mapPlanFromDb(data);
}

export async function pinPlan(id) {
  const { data, error } = await supabase.from("plans").update({ pinned: true }).eq("id", id).select().single();
  if (error) return null;
  return mapPlanFromDb(data);
}

export async function deletePlan(id) {
  await supabase.from("plans").delete().eq("id", id);
}

export async function getPlan(id) {
  const { data, error } = await supabase.from("plans").select("*").eq("id", id).single();
  if (error) return null;
  return mapPlanFromDb(data);
}

export async function updatePlan(id, { title, time, startDate, endDate, recurrence }) {
  const repeat = RECURRENCE_TO_DB[recurrence] || "당일";
  const { data, error } = await supabase
    .from("plans")
    .update({
      title,
      plan_time: time,
      start_date: startDate,
      end_date: repeat === "당일" ? endDate : null,
      repeat,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) return null;
  return mapPlanFromDb(data);
}

export async function addPlan({ title, time, startDate, endDate, recurrence }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const repeat = RECURRENCE_TO_DB[recurrence] || "당일";
  const { data, error } = await supabase
    .from("plans")
    .insert({
      user_id: user.id,
      title,
      plan_time: time,
      start_date: startDate,
      end_date: repeat === "당일" ? endDate : null,
      repeat,
    })
    .select()
    .single();
  if (error) return null;
  return mapPlanFromDb(data);
}

// 상점 카탈로그 — public.products 테이블. 컬럼명이 프론트가 쓰는 모양(id/name/category/
// price/image)과 그대로 같아서 별도 매핑 함수가 필요 없다.
export async function getProducts() {
  const { data, error } = await supabase.from("products").select("*").order("created_at");
  if (error) return [];
  return data;
}

export async function getProduct(id) {
  const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
  if (error) return null;
  return data;
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

function mapOrderFromDb(row) {
  return {
    id: row.id,
    productId: row.product_id,
    status: row.status,
    pointsUsed: row.points_used,
    remainingAfter: row.remaining_after,
    address: row.address,
  };
}

// 주문 — public.orders 테이블. 포인트 차감 + 주문 생성을 create_order RPC 하나로 묶어서
// 원자적으로 처리한다(둘을 따로 호출하면 차감만 성공하고 주문 생성은 실패하는 반쪽 상태가
// 생길 수 있음 — supabase/migrations의 create_order 함수 참조).
export async function createOrder({ productId, address }) {
  const { data, error } = await supabase.rpc("create_order", {
    p_product_id: productId,
    p_address: address,
  });
  if (error) {
    if (error.message?.includes("insufficient_points")) {
      return { ok: false, message: "포인트가 부족합니다." };
    }
    if (error.message?.includes("product_not_found")) {
      return { ok: false, message: "제품을 찾을 수 없습니다." };
    }
    return { ok: false, message: "주문 생성에 실패했습니다." };
  }
  return { ok: true, order: mapOrderFromDb(data) };
}

export async function getOrders() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) return [];
  return data.map(mapOrderFromDb);
}

export async function cancelOrder(id) {
  const { data, error } = await supabase
    .from("orders")
    .update({ status: "취소 접수 중" })
    .eq("id", id)
    .select()
    .single();
  if (error) return null;
  return mapOrderFromDb(data);
}

// 알림 — public.notifications 테이블. create_upcoming_plan_notifications() DB 크론잡이
// 일정 시작 10분 전에 행을 만들어 둔다(supabase/migrations 참조). done은 알림 자체가 아니라
// 연결된 plans.done을 그대로 따른다(일정을 완료하면 알림도 즉시 비활성화 — 별도 컬럼으로
// 복사해 두면 체크할 때마다 같이 갱신해야 해서 어긋날 여지가 생긴다).
// section(오늘/어제)은 저장된 컬럼이 아니라 occurred_at 날짜를 오늘/어제와 비교해 그때그때
// 계산한다.
export async function getNotifications() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, occurred_at, done, plan_id, plans(done)")
    .eq("user_id", user.id)
    .order("occurred_at", { ascending: false });
  if (error) return [];

  const todayISO = toISODate(new Date());
  const yesterdayISO = toISODate(new Date(Date.now() - 24 * 60 * 60 * 1000));

  return data
    .map((row) => {
      const occurred = new Date(row.occurred_at);
      const dateISO = toISODate(occurred);
      const section = dateISO === todayISO ? "오늘" : dateISO === yesterdayISO ? "어제" : null;
      return {
        id: row.id,
        planId: row.plan_id,
        time: `${String(occurred.getHours()).padStart(2, "0")}:${String(occurred.getMinutes()).padStart(2, "0")}`,
        title: row.title,
        done: row.plans ? row.plans.done : row.done,
        section,
      };
    })
    .filter((n) => n.section);
}

export async function hasUnreadNotifications() {
  const list = await getNotifications();
  return list.some((n) => !n.done);
}

export async function getRanking() {
  await delay(500);
  // "나의 순위" 항목은 ranking[]에 시드 시점 포인트로 고정돼 있어, 그대로 두면 랭킹만
  // 계속 옛날 포인트를 보여주는 눈에 띄는 불일치가 생긴다 — 실제 로그인 계정(profiles)으로
  // 덮어쓴다.
  const profile = await getProfile();
  const list = ranking.map((r) =>
    r.isMe && profile ? { ...r, nickname: profile.nickname, points: profile.points, planet: profile.planet } : r
  );
  return { meta: rankingMeta, list };
}

// 관리자 - 주문 관리. RLS(orders_select_own_or_admin 등)가 is_admin()이면 전체 유저의
// 주문을 보게 허용하므로, 예전처럼 별도 adminOrders 배열 없이 orders 테이블 하나로 처리
// (관리자는 본인 소유 여부와 무관하게 전체 조회, 사용자는 자기 주문만 — §"주문 테이블 통합").
// customer(닉네임)는 profiles와 조인해서 가져온다.
export async function getAdminOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("id, product_id, status, address, profiles(nickname)")
    .order("created_at", { ascending: false });
  if (error) return [];
  return data.map((row) => ({
    id: row.id,
    customer: row.profiles?.nickname ?? "",
    productId: row.product_id,
    status: row.status,
    address: row.address,
  }));
}

export async function shipOrder(id) {
  const { data, error } = await supabase
    .from("orders")
    .update({ status: "주문 배송 중" })
    .eq("id", id)
    .select()
    .single();
  if (error) return null;
  return data;
}

// 주문 취소 요청을 관리자가 승인하면 리스트에서 삭제된다(spec.md 그대로) — 이제 사용자의
// "내 주문 내역"과 같은 테이블이라 이 삭제는 그 사용자의 주문 기록에서도 함께 사라진다.
export async function cancelAdminOrder(id) {
  await supabase.from("orders").delete().eq("id", id);
}

// 관리자 - 상점 관리 (제품 CRUD). products.id는 orders.id와 달리 DB 기본값이 없어
// 클라이언트에서 생성해 넘긴다(예전 목데이터와 동일한 방식).
function generateProductId() {
  return `pl${Date.now()}`;
}

export async function addProduct({ name, price, category, image }) {
  const { data, error } = await supabase
    .from("products")
    .insert({ id: generateProductId(), name, price, category, image })
    .select()
    .single();
  if (error) return null;
  return data;
}

export async function updateProduct(id, { name, price, category, image }) {
  const { data, error } = await supabase
    .from("products")
    .update({ name, price, category, image })
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, message: "제품을 찾을 수 없습니다." };
  return { ok: true, product: data };
}

export async function deleteProduct(id) {
  await supabase.from("products").delete().eq("id", id);
}
