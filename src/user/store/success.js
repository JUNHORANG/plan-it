/*
  구매 완료 (/user/store/success?orderId=)
  참조: spec.md "구매 완료" — 안내 문구 + 일러스트 → CTA로 /user/store/history 이동
  (blueprint.md §9: "/products/orders" 표기는 "/user/profile/orders/"로 해석했던 것을,
  §10 폴더 구조 재정리로 /user/store/history로 이동)
*/

import { mountAppBar } from "/shared/components/app-bar.js";
import { createCtaButton } from "/shared/components/cta-button.js";
import { requireAuth } from "/shared/js/utils.js";

await requireAuth();

mountAppBar("#app-bar", {
  title: "",
  onBack: () => {
    location.href = "/user/store/";
  },
});

const app = document.querySelector("#app");
app.innerHTML = `
  <div class="order-success">
    <canvas class="order-success__confetti" aria-hidden="true"></canvas>
    <h1 class="order-success__title">구매 완료!</h1>
    <img class="order-success__image" src="/images/buy.png" alt="구매 완료 축하 일러스트" />
  </div>
`;

const cta = createCtaButton({
  label: "주문 내역 확인하기",
  disabled: false,
  onClick: () => {
    location.href = "/user/store/history";
  },
});
cta.el.classList.add("order-success__cta");
document.querySelector(".order-success").appendChild(cta.el);

// confetti(@tsparticles/confetti)는 engine/shape/updater 등 서브패키지를 여러 개 더
// 물어오는 무거운 CDN 번들이다 — 파일 최상단에서 정적 import로 걸어두면 그게 다 받아질
// 때까지 위 app.innerHTML 렌더링(제목·이미지)까지 전부 멈춰서 화면이 늦게 떴다. 렌더링이
// 끝난 뒤 동적 import로 따로 불러와서, 화면은 즉시 뜨고 색종이만 한 박자 늦게 붙게 한다.
import("https://cdn.jsdelivr.net/npm/@tsparticles/confetti@latest/+esm").then(async ({ confetti }) => {
  const confettiCanvas = document.querySelector(".order-success__confetti");
  // confetti.create()는 캔버스에 묶인 함수를 담은 Promise를 반환한다 — await로 풀어서
  // 호출해야 실제로 색종이가 나온다(동기로 쓰면 "not a function" 에러).
  const fireConfetti = await confetti.create(confettiCanvas, { resize: true, useWorker: true });
  fireConfetti({
    particleCount: 150,
    spread: 100,
    origin: { x: 0.5, y: 0.4 },
  });
});
