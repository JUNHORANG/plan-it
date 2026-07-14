/*
  회원가입 (/signup/)
  참조: spec.md "회원가입", Figma 회원가입-닉네임(4008:358/680)/이메일(4007:482, 4008:249)/
        비밀번호(4008:290)/완료(4008:340)/뒤로가기 모달(4106:699), 타블렛(4146:1105)

  3-step(닉네임 중복확인 → 이메일 인증(5분 타이머+연장) → 비밀번호 설정) + 완료 화면을
  한 페이지(SPA처럼 #app을 매 스텝 다시 그림)에서 처리한다. blueprint.md §2 라우팅 맵의
  `/signup/` 한 줄이 이 흐름 전체를 가리키므로 별도 URL로 쪼개지 않는다.

  뒤로가기(앱바)는 스텝 1~3에서는 항상 확인 모달을 띄우고("뒤로가기" 선택 시 로그인으로 이동),
  완료 화면에서는 잃을 입력값이 없으므로 모달 없이 바로 이동한다.

  §9 참조: (1) Figma 실제 라벨이 spec.md 문구와 달라("인증 번호 전송"이 아니라 "이메일 인증",
  "인증 번호 확인" 중간 단계 없이 코드 입력 즉시 "다음"으로 검증+다음 스텝 동시 처리) Figma를
  따름. (2) spec.md 6번 "다음 CTA 버튼을 클릭하면 사용자 정보 입력 단계로 이동한다"는 실제
  Figma에 없는 4번째 스텝을 가리키는 문구라 무시하고 비밀번호 다음은 바로 완료 화면으로 이동.
*/

import { mountAppBar } from "/shared/components/app-bar.js";
import { createSignupInput } from "./signup-input.js";
import { createCtaButton } from "/shared/components/cta-button.js";
import { mountStepper } from "/shared/components/stepper.js";
import { openModal } from "/shared/components/modal.js";
import { showToast } from "/shared/components/toast.js";
import { checkNickname, sendVerificationCode, verifyEmailCode, signup } from "/shared/js/api.js";

const STEP_TITLES = { 1: "닉네임 설정", 2: "이메일 인증", 3: "비밀번호 설정" };
const TIMER_SECONDS = 5 * 60;

const state = {
  step: 1,
  nickname: "",
  nicknameVerified: false,
  email: "",
  codeSent: false,
  password: "",
};

let timerInterval = null;
let lastRenderedStep = 0; // 스텝퍼가 마지막으로 채워 그렸던 지점 — 이 이전 구간은 재애니메이션하지 않는다

const appBar = mountAppBar("#app-bar", { title: STEP_TITLES[1], onBack: handleBack });
const app = document.querySelector("#app");

renderStep();

function handleBack() {
  if (state.step === "done") {
    location.href = "/";
    return;
  }
  openModal({
    title: "뒤로 가기",
    body: "회원 가입을 진행 했던 내역이 사라집니다. 뒤로 가기를 하시겠습니까?",
    cancelLabel: "취소하기",
    confirmLabel: "뒤로가기",
    onConfirm: () => {
      location.href = "/";
    },
  });
}

function renderStep() {
  clearInterval(timerInterval);

  if (state.step === "done") {
    renderComplete();
    return;
  }

  appBar.setTitle(STEP_TITLES[state.step]);

  app.innerHTML = `
    <div class="signup">
      <div class="signup__stepper" data-stepper></div>
      <div class="signup__fields" data-fields></div>
    </div>
  `;
  mountStepper(document.querySelector("[data-stepper]"), { step: state.step, total: 3, from: lastRenderedStep });
  lastRenderedStep = state.step;

  if (state.step === 1) renderNicknameStep();
  else if (state.step === 2) renderEmailStep();
  else renderPasswordStep();
}

function isValidNickname(value) {
  return /^[가-힣a-zA-Z0-9]{1,8}$/.test(value);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPassword(value) {
  return value.length >= 8;
}

function renderNicknameStep() {
  const fields = document.querySelector("[data-fields]");

  const nicknameInput = createSignupInput({
    type: "text",
    label: "닉네임",
    placeholder: "한글, 영어, 숫자를 포함한 8자 이내로 작성해 주세요.",
    showValidIcon: true,
    validateOnBlur: false,
    onInput: (value) => {
      state.nickname = value;
      state.nicknameVerified = false;
      nicknameInput.clearState();
      updateCta();
    },
  });
  nicknameInput.control.maxLength = 8;
  nicknameInput.control.value = state.nickname;
  fields.appendChild(nicknameInput.el);

  const cta = createCtaButton({
    label: state.nicknameVerified ? "다음" : "중복 확인",
    disabled: !isValidNickname(state.nickname),
    onClick: async () => {
      if (state.nicknameVerified) {
        state.step = 2;
        renderStep();
        return;
      }
      cta.setLoading(true);
      const result = await checkNickname(state.nickname);
      cta.setLoading(false);

      if (result.ok) {
        state.nicknameVerified = true;
        nicknameInput.setValid(true);
        cta.setLabel("다음");
        cta.setDisabled(false);
      } else {
        nicknameInput.setError("중복 된 닉네임이 있습니다.");
        showToast("중복 된 닉네임이 있습니다.", "error");
        cta.setDisabled(true);
      }
    },
  });
  cta.el.classList.add("signup__cta");
  document.querySelector(".signup").appendChild(cta.el);

  function updateCta() {
    cta.setLabel(state.nicknameVerified ? "다음" : "중복 확인");
    cta.setDisabled(!isValidNickname(state.nickname));
  }
}

function renderEmailStep() {
  const fields = document.querySelector("[data-fields]");
  let phase = "email";
  let code = "";
  let timeLeft = TIMER_SECONDS;
  let expired = false;
  let codeInput = null;
  let timerEl = null;

  const emailInput = createSignupInput({
    type: "email",
    label: "이메일",
    placeholder: "이메일을 작성해 주세요.",
    showValidIcon: true,
    validateOnBlur: false,
    onInput: (value) => {
      state.email = value;
      if (phase === "email") cta.setDisabled(!isValidEmail(state.email));
    },
  });
  emailInput.control.value = state.email;
  fields.appendChild(emailInput.el);

  const cta = createCtaButton({
    label: "이메일 인증",
    disabled: !isValidEmail(state.email),
    onClick: handleCtaClick,
  });
  cta.el.classList.add("signup__cta");
  document.querySelector(".signup").appendChild(cta.el);

  async function handleCtaClick() {
    if (phase === "email") {
      cta.setLoading(true);
      const sendResult = await sendVerificationCode(state.email, state.nickname);
      cta.setLoading(false);

      if (!sendResult.ok) {
        showToast(sendResult.message || "인증번호 전송에 실패했습니다.", "error");
        return;
      }

      phase = "code";
      state.codeSent = true;
      emailInput.setValid(true);
      emailInput.control.disabled = true;
      revealCodeField();
      cta.setLabel("다음");
      cta.setDisabled(true);
      return;
    }

    cta.setLoading(true);
    const result = await verifyEmailCode(state.email, code);
    cta.setLoading(false);

    if (result.ok) {
      state.step = 3;
      renderStep();
    } else {
      codeInput.setError("인증번호가 일치하지 않습니다.");
      showToast("인증번호가 일치하지 않습니다.", "error");
      cta.setDisabled(true);
    }
  }

  function revealCodeField() {
    codeInput = createSignupInput({
      type: "text",
      label: "이메일 인증",
      placeholder: "인증 번호 6자리를 작성해 주세요.",
      validateOnBlur: false,
      onInput: (value) => {
        code = value;
        cta.setDisabled(expired || code.length !== 6);
      },
    });
    codeInput.control.maxLength = 6;
    codeInput.control.inputMode = "numeric";
    fields.appendChild(codeInput.el);

    const timerWrap = document.createElement("div");
    timerWrap.className = "signup__timer";
    timerWrap.innerHTML = `
      <p class="signup__timer-time" data-timer></p>
      <button class="signup__timer-extend" type="button" data-extend>시간 연장하기</button>
    `;
    fields.appendChild(timerWrap);
    timerEl = timerWrap.querySelector("[data-timer]");

    const extendBtn = timerWrap.querySelector("[data-extend]");
    extendBtn.addEventListener("click", async () => {
      extendBtn.disabled = true;
      const result = await sendVerificationCode(state.email, state.nickname);
      extendBtn.disabled = false;

      if (!result.ok) {
        showToast(result.message || "인증번호 재전송에 실패했습니다.", "error");
        return;
      }

      timeLeft = TIMER_SECONDS;
      expired = false;
      cta.setDisabled(code.length !== 6);
      startTimer();
      showToast("인증번호를 다시 보냈어요.", "success");
    });

    startTimer();
  }

  function startTimer() {
    clearInterval(timerInterval);
    tickTimer();
    timerInterval = setInterval(tickTimer, 1000);
  }

  function tickTimer() {
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      expired = true;
      cta.setDisabled(true);
      timerEl.textContent = "00 : 00";
      return;
    }
    const m = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const s = String(timeLeft % 60).padStart(2, "0");
    timerEl.textContent = `${m} : ${s}`;
    timeLeft--;
  }
}

function renderPasswordStep() {
  const fields = document.querySelector("[data-fields]");

  const passwordInput = createSignupInput({
    type: "password",
    label: "비밀번호",
    placeholder: "비밀번호를 작성해 주세요.",
    validateOnBlur: false,
    onInput: () => updateCta(),
  });
  fields.appendChild(passwordInput.el);

  const confirmInput = createSignupInput({
    type: "password",
    label: "비밀번호 인증",
    placeholder: "비밀번호를 확인해 주세요.",
    validateOnBlur: false,
    onInput: () => updateCta(),
  });
  fields.appendChild(confirmInput.el);

  const cta = createCtaButton({
    label: "다음",
    disabled: true,
    onClick: async () => {
      cta.setLoading(true);
      state.password = passwordInput.getValue();
      const result = await signup({ password: state.password });
      cta.setLoading(false);

      if (!result.ok) {
        showToast(result.message || "회원가입에 실패했습니다.", "error");
        return;
      }

      state.step = "done";
      renderStep();
    },
  });
  cta.el.classList.add("signup__cta");
  document.querySelector(".signup").appendChild(cta.el);

  function updateCta() {
    const passwordOk = isValidPassword(passwordInput.getValue());
    const matches = passwordOk && confirmInput.getValue().length > 0 && passwordInput.getValue() === confirmInput.getValue();
    cta.setDisabled(!matches);
  }
}

function renderComplete() {
  appBar.setTitle("");

  app.innerHTML = `
    <div class="signup-complete">
      <h1 class="signup-complete__title">환영해요!</h1>
      <p class="signup-complete__desc">회원 가입이 완료 됐어요! 환영해요!</p>
      <div class="signup-complete__illustration">
        <img class="signup-complete__sparkle signup-complete__sparkle--tl" src="/images/shining.png" alt="" />
        <img class="signup-complete__globe" src="/images/front_titi.png" alt="환영 일러스트" />
        <img class="signup-complete__sparkle signup-complete__sparkle--br" src="/images/shining.png" alt="" />
      </div>
    </div>
  `;

  const cta = createCtaButton({
    label: "로그인 하기",
    disabled: false,
    onClick: () => {
      // 2단계(verifyEmailCode)에서 이미 Supabase 세션이 발급된 상태라 재로그인 없이 홈으로 이동
      location.href = "/user/plans/";
    },
  });
  cta.el.classList.add("signup__cta");
  document.querySelector(".signup-complete").after(cta.el);
}
