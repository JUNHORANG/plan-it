/*
  홈 최초 진입 온보딩 3-step
  참조: spec.md "홈"(온보딩 step1~3), Figma 온보딩-step1(4163:2534)/step2(4164:1021)/step3(4164:1039)
        + 타블렛(4180:821/4180:838/4180:857)

  localStorage `planit.onboarded`가 없을 때만 1회 노출. 건너뛰기 또는 step3의
  "일정 추가하러 가기" CTA로 내릴 수 있다(그 외 닫는 방법 없음 — 배경 클릭/X 없음, spec.md 기준).
  헤드라인 강조 단어(초록, --color-primary)는 Figma 텍스트 런 실측(getRangeFills) 기준 —
  "루틴"/"포인트"/"식물"만 강조되고 나머지는 --color-body. §9 참조: 타블렛 step3 원문("모으시면")이
  모바일("다 모았다면")과 달라 모바일 문구로 통일, 모바일 step2의 건너뛰기 버튼만 강조색(orange)으로
  튀는 것도 나머지 5개 측정값(assist)과 통일.
*/
import { createElement, ChevronLeft, ChevronRight } from "https://cdn.jsdelivr.net/npm/lucide@latest/+esm";
import { createCtaButton } from "/shared/components/cta-button.js";
import { lockScroll, unlockScroll, storage } from "/shared/js/utils.js";

const STORAGE_KEY = "planit.onboarded";

const STEPS = [
  {
    image: "/images/Onboarding_step1.png",
    headline: `일정을 채우고 완료하면서,<br />매일 건강한 <span class="onboarding__accent">루틴</span>을 지속해 보세요!`,
  },
  {
    image: "/images/Onboarding_step2.png",
    headline: `모든 일정을 무사히 완료하면<br /><span class="onboarding__accent">포인트</span>를 지급해 드려요!`,
  },
  {
    image: "/images/Onboarding_step3.png",
    headline: `<span class="onboarding__accent">포인트</span>를 다 모았다면<br />상점에서 <span class="onboarding__accent">식물</span>을 구매할 수 있어요!`,
  },
];

export function maybeShowOnboarding() {
  // TODO(발표용 임시): 원래는 spec.md 기준 1회만 노출해야 해서 아래 가드가 있어야 하지만,
  // 개발 중 발표 데모를 위해 홈 진입할 때마다 보이도록 잠시 주석 처리. 되돌릴 때: 주석 해제.
  // if (storage.get(STORAGE_KEY)) return;
  openOnboarding();
}

function openOnboarding() {
  lockScroll();

  const root = document.querySelector("#overlay-root");
  const el = document.createElement("div");
  el.className = "onboarding";
  root.appendChild(el);

  let step = 0;
  let isAnimating = false;

  function close() {
    storage.set(STORAGE_KEY, true);
    unlockScroll();
    el.remove();
  }

  // 스텝 전환이 인디케이션/헤드라인/이미지가 한 번에 뚝 바뀌면 딱딱해 보여서, 페이드 아웃 →
  // 콘텐츠 교체 → 페이드 인으로 부드럽게 넘어가게 한다. 애니메이션 중 중복 클릭은 무시.
  function goTo(next) {
    if (isAnimating || next < 0 || next > STEPS.length - 1) return;
    isAnimating = true;
    el.querySelector("[data-panel]").classList.remove("is-visible");
    setTimeout(() => {
      step = next;
      render();
      isAnimating = false;
    }, 180);
  }

  function render() {
    const isFirst = step === 0;
    const isLast = step === STEPS.length - 1;

    el.innerHTML = `
      <button class="onboarding__skip" type="button" data-skip>건너 뛰기</button>
      <div class="onboarding__dots">
        ${STEPS.map((_, i) => `<span class="onboarding__dot${i <= step ? " is-filled" : ""}"></span>`).join("")}
      </div>
      <div class="onboarding__panel" data-panel>
        <p class="onboarding__headline">${STEPS[step].headline}</p>
        <div class="onboarding__stage">
          <button class="onboarding__nav" type="button" aria-label="이전" data-prev${isFirst ? " disabled" : ""}></button>
          <img class="onboarding__image" src="${STEPS[step].image}" alt="" />
          <button class="onboarding__nav" type="button" aria-label="다음" data-next${isLast ? " disabled" : ""}></button>
        </div>
        <div class="onboarding__cta-slot"></div>
      </div>
      <div class="onboarding__home-indicator"></div>
    `;

    el.querySelector("[data-prev]").appendChild(createElement(ChevronLeft, { size: 40 }));
    el.querySelector("[data-next]").appendChild(createElement(ChevronRight, { size: 40 }));

    el.querySelector("[data-skip]").addEventListener("click", close);
    el.querySelector("[data-prev]").addEventListener("click", () => goTo(step - 1));
    el.querySelector("[data-next]").addEventListener("click", () => goTo(step + 1));

    if (isLast) {
      const cta = createCtaButton({
        label: "일정 추가하러 가기",
        disabled: false,
        onClick: () => {
          storage.set(STORAGE_KEY, true);
          location.href = "/user/plans/";
        },
      });
      cta.el.classList.add("onboarding__cta");
      el.querySelector(".onboarding__cta-slot").appendChild(cta.el);
    }

    requestAnimationFrame(() => {
      el.querySelector("[data-panel]").classList.add("is-visible");
    });
  }

  render();
}
