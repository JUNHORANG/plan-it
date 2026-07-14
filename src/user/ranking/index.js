/*
  랭킹 (/user/ranking/)
  참조: spec.md "랭킹", Figma "/ranking"(4259:1235) · 랭킹 리스트 타블렛(4319:1165)

  - "나의 순위"는 화면 상단에 별도 섹션(공유하기 포함)으로 분리, 전체 순위 목록은 그 아래
    스크롤 목록에 다시 한 번 노출된다(자기 자신 행은 순위 번호·포인트를 강조색으로 표시).
  - 1~3등은 순위 숫자 대신 왕관 이미지(crown1/2/3.png), 포인트는 주조색(초록). 4등 이하는
    순위 숫자 검정(내 순위면 강조색), 포인트는 회색(내 순위면 강조색).
  - 공유하기: Web Share API 지원 시 공유 시트, 미지원이면 링크를 클립보드에 복사 + 토스트
    (spec.md "공유하기 CTA 버튼을 눌러 나의 등수를 다른 사람에게 공유할 수 있다(오픈그래프)").
*/

import { mountHeader } from "/shared/components/header.js";
import { mountNavDrawer } from "/shared/components/nav-drawer.js";
import { renderSkeleton } from "/shared/components/skeleton.js";
import { showToast } from "/shared/components/toast.js";
import { getRanking, getProfile, hasUnreadNotifications } from "/shared/js/api.js";
import { planets } from "/shared/js/data.js";
import { requireAuth } from "/shared/js/utils.js";

await requireAuth();

const myProfile = await getProfile();

mountHeader("#header", { hasNotification: await hasUnreadNotifications() });
mountNavDrawer("#nav-drawer");

const app = document.querySelector("#app");
const now = new Date();

app.innerHTML = `
  <div class="ranking">
    <div class="ranking__meta">
      <p class="ranking__participants" data-ranking-participants></p>
      <h1 class="ranking__title">${now.getMonth() + 1}월 랭킹</h1>
    </div>
    <div data-ranking-me></div>
    <div class="ranking__list" data-ranking-list></div>
  </div>
`;

renderMeSkeleton();
renderListSkeleton();
loadRanking();

function planetImage(planetId) {
  return (planets.find((p) => p.id === planetId) || planets[0]).image;
}

/* Figma "랭킹 - 스켈레톤"(4259:1342): 순위/닉네임/포인트는 서버 응답(등수 계산)을 기다려야
   해서 스켈레톤이지만, 아바타는 로그인한 내 행성(user.planet, 로컬에 이미 있는 값)이라
   기다릴 필요 없이 바로 실제 이미지로 보여준다. 공유하기 칩도 자리만 미리 잡아두고(비활성
   텍스트), 데이터가 오면 renderMe()가 전체를 실제 버튼으로 교체한다. */
function renderMeSkeleton() {
  const el = document.querySelector("[data-ranking-me]");
  el.innerHTML = `
    <div class="ranking-me">
      <span class="ranking-me__rank"></span>
      <img class="ranking-me__avatar" src="${planetImage(myProfile?.planet)}" alt="" />
      <span class="ranking-me__info">
        <span class="ranking-me__name"></span>
        <span class="ranking-me__points"></span>
      </span>
      <span class="ranking-me__share">공유하기</span>
    </div>
  `;
  renderSkeleton(el.querySelector(".ranking-me__rank"), { width: 14, height: 16 });
  renderSkeleton(el.querySelector(".ranking-me__name"), { width: 80, height: 20 });
  renderSkeleton(el.querySelector(".ranking-me__points"), { width: 80, height: 16 });
}

/* 랭킹 리스트도 캘린더 바텀시트 스켈레톤과 동일하게, 항목 개수만큼 반복하지 않고
   한 줄짜리 자리표시자 하나만 보여준다(Figma 4259:1342 실측). */
function renderListSkeleton() {
  const list = document.querySelector("[data-ranking-list]");
  list.innerHTML = "";
  const row = document.createElement("div");
  list.appendChild(row);
  renderSkeleton(row, { width: "100%", height: 60, radius: "10px" });
}

async function loadRanking() {
  const { meta, list } = await getRanking();
  document.querySelector("[data-ranking-participants]").textContent = `총 ${meta.participants}명 참여 중`;
  renderMe(list);
  renderList(list);
}

function renderMe(list) {
  const me = list.find((r) => r.isMe);
  const el = document.querySelector("[data-ranking-me]");
  if (!me) {
    el.innerHTML = "";
    return;
  }

  el.innerHTML = `
    <div class="ranking-me">
      <span class="ranking-me__rank">${me.rank}</span>
      <img class="ranking-me__avatar" src="${planetImage(me.planet)}" alt="" />
      <span class="ranking-me__info">
        <span class="ranking-me__name">${me.nickname}</span>
        <span class="ranking-me__points">${me.points} 포인트</span>
      </span>
      <button class="ranking-me__share" type="button" data-share>공유하기</button>
    </div>
  `;

  el.querySelector("[data-share]").addEventListener("click", () => shareRank(me));
}

function renderList(list) {
  const listEl = document.querySelector("[data-ranking-list]");
  listEl.innerHTML = "";

  const crownImages = { 1: "/images/crown1.png", 2: "/images/crown2.png", 3: "/images/crown3.png" };

  list.forEach((entry) => {
    const row = document.createElement("div");
    row.className = "ranking-row" + (entry.isMe ? " is-me" : "");

    const badge = crownImages[entry.rank]
      ? `<img class="ranking-row__crown" src="${crownImages[entry.rank]}" alt="${entry.rank}등" />`
      : `<span class="ranking-row__rank">${entry.rank}</span>`;

    const pointsClass = entry.isMe ? "is-me" : entry.rank <= 3 ? "is-top" : "";

    row.innerHTML = `
      <span class="ranking-row__badge">${badge}</span>
      <img class="ranking-row__avatar" src="${planetImage(entry.planet)}" alt="" />
      <span class="ranking-row__info">
        <span class="ranking-row__name">${entry.nickname}</span>
        <span class="ranking-row__points ${pointsClass}">${entry.points} 포인트</span>
      </span>
    `;

    listEl.appendChild(row);
  });
}

async function shareRank(me) {
  const shareData = {
    title: "Plan It · 랭킹",
    text: `Plan It에서 ${me.rank}등! (${me.points} 포인트)`,
    url: location.href,
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch {
      // 사용자가 공유를 취소한 경우 — 별도 처리 없음
    }
    return;
  }

  try {
    await navigator.clipboard.writeText(shareData.url);
    showToast("링크를 복사했습니다.");
  } catch {
    showToast("공유에 실패 했습니다.", "error");
  }
}
