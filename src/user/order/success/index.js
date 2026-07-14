/*
  구매 완료 (/user/order/success/?orderId=)
  참조: spec.md "구매 완료" — 안내 문구 + 일러스트 → CTA로 /user/profile/orders/ 이동
  (blueprint.md §9: "/products/orders" 표기는 "/user/profile/orders/"로 해석)
*/

import { mountAppBar } from "/shared/components/app-bar.js";
import { createCtaButton } from "/shared/components/cta-button.js";
import { requireAuth } from "/shared/js/utils.js";

await requireAuth();

mountAppBar("#app-bar", {
  title: "",
  onBack: () => {
    location.href = "/user/store/products/";
  },
});

const app = document.querySelector("#app");
app.innerHTML = `
  <div class="order-success">
    <h1 class="order-success__title">구매 완료!</h1>
    <img class="order-success__image" src="/images/buy.png" alt="구매 완료 축하 일러스트" />
  </div>
`;

const cta = createCtaButton({
  label: "주문 내역 확인하기",
  disabled: false,
  onClick: () => {
    location.href = "/user/profile/orders/";
  },
});
cta.el.classList.add("order-success__cta");
document.querySelector(".order-success").appendChild(cta.el);
