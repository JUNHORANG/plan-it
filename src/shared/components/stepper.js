/*
  스텝퍼 — 공통 UI 컴포넌트
  참조: Figma 회원가입 "stepper" 컴포넌트(4008:547 등, 3-step) — 회원가입 3단계 진행 표시

  동작: total개의 가로 바를 나란히 두고, 현재 step까지(포함) 주조색으로 채우고 나머지는
  옅은 초록으로 둔다(온보딩 페이지네이션과 동일한 "현재까지 채움" 규칙).
*/

export function mountStepper(el, { step = 1, total = 3 } = {}) {
  el.classList.add("stepper");
  render();

  function render() {
    el.innerHTML = Array.from({ length: total }, (_, i) => {
      const active = i < step;
      return `<span class="stepper__bar${active ? " is-active" : ""}"></span>`;
    }).join("");
  }

  return {
    setStep: (next) => {
      step = next;
      render();
    },
  };
}
