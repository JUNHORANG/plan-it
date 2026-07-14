/*
  스텝퍼 — 공통 UI 컴포넌트
  참조: Figma 회원가입 "stepper" 컴포넌트(4008:547 등, 3-step) — 회원가입 3단계 진행 표시

  동작: total개의 가로 트랙을 나란히 두고, 현재 step까지(포함)는 채워지고 나머지는 빈 채로
  옅은 초록 트랙만 보인다. 이번에 새로 채워지는 구간(from~step 사이)만 왼쪽에서 오른쪽으로
  서서히 채워지는 애니메이션이 재생되고, 이미 지나온 이전 step(0~from)은 애니메이션 없이
  바로 채워진 상태로 그려진다 — 매 스텝 전환마다 전체를 다시 그려도 이전 구간이 다시
  애니메이션되며 "동작"하지 않게 하기 위함.
*/

export function mountStepper(el, { step = 1, total = 3, from = 0 } = {}) {
  el.classList.add("stepper");
  render(step, from);

  function render(current, previous) {
    el.innerHTML = Array.from({ length: total }, (_, i) => {
      const alreadyFilled = i < previous;
      return `<span class="stepper__bar${alreadyFilled ? " stepper__bar--instant is-active" : ""}"><span class="stepper__fill"></span></span>`;
    }).join("");

    // fill을 처음부터 0%로 그려둔 채 다음 프레임에서 is-active를 붙여야 transition이
    // 실제로 재생된다(생성과 동시에 100%를 주면 트랜지션 없이 순간 채워짐). 이미 지나온
    // 구간(stepper__bar--instant)은 위에서 이미 is-active + transition:none으로 그렸으므로
    // 여기서는 새로 채워지는 구간만 다룬다.
    requestAnimationFrame(() => {
      el.querySelectorAll(".stepper__bar").forEach((bar, i) => {
        if (i >= previous && i < current) bar.classList.add("is-active");
      });
    });
  }

  return {
    setStep: (next, prev = next) => render(next, prev),
  };
}
