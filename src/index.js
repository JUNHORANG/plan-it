/*
  로그인 (/)
  참조: spec.md "로그인", Figma 로그인 기본/입력창 활성화/검증/에러 (4001:44, 4006:955, 4006:989, 4434:1479)
  라우팅: 로그인 성공 시 이동 경로는 blueprint.md §9(확인 필요 항목) 결정에 따라 /user/plans/ 사용

  실패 UI: Figma(4434:1479) 기준 — 입력값은 지우지 않고 그대로 두고, 두 입력창 모두 빨간 테두리로
  표시하며, 에러 문구는 비밀번호 입력창의 기본 에러 슬롯(input.js의 setError)에만 띄운다(이메일은
  테두리만 빨갛게, 문구는 없음 — 문구가 중복으로 두 군데 보이지 않게). 재사용 컴포넌트(4132:588)에
  추가된 에러 토스트("요청에 실패 했습니다.")도 함께 띄운다 — spec.md의 토스트 요구사항 + Figma
  인라인 문구 둘 다 반영 (blueprint.md §9 참조).

  mockLogin은 하드코딩된 이메일이 아니라 getProfile()로 얻은 실제(localStorage 시드) 이메일과
  비교한다 — 예전엔 "test@planit.com"을 하드코딩해서 data.js의 실제 유저 이메일과 어긋나 있었다
  (blueprint.md §9 25번 참조). 비밀번호는 스키마에 필드가 없어 데모용 고정값을 그대로 둔다.
*/

import { createInput } from "/shared/components/input.js";
import { createCtaButton } from "/shared/components/cta-button.js";
import { showToast } from "/shared/components/toast.js";
import { getProfile } from "/shared/js/api.js";

const app = document.querySelector("#app");

app.innerHTML = `
  <div class="login">
    <div class="login__brand">
      <img class="login__mascot" src="/images/half_titi.png" alt="Plan It 지구 마스코트" />
      <div class="login__logo">PLAN <em>!</em>T</div>
      <p class="login__tagline">지구를 지키는 당신의 계획!</p>
    </div>
    <form class="login__form" id="login-form"></form>
    <p class="login__footer">
      이메일로 간단하게 <a class="login__signup-link" href="/signup/">회원가입</a>
    </p>
  </div>
`;

const form = document.querySelector("#login-form");

const emailInput = createInput({
  type: "email",
  name: "email",
  placeholder: "이메일",
  required: true,
  autocomplete: "off", // 브라우저가 이전에 입력했던 값을 자동완성 목록으로 띄우지 않게 막는다
  validate: (value) => value.trim().length > 0 || "이메일을 작성해 주세요.",
  validateOnBlur: false,
  onInput: updateSubmitState,
});

const passwordInput = createInput({
  type: "password",
  name: "password",
  placeholder: "비밀번호",
  required: true,
  autocomplete: "off", // 위와 동일 — 저장된 비밀번호 자동완성 제안도 막는다
  validate: (value) => value.length > 0 || "비밀번호를 작성해 주세요.",
  validateOnBlur: false,
  onInput: updateSubmitState,
});

const submit = createCtaButton({
  label: "로그인",
  disabled: true,
  onClick: handleLogin,
});
submit.el.classList.add("login__submit");

form.append(emailInput.el, passwordInput.el, submit.el);
form.addEventListener("submit", (event) => event.preventDefault());

function updateSubmitState() {
  const filled = emailInput.getValue().trim().length > 0 && passwordInput.getValue().length > 0;
  submit.setDisabled(!filled);
  emailInput.setValid(emailInput.getValue().trim().length > 0);
}

async function handleLogin() {
  submit.setLoading(true);
  const result = await mockLogin(emailInput.getValue(), passwordInput.getValue());
  submit.setLoading(false);

  if (result.ok) {
    location.href = "/user/plans/";
    return;
  }

  emailInput.setError();
  passwordInput.setError("아이디 또는 비밀번호가 맞지 않습니다! 다시 한번 확인해 주세요.");
  submit.setDisabled(true); // Figma(4434:1479): 실패 직후 CTA는 다시 비활성 상태 — 값을 고쳐야 재시도 가능
  showToast("이메일 혹은 비밀번호를 확인해 주세요.", "error");
}

async function mockLogin(email, password) {
  const profile = await getProfile(); // getProfile 자체에 지연이 있어 별도 delay 불필요
  return { ok: email === profile.email && password === "test1234" };
}
