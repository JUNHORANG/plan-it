/*
  구매 (/user/products/order/?id=)
  참조: Figma "상점 - 구매"(4293:1252 기본) / 주소지 입력 활성화(4295:1489) / 구매 동의 체크(4295:1464)
  — Desktop Bridge 플러그인 경로로 실측(REST API rate limit 우회)

  - 앱바 타이틀은 제품명이 아니라 고정 문구 "결제"(4293:1259 실측)
  - 제품 정보는 가격(20px semibold, 검정)이 위, 이름(14px regular)이 아래 — 홈/스토어와 반대 순서
  - 체크박스(원형)를 체크하면(=구매 동의) 바로 구매 바텀시트가 열린다 — 별도 CTA 버튼 없음(spec.md 그대로).
    바텀시트는 상점 목록과 동일한 shared/components/purchase-sheet.js를 재사용하되, 배경 딤은 뺀다
    (backdrop:false — 사용자 요청).
  - 주소지 카드: 기본값 없음(4295:1338)/값 있음(4295:1369) 모두 접힌 상태 테두리는 회색 그대로,
    입력창에 포커스가 들어갔을 때만(4295:1489) 카드 전체 테두리가 초록으로 바뀜 — CSS
    :focus-within로 처리(index.css `.order-card--address:focus-within`). 저장된 주소는
    `planit.address`(localStorage)에 저장돼 페이지를 새로고침해도 그대로 유지된다.
  - 주소지 입력폼 펼치기/접기는 `hidden` 속성으로 즉시 전환하지 않고, 다른 오버레이(바텀시트/
    드로워)와 톤을 맞춰 아코디언처럼 부드럽게 슬라이드(index.css `.order-card__expand`
    grid-template-rows 애니메이션). 저장하면 자동으로 다시 접히고, 토글을 다시 누르면
    저장된 값이 프리필된 채로 다시 펼쳐진다.
  - 구매 동의 카드(4295:1464): 체크박스 아이콘뿐 아니라 카드 전체 테두리도 초록으로 바뀜
    (`.order-card--agree.is-checked`), 주소지 카드의 :focus-within 테두리와 같은 톤.
  - lucide createElement에 {size}를 넘기면 이 CDN 빌드에서는 무시되고 기본 24x24로 렌더링됨
    (의미 없는 size="N" 속성만 남음) — {width, height}를 직접 지정해야 실제로 반영된다.
    이 파일의 체크박스 아이콘이 21x21 원 밖으로 넘쳐서 발견됨. 다른 화면들도 같은 패턴으로
    {size}를 쓰고 있어 전부 24x24로 렌더링되고 있을 가능성이 높음 — 아이콘이 큰 터치 영역
    안에 있어 눈에 덜 띄었을 뿐, 전수 점검 필요.
*/

import { mountAppBar } from "/shared/components/app-bar.js";
import { renderSkeleton, clearSkeleton } from "/shared/components/skeleton.js";
import { createInput } from "/shared/components/input.js";
import { openPurchaseSheet } from "/shared/components/purchase-sheet.js";
import {
  getProduct,
  getProfile,
  getAddress,
  saveAddress,
  clearAddress,
  createOrder,
} from "/shared/js/api.js";
import {
  createElement,
  ChevronDown,
  Check,
} from "https://cdn.jsdelivr.net/npm/lucide@latest/+esm";

const productId = new URLSearchParams(location.search).get("id");

mountAppBar("#app-bar", {
  title: "결제",
  onBack: () => {
    location.href = "/user/store/products/";
  },
});

const app = document.querySelector("#app");
app.innerHTML = `
  <div class="order">
    <div class="order__product">
      <img class="order__product-image" data-product-image style="display: none" />
      <div>
        <p class="order__product-price" data-product-price></p>
        <p class="order__product-name" data-product-name></p>
      </div>
    </div>

    <div class="order-card">
      <div class="order-card__row">
        <span class="order-card__label-group">
          <span class="order-card__badge">P</span>
          <span class="order-card__label">MY 포인트</span>
        </span>
        <span class="order-card__value" data-my-points></span>
      </div>
    </div>

    <div class="order-card order-card--address">
      <button class="order-card__toggle" type="button" data-address-toggle>
        <span class="order-card__label">주소지</span>
        <span class="order-card__value order-card__value--muted" data-address-value>미설정</span>
        <span class="order-card__chevron" data-chevron></span>
      </button>
      <div class="order-card__expand" data-address-form>
        <div class="order-card__expand-inner" data-address-form-inner></div>
      </div>
    </div>

    <div class="order-card order-card--agree" data-agree-card>
      <button class="order-card__agree-head" type="button" data-agree-toggle>
        <span class="order-card__checkbox" data-checkbox></span>
        <span class="order-card__agree-title">구매 동의</span>
      </button>
      <div class="order-card__row order-card__row--sub">
        <span class="order-card__label">구매 후 포인트</span>
        <span class="order-card__value" data-remaining-points></span>
      </div>
      <div class="order-card__divider"></div>
      <div class="order-card__use-box">
        <span class="order-card__use-label">사용 포인트</span>
        <span class="order-card__use-value" data-use-value></span>
      </div>
    </div>
  </div>
`;

// 참고: 이 lucide CDN 빌드는 createElement의 {size} 옵션을 매핑하지 않고 항상 기본 24x24로
// 렌더링(껍데기 size 속성만 붙음) — width/height를 직접 지정해야 실제로 반영된다.
document
  .querySelector("[data-chevron]")
  .appendChild(createElement(ChevronDown, { width: 16, height: 16 }));
document
  .querySelector("[data-checkbox]")
  .appendChild(createElement(Check, { width: 16, height: 16 }));

let product = null;
let myPoints = 0;
let savedAddress = null;
let agreed = false;
// "주소지 저장" 토글이 켜져 있는지(= 이 주소를 다음 구매에도 쓰도록 localStorage에 남길지)만
// 따로 추적한다. savedAddress 자체는 토글 여부와 무관하게 "이번 주문에 쓸 주소"로 항상 쓰인다.
let addressSaveEnabled = false;

const addressInputs = {
  address: createInput({ placeholder: "주소를 입력해 주세요" }),
  detail: createInput({ placeholder: "상세 주소를 입력해 주세요" }),
};

const addressForm = document.querySelector("[data-address-form]");
const addressFormInner = document.querySelector("[data-address-form-inner]");
addressFormInner.appendChild(addressInputs.address.el);
addressFormInner.appendChild(addressInputs.detail.el);

const saveBtn = document.createElement("button");
saveBtn.type = "button";
saveBtn.className = "order-card__save";
saveBtn.textContent = "주소지 저장";
addressFormInner.appendChild(saveBtn);

function setAddressFormOpen(open) {
  addressForm.classList.toggle("is-open", open);
  document
    .querySelector("[data-address-toggle]")
    .classList.toggle("is-open", open);
}

document
  .querySelector("[data-address-toggle]")
  .addEventListener("click", () => {
    setAddressFormOpen(!addressForm.classList.contains("is-open"));
  });

// "주소지 저장" 토글 — 누르면 --color-primary로 바뀌어 유지되며(다음 구매에도 이 주소를
// 쓰겠다는 뜻, spec.md "주소지 저장을 눌러 사용자 주소지를 다음 구매에도 사용할 수 있다"),
// 다시 누르면 꺼서 저장을 취소(localStorage에서 제거)한다. 입력한 주소 자체는 토글 여부와
// 무관하게 항상 이번 주문에 쓰인다 — 토글은 "다음 구매에도 남길지"만 결정한다.
saveBtn.addEventListener("click", async () => {
  savedAddress = {
    address: addressInputs.address.getValue(),
    detail: addressInputs.detail.getValue(),
  };

  addressSaveEnabled = !addressSaveEnabled;
  if (addressSaveEnabled) {
    await saveAddress(savedAddress);
  } else {
    await clearAddress();
  }

  renderAddressValue();
  setAddressFormOpen(false);
});

document.querySelector("[data-agree-toggle]").addEventListener("click", () => {
  if (
    document.querySelector("[data-checkbox]").classList.contains("is-disabled")
  )
    return;
  agreed = !agreed;
  document
    .querySelector("[data-agree-card]")
    .classList.toggle("is-checked", agreed);
  document
    .querySelector("[data-checkbox]")
    .classList.toggle("is-checked", agreed);
  document
    .querySelector("[data-use-value]")
    .classList.toggle("is-checked", agreed);
  if (agreed) openConfirmSheet();
});

load();

async function load() {
  const priceEl = document.querySelector("[data-product-price]");
  const nameEl = document.querySelector("[data-product-name]");
  const myPointsEl = document.querySelector("[data-my-points]");
  const remainingEl = document.querySelector("[data-remaining-points]");
  const useValueEl = document.querySelector("[data-use-value]");
  const addressValueEl = document.querySelector("[data-address-value]");

  renderSkeleton(priceEl, { width: 100, height: 24 });
  renderSkeleton(nameEl, { width: 140, height: 17 });
  renderSkeleton(myPointsEl, { width: 80, height: 19 });
  renderSkeleton(addressValueEl, { width: 60, height: 19 });

  const [fetchedProduct, profile, address] = await Promise.all([
    getProduct(productId),
    getProfile(),
    getAddress(),
  ]);

  product = fetchedProduct;
  myPoints = profile.points;
  savedAddress = address;
  addressSaveEnabled = Boolean(address?.address);

  clearSkeleton(priceEl);
  clearSkeleton(nameEl);
  clearSkeleton(myPointsEl);
  clearSkeleton(addressValueEl);

  const image = document.querySelector("[data-product-image]");
  image.src = product.image;
  image.alt = product.name;
  // hidden 속성은 variables.css의 전역 img,svg{display:block} 리셋에 밀려 안 먹힌다(author
  // 스타일시트의 display 선언이 선택자 우선순위와 무관하게 UA 기본 [hidden] 규칙을 이긴다) —
  // 인라인 style.display로 직접 제어한다. (user/profile/index.js와 동일한 버그/수정)
  image.style.display = "";

  priceEl.textContent = `${product.price.toLocaleString()} 포인트`;
  nameEl.textContent = product.name;
  myPointsEl.textContent = `${profile.points.toLocaleString()} 포인트`;

  const remaining = myPoints - product.price;
  const canAfford = remaining >= 0;
  remainingEl.textContent = `${remaining.toLocaleString()} 포인트`;
  useValueEl.textContent = `${product.price.toLocaleString()} 포인트`;

  const checkbox = document.querySelector("[data-checkbox]");
  checkbox.classList.toggle("is-disabled", !canAfford);
  document.querySelector("[data-agree-toggle]").disabled = !canAfford;

  renderAddressValue();
}

function renderAddressValue() {
  const valueEl = document.querySelector("[data-address-value]");

  if (savedAddress?.address) {
    valueEl.textContent =
      `${savedAddress.address} ${savedAddress.detail || ""}`.trim();
    valueEl.classList.remove("order-card__value--muted");
    addressInputs.address.control.value = savedAddress.address;
    addressInputs.detail.control.value = savedAddress.detail || "";
  } else {
    valueEl.textContent = "미설정";
    valueEl.classList.add("order-card__value--muted");
  }

  saveBtn.classList.toggle("is-active", addressSaveEnabled);
}

function openConfirmSheet() {
  const remaining = myPoints - product.price;

  openPurchaseSheet({
    name: product.name,
    remaining,
    submitLabel: `${product.price.toLocaleString()} 포인트 사용`,
    backdrop: false,
    onConfirm: async () => {
      const result = await createOrder({
        productId: product.id,
        address: savedAddress,
      });
      if (result.ok) {
        location.href = `/user/order/success/index.html?orderId=${result.order.id}`;
      }
      return result;
    },
    // 시트가 외부 클릭/Esc로 닫히거나 구매 확인 후 닫힐 때 항상 호출됨 — 체크 상태를 되돌린다
    onClose: () => {
      agreed = false;
      document
        .querySelector("[data-agree-card]")
        .classList.remove("is-checked");
      document.querySelector("[data-checkbox]").classList.remove("is-checked");
      document.querySelector("[data-use-value]").classList.remove("is-checked");
    },
  });
}
