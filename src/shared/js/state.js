/*
  통합 상태 관리 — localStorage 단일 소스 (`planit.state`)
  참조: blueprint.md §5 상태 관리(localStorage 키 규약), §9 25번

  MPA라 페이지를 옮길 때마다 ES 모듈이 통째로 다시 실행되면서 data.js의 메모리 상
  객체/배열(user, plans, orders 등)이 매번 시드값으로 리셋되던 문제(포인트 차감, 일정
  완료 체크 등 어떤 변경도 페이지 이동 한 번에 사라짐)를 해결하기 위해, 유저·일정·상품·
  주문을 하나의 localStorage 키에 묶어 두고 이 모듈을 거쳐서만 읽고 쓰게 한다.
  api.js 등 다른 코드는 storage(shared/js/utils.js)나 localStorage를 직접 건드리지
  않고 반드시 getState()/updateState()/resetState()만 사용한다.

  키를 하나로 묶은 이유: 포인트 차감과 주문 추가처럼 원래 한 번에 같이 일어나야 하는
  변경을 서로 다른 키에 나눠 쓰면, 그 사이 새로고침이 끼어들 때 반쪽만 반영되는 상태가
  생길 수 있다 — 한 키에 한 번에 쓰면 그 문제 자체가 없다.

  __seedVersion: data.js/plants.js의 시드 값(예: user.email)을 바꿔도 이미 예전 값으로
  localStorage에 저장돼 있는 브라우저는 "값이 있으니" 그대로 유지해버려서 새 시드가 반영
  안 되는 문제가 있었다 — 시드가 바뀔 때마다 이 숫자를 올리면, 버전이 다른 낡은 상태는
  자동으로 새로 시드된다(수동으로 localStorage를 지울 필요 없음).
*/

import { storage } from "./utils.js";
import { user, plans } from "./data.js";
import { plants } from "./plants.js";

const STATE_KEY = "planit.state";
const SEED_VERSION = 3;

function buildSeedState() {
  return {
    __seedVersion: SEED_VERSION,
    user: { ...user },
    plans: plans.map((p) => ({ ...p })),
    products: plants.map((p) => ({ ...p })),
    orders: [],
  };
}

export function getState() {
  const existing = storage.get(STATE_KEY);
  if (existing && existing.__seedVersion === SEED_VERSION) return existing;

  const seed = buildSeedState();
  storage.set(STATE_KEY, seed);
  return seed;
}

export function updateState(mutatorFn) {
  const state = getState();
  mutatorFn(state);
  storage.set(STATE_KEY, state);
  return state;
}

export function resetState() {
  storage.remove(STATE_KEY);
  return getState();
}
