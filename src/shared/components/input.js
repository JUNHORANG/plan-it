/*
  입력창 — 공통 UI 컴포넌트
  참조: spec.md "입력창 - 공통 UI", Figma 로그인 입력창 상태(4001:44, 4006:955, 4006:989)

  동작
  1. 기본 상태 placeholder 노출 (네이티브 <input placeholder>)
  2. 포커스 시 테두리 강조 (CSS :focus)
  3. 입력 시작 시 placeholder 자동 숨김 (네이티브 동작)
  4. blur 시 validate() 실행
  5. 유효하면 is-valid 클래스로 배경 변경
  6. 유효하지 않으면 is-error 클래스 + 하단 오류 문구 표시

  아이콘: lucide-icons (CLAUDE.md 컨벤션 참조)
*/

import { createElement, Eye, EyeOff } from "https://cdn.jsdelivr.net/npm/lucide@latest/+esm";

export function createInput({
  type = "text",
  name = "",
  placeholder = "",
  required = false,
  validate,
  validateOnBlur = true,
  onInput,
} = {}) {
  const wrapper = document.createElement("div");
  wrapper.className = "input-field";

  const isPassword = type === "password";
  const control = document.createElement("input");
  control.className = "input-field__control";
  control.type = isPassword ? "password" : type;
  control.name = name;
  control.placeholder = placeholder;
  control.required = required;
  control.autocomplete = isPassword ? "current-password" : type === "email" ? "email" : "off";

  const error = document.createElement("p");
  error.className = "input-field__error";

  wrapper.appendChild(control);

  if (isPassword) {
    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "input-field__toggle";
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
