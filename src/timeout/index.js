/*
  네트워크 지연 (/timeout/)
  참조: spec.md "네트워크 지연", Figma 모바일(4087:773) / 타블렛·데스크탑(4146:1003)

  CTA 라벨: 타블렛 프레임(4146:1003)에는 "홈페이지로 이동"이 그대로 남아 있지만, 모바일
  프레임(4087:773)과 spec.md("CTA 버튼을 눌러 이전 도메인으로 이동할 수 있다") 모두 "이전
  페이지로 이동"이라 이는 타블렛 쪽 복붙 실수로 보고 모바일/spec 쪽을 채택한다(404 타블렛
  컴포넌트를 복제하며 버튼 라벨만 안 고친 것으로 추정 — blueprint.md §9류 Figma 실수 사례와 동일 패턴).
*/

import { mountAppBar } from "/shared/components/app-bar.js";
import { createCtaButton } from "/shared/components/cta-button.js";

mountAppBar("#app-bar", { title: "" });

const app = document.querySelector("#app");
app.innerHTML = `
  <div class="timeout-page">
    <h1 class="timeout-page__title">네트워크 지연</h1>
    <p class="timeout-page__desc">네트워크 문제가 발생 했습니다! 네트워크 연결 상태를 확인해 주세요</p>
    <div class="timeout-page__image-area">
      <img class="timeout-page__image" src="/images/timeout_titi.png" alt="네트워크 지연 안내 일러스트" />
    </div>
    <div class="timeout-page__spacer"></div>
  </div>
`;

const cta = createCtaButton({
  label: "이전 페이지로 이동",
  disabled: false,
  onClick: () => {
    history.back();
  },
});
cta.el.classList.add("timeout-page__cta");
document.querySelector(".timeout-page").appendChild(cta.el);
