/*
  알림 (/user/notification/)
  참조: spec.md "알림", Figma "/notification"(4293:1216)

  - 섹션(오늘/어제)별로 묶어서 표시. 완료된(done) 일정의 알림은 비활성화(회색, 클릭 불가) —
    Figma 실측: 활성 알림은 일정 제목만 주조색(--color-primary)으로 강조하고 나머지는 검정,
    비활성 알림은 시간·문구 전체가 --color-assist 회색.
  - 활성화된 알림 클릭 → /user/plans/ 이동(spec.md).
*/

import { mountAppBar } from "/shared/components/app-bar.js";
import { renderSkeleton } from "/shared/components/skeleton.js";
import { getNotifications } from "/shared/js/api.js";

mountAppBar("#app-bar", { title: "알림" });

const app = document.querySelector("#app");
app.innerHTML = `<div class="notification" data-notification-body></div>`;

renderSkeletonList();
loadNotifications();

/* Figma "알림 - 스켈레톤"(4255:1696): "오늘" 섹션 제목은 고정 문구라 실제 텍스트 그대로
   보여주고("어제" 섹션은 아예 없음), 카드도 여러 장이 아니라 한 장짜리 자리표시자만 둔다. */
function renderSkeletonList() {
  const body = document.querySelector("[data-notification-body]");
  body.innerHTML = `
    <div class="notification__section">
      <p class="notification__section-title">오늘</p>
      <div class="notification__list"></div>
    </div>
  `;

  const card = document.createElement("div");
  card.className = "notification__skeleton-card";
  renderSkeleton(card, { width: "100%", height: 58, radius: "12px" });
  body.querySelector(".notification__list").appendChild(card);
}

async function loadNotifications() {
  const items = await getNotifications();
  renderNotifications(items);
}

function formatTime(time) {
  const [h, m] = time.split(":");
  return `${h}시 ${m}분`;
}

function renderNotifications(items) {
  const body = document.querySelector("[data-notification-body]");
  body.innerHTML = "";

  const sections = ["오늘", "어제"];
  sections.forEach((label) => {
    const sectionItems = items.filter((n) => n.section === label);
    if (sectionItems.length === 0) return;

    const section = document.createElement("div");
    section.className = "notification__section";
    section.innerHTML = `<p class="notification__section-title">${label}</p>`;

    const list = document.createElement("div");
    list.className = "notification__list";

    sectionItems.forEach((item) => {
      const card = document.createElement(item.done ? "div" : "button");
      card.type = item.done ? undefined : "button";
      card.className = "notification__card" + (item.done ? " is-done" : "");
      card.innerHTML = `
        <span class="notification__time">${formatTime(item.time)}</span>
        <span class="notification__message">${
          item.done
            ? `${item.title} 일정이 있습니다. 일정을 확인해 주세요.`
            : `<span class="notification__message-title">${item.title}</span> 일정이 있습니다. 일정을 확인해 주세요.`
        }</span>
      `;
      if (!item.done) {
        card.addEventListener("click", () => {
          location.href = "/user/plans/";
        });
      }
      list.appendChild(card);
    });

    section.appendChild(list);
    body.appendChild(section);
  });
}
