/*
  일정 완료 (/user/plans/success.html)
  참조: Figma "/plans/success"(4006:940) — 안내 문구 + 지급 포인트 애니메이션 + CTA로 /user/profile/ 이동
  (blueprint.md §9: "/profile" 표기는 "/user/profile/"로 해석)

  쿼리스트링: ?points= (지급 포인트, 없으면 기본값 50)
*/

import { mountAppBar } from "/shared/components/app-bar.js";
import { createCtaButton } from "/shared/components/cta-button.js";
import { requireAuth } from "/shared/js/utils.js";

await requireAuth();

mountAppBar("#app-bar", {
  title: "",
  onBack: () => {
    location.href = "/user/plans/";
  },
});

const points = Number(new URLSearchParams(location.search).get("points")) || 50;

const app = document.querySelector("#app");
app.innerHTML = `
  <div class="plan-success">
    <h1 class="plan-success__title">오늘도 한 걸음!</h1>
    <p class="plan-success__desc">포인트를 지급 했어요!</p>
    <div class="plan-success__image-area">
      <img class="plan-success__image" src="/images/good_titi.png" alt="일정 완료 축하 일러스트" />
    </div>
    <div class="plan-success__spacer"></div>
    <p class="plan-success__points" data-points>+ 0 POINT</p>
  </div>
`;

const cta = createCtaButton({
  label: "포인트 확인 하기",
  disabled: false,
  onClick: () => {
    location.href = "/user/profile/";
  },
});
cta.el.classList.add("plan-success__cta");
document.querySelector(".plan-success").appendChild(cta.el);

animatePoints(points);

function animatePoints(target) {
  const el = document.querySelector("[data-points]");

  // 등장(0~20%) 구간에 맞춰 카운트업이 끝나도록 진행률 애니메이션 시간을 CSS의
  // plan-success-points-rise 등장 구간(2.6s의 20% ≈ 520ms)과 맞춘다.
  const duration = 520;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    el.textContent = `+ ${Math.round(target * progress)} POINT`;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
