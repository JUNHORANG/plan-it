/*
  토스트 — 공통 UI 컴포넌트
  참조: spec.md 전반 "요청 성공/실패 시 토스트를 띄운다", Figma 재사용 컴포넌트(4132:588) "토스트" 섹션
*/

let hideTimer = null;

export function showToast(message, type = "success", duration = 2400) {
  const root = document.querySelector("#toast-root");
  if (!root) return;

  root.querySelectorAll(".toast").forEach((el) => el.remove());

  const toast = document.createElement("div");
  toast.className = "toast" + (type === "error" ? " toast--error" : "");
  toast.innerHTML = '<span class="toast__dot"></span><span class="toast__text"></span>';
  toast.querySelector(".toast__text").textContent = message;
  root.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("is-visible"));

  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    toast.classList.remove("is-visible");
    setTimeout(() => toast.remove(), 200);
  }, duration);
}
