/*
  회원가입 전용 입력창 — shared/components/input.js와 별도로 둔다.
  참조: Figma 회원가입-닉네임(4008:358/680)/이메일(4007:482, 4008:249)/비밀번호(4008:290)

  회원가입 입력창은 위에 라벨("닉네임"/"이메일" 등)이 있어 눈 아이콘·체크 아이콘 위치가
  라벨 없는 로그인/구매 등 다른 화면과 달라야 하는데, 처음에 shared/components/input.js를
  그대로 재사용하다 보니 그 아이콘 위치를 회원가입에 맞춰 고칠 때마다 로그인·구매 입력창
  레이아웃이 같이 깨졌다 — 그래서 클래스명(signup-field*)부터 완전히 분리해 이 파일과
  signup-input.css만 건드리면 되게 한다.
*/
import { createElement, Eye, EyeOff, Check } from "https://cdn.jsdelivr.net/npm/lucide@latest/+esm";

export function createSignupInput({
  type = "text",
  name = "",
  label = "",
  placeholder = "",
  required = false,
  autocomplete = "off",
  validate,
  validateOnBlur = false,
  showValidIcon = false,
  onInput,
} = {}) {
  const wrapper = document.createElement("div");
  wrapper.className = "signup-field";

  if (label) {
    const labelEl = document.createElement("label");
    labelEl.className = "signup-field__label";
    labelEl.textContent = label;
    wrapper.appendChild(labelEl);
  }

  const isPassword = type === "password";
  const control = document.createElement("input");
  control.className = "signup-field__control";
  control.type = isPassword ? "password" : type;
  control.name = name;
  control.placeholder = placeholder;
  control.required = required;
  control.autocomplete = autocomplete;

  const error = document.createElement("p");
  error.className = "signup-field__error";

  wrapper.appendChild(control);

  // 닉네임 중복확인/이메일 인증처럼 검증 결과를 입력창 안 체크 아이콘으로도 보여주는 화면용
  // (Figma 4008:358/680 실측 — 기본 회색, is-valid 시 주조색 초록)
  if (showValidIcon) {
    const checkIcon = document.createElement("span");
    checkIcon.className = "signup-field__check";
    checkIcon.appendChild(createElement(Check, { size: 18 }));
    wrapper.appendChild(checkIcon);
  }

  if (isPassword) {
    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "signup-field__toggle";
    toggleBtn.setAttribute("aria-label", "비밀번호 표시");
    toggleBtn.appendChild(createElement(Eye, { size: 18 }));

    toggleBtn.addEventListener("click", () => {
      const showing = control.type === "text";
      control.type = showing ? "password" : "text";
      toggleBtn.innerHTML = "";
      toggleBtn.appendChild(createElement(showing ? Eye : EyeOff, { size: 18 }));
      toggleBtn.setAttribute("aria-label", showing ? "비밀번호 표시" : "비밀번호 숨기기");
    });

    wrapper.appendChild(toggleBtn);
  }

  wrapper.appendChild(error);

  function clearState() {
    wrapper.classList.remove("is-valid", "is-error");
    error.textContent = "";
  }

  function runValidate() {
    if (!validate) return true;
    const result = validate(control.value);
    clearState();
    if (result === true) {
      wrapper.classList.add("is-valid");
      return true;
    }
    wrapper.classList.add("is-error");
    error.textContent = typeof result === "string" ? result : "";
    return false;
  }

  control.addEventListener("input", () => {
    if (wrapper.classList.contains("is-error")) clearState();
    if (onInput) onInput(control.value);
  });

  if (validateOnBlur) {
    control.addEventListener("blur", runValidate);
  }

  return {
    el: wrapper,
    control,
    getValue: () => control.value,
    validate: runValidate,
    setError: (message = "") => {
      wrapper.classList.remove("is-valid");
      wrapper.classList.add("is-error");
      error.textContent = message;
    },
    setValid: (isValid) => {
      wrapper.classList.toggle("is-valid", isValid);
      if (isValid) wrapper.classList.remove("is-error");
    },
    clearState,
  };
}
