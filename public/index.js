/*
  로그인 (/)
  참조: spec.md "로그인", Figma 로그인 기본/입력창 활성화/검증 (4001:44, 4006:955, 4006:989)
  라우팅: 로그인 성공 시 이동 경로는 blueprint.md §9(확인 필요 항목) 결정에 따라 /user/plans/ 사용

  TODO: shared/js/api.js 가 만들어지면 mockLogin()을 실제 목 API 호출로 교체할 것.
*/

import { createInput } from "/shared/components/input.js";
import { createCtaButton } from "/shared/components/cta-button.js";
import { showToast } from "/shared/components/toast.js";

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
  validate: (value) => value.trim().length > 0 || "이메일을 작성해 주세요.",
  onInput: updateSubmitState,
});

const passwordInput = createInput({
  type: "password",
  name: "password",
  placeholder: "비밀번호",
  required: true,
  validate: (value) => value.length > 0 || "비밀번호를 작성해 주세요.",
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
  passwordInput.setError();
  showToast("이메일 혹은 비밀번호를 확인해 주세요.", "error");
}

function mockLogin(email, password) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ ok: email === "test@planit.com" && password === "planit1234" });
    }, 600);
  });
}
