/*
  CTA 버튼 — 공통 UI 컴포넌트
  참조: spec.md "CTA 버튼 - 공통 UI"

  동작
  1. 기본값 없으면 비활성화 (disabled)
  2. 필수 조건 충족 시 활성화 (setDisabled(false))
  3. 클릭 시 onClick 실행 (요청 또는 다음 단계 이동)
  4. 요청 중에는 점 3개 스피너 표시 (setLoading(true))
  5-6. 성공/실패 토스트는 호출 측에서 shared/components/toast.js로 처리
*/

export function createCtaButton({ label = "", disabled = true, onClick } = {}) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "cta-button";
  button.disabled = disabled;

  const labelEl = document.createElement("span");
  labelEl.className = "cta-button__label";
  labelEl.textContent = label;

  const spinner = document.createElement("span");
  spinner.className = "cta-button__spinner";
  spinner.innerHTML =
    '<span class="cta-button__dot"></span><span class="cta-button__dot"></span><span class="cta-button__dot"></span>';

  button.append(labelEl, spinner);

  if (onClick) {
    button.addEventListener("click", () => {
      if (button.disabled || button.classList.contains("is-loading")) return;
      onClick();
    });
  }

  return {
    el: button,
    setLabel: (text) => {
      labelEl.textContent = text;
    },
    setDisabled: (value) => {
      button.disabled = value;
    },
    setLoading: (value) => {
      button.classList.toggle("is-loading", value);
      button.disabled = value;
    },
  };
}
