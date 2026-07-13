/*
  토스트 — 공통 UI 컴포넌트
  참조: spec.md 전반 "요청 성공/실패 시 토스트를 띄운다"
*/

let hideTimer = null;

export function showToast(message, type = "default", duration = 2400) {
  const root = document.querySelector("#toast-root");
  if (!root) return;

  root.querySelectorAll(".toast").forEach((el) => el.remove());

  const toast = document.createElement("div");
  toast.className =
    "toast" + (type === "error" ? " toast--error" : type === "success" ? " toast--success" : "");
  toast.textContent = message;
  root.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("is-visible"));

  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    toast.classList.remove("is-visible");
    setTimeout(() => toast.remove(), 200);
  }, duration);
}
