/*
  로그인 (/)
  참조: spec.md "로그인", Figma 로그인 기본/입력창 활성화/검증/에러 (4001:44, 4006:955, 4006:989, 4434:1479)
  라우팅: 로그인 성공 시 이동 경로는 blueprint.md §9(확인 필요 항목) 결정에 따라 /user/plans/ 사용

  실패 UI: Figma(4434:1479) 기준 — 입력값은 지우지 않고 그대로 두고, 두 입력창 모두 빨간 테두리로
  표시하며, 에러 문구는 비밀번호 입력창의 기본 에러 슬롯(input.js의 setError)에만 띄운다(이메일은
  테두리만 빨갛게, 문구는 없음 — 문구가 중복으로 두 군데 보이지 않게). 재사용 컴포넌트(4132:588)에
  추가된 에러 토스트("요청에 실패 했습니다.")도 함께 띄운다 — spec.md의 토스트 요구사항 + Figma
  인라인 문구 둘 다 반영 (blueprint.md §9 참조).

  Supabase Auth(signInWithPassword)로 실제 계정을 검증한다. 관리자 여부는 하드코딩 자격 증명이
  아니라 profiles.is_admin 플래그로 판단(api.js의 login() 참조).
*/

import { createInput } from "/shared/components/input.js";
import { createCtaButton } from "/shared/components/cta-button.js";
import { showToast } from "/shared/components/toast.js";
import { login } from "/shared/js/api.js";
import { supabase } from "/shared/js/supabase-client.js";

// 이미 로그인된 세션이면 로그인 폼을 다시 보여줄 필요 없이 바로 홈으로 보낸다
const {
  data: { session },
} = await supabase.auth.getSession();
if (session) {
  location.href = "/user/plans/";
}

const app = document.querySelector("#app");

app.innerHTML = `
  <div class="login">
    <div class="login__brand">
      <img class="login__mascot no-drag" src="/images/half_titi.png" alt="Plan It 지구 마스코트" />
      <div class="login__logo no-drag">PLAN <em>!</em>T</div>
      <p class="login__tagline no-drag">지구를 지키는 당신의 계획!</p>
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
  const filled =
    emailInput.getValue().trim().length > 0 &&
    passwordInput.getValue().length > 0;
  submit.setDisabled(!filled);
}

// Figma(4132:661) "활성화"(포커스 중)와 "블러(text 있음)" 상태 구분: 포커스 중엔 항상
// 활성화(초록 테두리)로 보이고, 포커스를 벗어나 값이 남아 있을 때만 블러 스타일(연두 배경)로
// 바뀐다. 예전엔 onInput마다 setValid를 호출해서 타이핑 중에도 블러 스타일이 덮어씌워졌었다.
// 비밀번호 입력창도 동일한 상태 전환이 있어야 하는데 이 배선이 아예 빠져 있어서 blur 후에도
// 계속 기본(무클래스) 상태 — 옅은 회색 테두리라 비활성화처럼 보였다.
for (const input of [emailInput, passwordInput]) {
  input.control.addEventListener("focus", () => input.setValid(false));
  input.control.addEventListener("blur", () => {
    input.setValid(input.getValue().trim().length > 0);
  });
}

async function handleLogin() {
  submit.setLoading(true);
  const result = await login(emailInput.getValue(), passwordInput.getValue());
  submit.setLoading(false);

  if (result.ok) {
    location.href = result.isAdmin ? "/admin/orders/" : "/user/plans/";
    return;
  }

  emailInput.setError();
  passwordInput.setError(
    "아이디 또는 비밀번호가 맞지 않습니다! 다시 한번 확인해 주세요.",
  );
  submit.setDisabled(true); // Figma(4434:1479): 실패 직후 CTA는 다시 비활성 상태 — 값을 고쳐야 재시도 가능
  showToast("이메일 혹은 비밀번호를 확인해 주세요.", "error");
}
