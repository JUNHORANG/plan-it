/*
  계정 탈퇴 (/user/resign/)
  참조: spec.md "회원 탈퇴", Figma 계정 탈퇴(4589:1159) — Figma API rate limit(429)로 세부
  실측을 못 받아와 spec.md 문구 + signup 이메일 인증 스텝(blueprint.md §9 23번)과 동일한
  컴포넌트/흐름을 재사용해 우선 구현했다. 나중에 Figma 확인되면 세부 스타일만 맞추면 됨
  — §9 29번 참조.

  이미 로그인된 계정의 이메일로만 진행되므로(새로 이메일을 입력받지 않음) 이메일 입력창은
  값을 채운 채 비활성화(disabled) 상태로 읽기 전용 표시한다. 인증 방식은 signup과 동일하게
  커스텀 SMTP 없이 6자리 코드 대신 확인 링크 방식(shared/js/api.js 참조). 인증 시간(5분)을
  넘기면 spec.md 6번 그대로 홈(/user/plans/)으로 이동한다.
*/
import { mountHeader } from "/shared/components/header.js";
import { mountNavDrawer } from "/shared/components/nav-drawer.js";
import { createInput } from "/shared/components/input.js";
import { createCtaButton } from "/shared/components/cta-button.js";
import { showToast } from "/shared/components/toast.js";
import { requireAuth } from "/shared/js/utils.js";
import {
  getProfile,
  hasUnreadNotifications,
  sendResignVerification,
  checkResignVerified,
  deleteAccount,
} from "/shared/js/api.js";

const session = await requireAuth();

mountHeader("#header", { hasNotification: await hasUnreadNotifications() });
mountNavDrawer("#nav-drawer");

const TIMER_SECONDS = 5 * 60;

const profile = await getProfile();
const email = profile?.email ?? session.user.email;

const app = document.querySelector("#app");
app.innerHTML = `
  <div class="resign">
    <h1 class="resign__title">계정 탈퇴</h1>
    <p class="resign__desc">계정을 탈퇴하면 모든 데이터가 삭제되며 되돌릴 수 없어요. 계속하려면 로그인 이메일 인증이 필요합니다.</p>
    <div class="resign__field" data-field></div>
  </div>
`;

const emailInput = createInput({ type: "email", name: "email" });
emailInput.control.value = email;
emailInput.control.disabled = true;
document.querySelector("[data-field]").appendChild(emailInput.el);

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
    cta.setLabel("탈퇴하기");
    showToast("인증 메일을 보냈어요. 메일함에서 링크를 확인해 주세요.", "success");
    return;
  }

  cta.setLoading(true);
  const verified = await checkResignVerified();
  if (!verified.ok) {
    cta.setLoading(false);
    showToast("이메일 인증에 실패했습니다.", "error");
    return;
  }

  const result = await deleteAccount();
  cta.setLoading(false);

  if (!result.ok) {
    showToast(result.message || "탈퇴 요청에 실패했습니다.", "error");
    return;
  }

  location.href = "/";
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
