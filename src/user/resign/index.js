/*
  계정 탈퇴 (/user/resign/)
  참조: spec.md "회원 탈퇴", Figma 계정 탈퇴(4589:1159, 확인 모달 포함 4646:1134) 반영.
  이전엔 Figma API rate limit(429)로 실측을 못 받아와 spec.md 문구 + signup 이메일 인증
  스텝(blueprint.md §9 23번)만 재사용해 우선 구현했었는데(§9 29번), 이제 실측 완료:
  (1) 상단은 메인 헤더(햄버거+종)가 아니라 뒤로가기+제목 앱바(다른 화면과 동일한
  `shared/components/app-bar.js`) — 본문에 별도 h1 제목을 또 넣지 않는다(앱바 제목과 중복).
  (2) 인증 메일 발송 후 이메일 입력창에 체크 아이콘이 뜬다(신청 즉시 유효 표시, signup과
  동일한 의미론). (3) "계정 탈퇴" CTA 클릭 시 바로 탈퇴하지 않고 확인 모달(4646:1134)이
  한 번 더 뜬 뒤 확정된다 — 공용 `modal.js` 재사용(cancel=회색/좌, confirm=주조 accent색/우
  고정 스타일이라 Figma가 반대로 칠한 강조색은 이 프로젝트 관례(signup 뒤로가기 모달과 동일하게
  실제 파괴적 동작 쪽을 confirm/accent로 매핑)를 따름).

  이미 로그인된 계정의 이메일로만 진행되므로(새로 이메일을 입력받지 않음) 이메일 입력창은
  값을 채운 채 비활성화(disabled) 상태로 읽기 전용 표시한다. 인증 방식은 signup과 동일하게
  커스텀 SMTP 없이 6자리 코드 대신 확인 링크 방식(shared/js/api.js 참조). 인증 시간(5분)을
  넘기면 spec.md 6번 그대로 홈(/user/plans/)으로 이동한다.
*/
import { createElement, Check } from "https://cdn.jsdelivr.net/npm/lucide@latest/+esm";
import { mountAppBar } from "/shared/components/app-bar.js";
import { createInput } from "/shared/components/input.js";
import { createCtaButton } from "/shared/components/cta-button.js";
import { openModal } from "/shared/components/modal.js";
import { showToast } from "/shared/components/toast.js";
import { requireAuth } from "/shared/js/utils.js";
import {
  getProfile,
  sendResignVerification,
  checkResignVerified,
  deleteAccount,
} from "/shared/js/api.js";

const session = await requireAuth();

mountAppBar("#app-bar", { title: "계정 탈퇴" });

const TIMER_SECONDS = 5 * 60;

const profile = await getProfile();
const email = profile?.email ?? session.user.email;

const app = document.querySelector("#app");
app.innerHTML = `
  <div class="resign">
    <p class="resign__desc">모든 데이터가 삭제되며 되돌릴 수 없어요.<br />계속하려면 로그인 이메일 인증이 필요합니다.</p>
    <div class="resign__field" data-field></div>
  </div>
`;

const emailInput = createInput({ type: "email", name: "email" });
emailInput.control.value = email;
emailInput.control.disabled = true;
document.querySelector("[data-field]").appendChild(emailInput.el);

const emailCheck = document.createElement("span");
emailCheck.className = "resign__email-check";
emailCheck.hidden = true;
emailCheck.appendChild(createElement(Check, { size: 18 }));
emailInput.el.appendChild(emailCheck);

let phase = "idle";
let timeLeft = TIMER_SECONDS;
let timerInterval = null;
let timerEl = null;

const cta = createCtaButton({
  label: "이메일 인증",
  disabled: false,
  onClick: handleCtaClick,
});
cta.el.classList.add("resign__cta");
document.querySelector(".resign").appendChild(cta.el);

async function handleCtaClick() {
  if (phase === "idle") {
    cta.setLoading(true);
    const result = await sendResignVerification(email);
    cta.setLoading(false);

    if (!result.ok) {
      showToast(result.message || "인증 메일 전송에 실패했습니다.", "error");
      return;
    }

    phase = "sent";
    revealTimer();
    emailCheck.hidden = false;
    cta.setLabel("계정 탈퇴");
    showToast("인증 메일을 보냈어요. 메일함에서 링크를 확인해 주세요.", "success");
    return;
  }

  cta.setLoading(true);
  const verified = await checkResignVerified();
  cta.setLoading(false);

  if (!verified.ok) {
    showToast("이메일 인증에 실패했습니다.", "error");
    return;
  }

  openModal({
    title: "계정 탈퇴",
    body: "계정 탈퇴를 진행하게 되면 모든 데이터가 삭제되며 되돌릴 수 없습니다.",
    cancelLabel: "취소하기",
    confirmLabel: "계정 탈퇴",
    onConfirm: async () => {
      const result = await deleteAccount();
      if (!result.ok) return result;
      location.href = "/";
    },
  });
}

function revealTimer() {
  const timerWrap = document.createElement("div");
  timerWrap.className = "resign__timer";
  timerWrap.innerHTML = `
    <p class="resign__timer-time" data-timer></p>
    <button class="resign__timer-extend" type="button" data-extend>시간 연장하기</button>
  `;
  document.querySelector(".resign").insertBefore(timerWrap, cta.el);
  timerEl = timerWrap.querySelector("[data-timer]");

  timerWrap.querySelector("[data-extend]").addEventListener("click", async (event) => {
    const extendBtn = event.currentTarget;
    extendBtn.disabled = true;
    const result = await sendResignVerification(email);
    extendBtn.disabled = false;

    if (!result.ok) {
      showToast(result.message || "인증 메일 재전송에 실패했습니다.", "error");
      return;
    }

    timeLeft = TIMER_SECONDS;
    startTimer();
    showToast("인증 메일을 다시 보냈어요.", "success");
  });

  startTimer();
}

function startTimer() {
  clearInterval(timerInterval);
  tickTimer();
  timerInterval = setInterval(tickTimer, 1000);
}

// spec.md "회원 탈퇴" 6번: 인증 시간을 넘기면 홈(spec.md 원문 "/planit"은 오타 — blueprint.md
// §9 29번 참조)으로 이동한다. signup 이메일 인증과 달리 여기선 타임아웃 시 이 화면에 머무르지
// 않고 바로 나간다.
function tickTimer() {
  if (timeLeft <= 0) {
    clearInterval(timerInterval);
    showToast("인증 시간이 만료되어 홈으로 이동합니다.", "error");
    location.href = "/user/plans/";
    return;
  }
  const m = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const s = String(timeLeft % 60).padStart(2, "0");
  timerEl.textContent = `${m} : ${s}`;
  timeLeft--;
}
