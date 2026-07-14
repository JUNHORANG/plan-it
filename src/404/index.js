/*
  404 (미매칭 경로 → src/404/index.html, scripts/dev-server.js가 fallback으로 응답)
  참조: spec.md "404", Figma 모바일(4087:755) / 타블렛·데스크탑(4145:934)
*/

import { mountAppBar } from "/shared/components/app-bar.js";
import { createCtaButton } from "/shared/components/cta-button.js";

mountAppBar("#app-bar", { title: "" });

const app = document.querySelector("#app");
app.innerHTML = `
  <div class="not-found">
    <h1 class="not-found__code">404</h1>
    <p class="not-found__desc">잘못된 주소로 접근 했습니다 주소를 확인해 주세요!</p>
    <div class="not-found__image-area">
      <img class="not-found__image" src="/images/moon.png" alt="잘못된 주소 안내 일러스트" />
    </div>
    <div class="not-found__spacer"></div>
  </div>
`;

const cta = createCtaButton({
  label: "홈페이지로 이동",
  disabled: false,
  onClick: () => {
    location.href = "/user/plans/";
  },
});
cta.el.classList.add("not-found__cta");
document.querySelector(".not-found").appendChild(cta.el);
