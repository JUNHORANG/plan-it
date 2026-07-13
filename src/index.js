/*
  로그인 (/)
  참조: spec.md "로그인", Figma 로그인 기본/입력창 활성화/검증/에러 (4001:44, 4006:955, 4006:989, 4434:1479)
  라우팅: 로그인 성공 시 이동 경로는 blueprint.md §9(확인 필요 항목) 결정에 따라 /user/plans/ 사용

  실패 UI: Figma(4434:1479) 기준 — 입력값은 지우지 않고 그대로 두고, 두 입력창 모두 빨간 테두리로
  표시하며, 비밀번호 입력창 아래에 공통 에러 문구 하나를 띄운다. 재사용 컴포넌트(4132:588)에 추가된
  에러 토스트("요청에 실패 했습니다.")도 함께 띄운다 — spec.md의 토스트 요구사항 + Figma 인라인 문구
  둘 다 반영 (blueprint.md §9 참조).

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
  validateOnBlur: false,
  onInput: updateSubmitState,
});

const passwordInput = createInput({
  type: "password",
  name: "password",
  placeholder: "비밀번호",
  required: true,
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

const loginError = document.createElement("p");
loginError.className = "login__error";
loginError.textContent = "아이디 또는 비밀번호가 맞지 않습니다! 다시 한번 확인해 주세요.";

const errorContainer = document.createElement("div");
errorContainer.classList.add("error-container");
errorContainer.appendChild(loginError);

form.append(emailInput.el, passwordInput.el, errorContainer, submit.el);
form.addEventListener("submit", (event) => event.preventDefault());

function updateSubmitState() {
  const filled = emailInput.getValue().trim().length > 0 && passwordInput.getValue().length > 0;
  submit.setDisabled(!filled);
  loginError.classList.remove("is-visible");
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
  passwordInput.setError();
  loginError.classList.add("is-visible");
  submit.setDisabled(true); // Figma(4434:1479): 실패 직후 CTA는 다시 비활성 상태 — 값을 고쳐야 재시도 가능
  showToast("이메일 혹은 비밀번호를 확인해 주세요.", "error");
}

function mockLogin(email, password) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ ok: email === "test@planit.com" && password === "planit1234" });
    }, 600);
  });
}
