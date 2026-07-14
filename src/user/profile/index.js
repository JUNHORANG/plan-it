/*
  프로필 (/user/profile/)
  참조: spec.md "프로필", Figma "/profile"(4007:187)

  세팅 리스트 순서(로그아웃 → 행성변경 → 이용약관 → 개인정보처리방침 → 계정탈퇴 → 버전)는
  spec.md 기재 순서를 그대로 따름. Figma 프레임엔 "계정 탈퇴" 행이 숨김(visible:false) 처리돼
  있었지만 spec.md엔 명시된 요구사항이라 포함 — blueprint.md §9 참조.

*/

import { mountHeader } from "/shared/components/header.js";
import { mountNavDrawer } from "/shared/components/nav-drawer.js";
import { renderSkeleton, clearSkeleton } from "/shared/components/skeleton.js";
import { createCtaButton } from "/shared/components/cta-button.js";
import { openModal } from "/shared/components/modal.js";
import {
  openContentDrawer,
  closeContentDrawer,
} from "/shared/components/content-drawer.js";
import { showToast } from "/shared/components/toast.js";
import { getProfile, setPlanet, logout, hasUnreadNotifications } from "/shared/js/api.js";
import { planets } from "/shared/js/data.js";
import { requireAuth } from "/shared/js/utils.js";
import {
  createElement,
  ChevronRight,
} from "https://cdn.jsdelivr.net/npm/lucide@latest/+esm";

await requireAuth();

mountHeader("#header", { hasNotification: await hasUnreadNotifications() });
mountNavDrawer("#nav-drawer");

const SETTINGS = [
  { label: "로그아웃", action: "logout" },
  { label: "행성 변경", action: "planet" },
  { label: "이용 약관", action: "terms" },
  { label: "개인 정보 처리 방침", action: "privacy" },
  { label: "계정 탈퇴", action: "resign" },
];

const app = document.querySelector("#app");
app.innerHTML = `
  <div class="profile">
    <div class="profile__head">
      <span class="profile__avatar-skeleton" data-avatar-skeleton></span>
      <img class="profile__avatar" data-avatar alt="내 행성 캐릭터" style="display: none" />
      <div class="profile__names">
        <p class="profile__nickname" data-nickname></p>
        <p class="profile__email" data-email></p>
      </div>
    </div>
    <div class="profile__stats">
      <div class="profile__stat">
        <img class="profile__stat-icon point" src="/images/point_icon.png" alt="" />
        <span class="profile__stat-label" data-points></span>
      </div>
      <a class="profile__stat" href="/user/store/products/">
        <img class="profile__stat-icon store" src="/images/store_icon.png" alt="" />
        <span class="profile__stat-label">STORE</span>
      </a>
      <a class="profile__stat" href="/user/profile/orders/">
        <img class="profile__stat-icon orders" src="/images/truck.png" alt="" />
        <span class="profile__stat-label">주문 내역</span>
      </a>
    </div>
    <div class="profile__settings" data-settings></div>
  </div>
`;

renderSettings();
loadProfile();

let currentProfile = null;

async function loadProfile() {
  const avatarSkeleton = document.querySelector("[data-avatar-skeleton]");
  const nickname = document.querySelector("[data-nickname]");
  const email = document.querySelector("[data-email]");
  const points = document.querySelector("[data-points]");

  // Figma "프로필 - 스켈레톤"(4095:782, 아바타/닉네임/이메일 4095:784): 어느 행성인지는 서버
  // 응답(profile.planet) 전엔 알 수 없어서(랭킹 "나의 순위"의 user.planet과 달리 여긴 로컬에
  // 없음) <img>에 곧바로 스켈레톤 클래스를 입히지 않는다 — src 없는 <img>는 깨진 이미지 아이콘
  // (엑스박스)으로 보이므로, 별도 자리표시자 span(원형 66x66)을 놓고 실제 <img>는 로드 전까지
  // hidden으로 감춰서 그 문제를 피한다.
  renderSkeleton(avatarSkeleton, { width: 66, height: 66, radius: "50%" });
  renderSkeleton(nickname, { width: 69, height: 17 });
  renderSkeleton(email, { width: 112, height: 17 });
  renderSkeleton(points, { width: 53, height: 17 });

  const profile = await getProfile();
  currentProfile = profile;

  clearSkeleton(nickname);
  clearSkeleton(email);
  clearSkeleton(points);

  nickname.textContent = profile.nickname;
  email.textContent = profile.email;
  points.textContent = `${profile.points} POINT`;
  applyAvatar(profile.planet);
}

function applyAvatar(planetId) {
  const avatar = document.querySelector("[data-avatar]");
  const avatarSkeleton = document.querySelector("[data-avatar-skeleton]");
  const planet = planets.find((p) => p.id === planetId) || planets[0];
  avatar.src = planet.image;
  // hidden 속성/프로퍼티는 여기선 안 먹힌다 — variables.css의 전역 img,svg{display:block}
  // 리셋과 .skeleton{display:block}처럼 author 스타일시트가 display를 선언해두면, 그게
  // (선택자 우선순위와 무관하게) UA 기본값인 [hidden]{display:none}보다 항상 이긴다.
  // 그래서 인라인 style.display로 직접 제어해야 확실히 반영된다.
  avatar.style.display = "";
  avatarSkeleton.style.display = "none";
}

function renderSettings() {
  const root = document.querySelector("[data-settings]");
  root.innerHTML = "";

  SETTINGS.forEach(({ label, action }) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "profile__setting-row";
    row.innerHTML = `<span>${label}</span><span class="profile__setting-chevron" data-chevron></span>`;
    row.addEventListener("click", () => handleSettingAction(action));
    root.appendChild(row);
  });

  const version = document.createElement("div");
  version.className = "profile__setting-row";
  version.innerHTML = `<span>버전</span><span class="profile__setting-value">1.0.0</span>`;
  root.appendChild(version);

  root
    .querySelectorAll("[data-chevron]")
    .forEach((el) => el.appendChild(createElement(ChevronRight, { size: 18 })));
}

function handleSettingAction(action) {
  if (action === "logout") return openLogoutModal();
  if (action === "planet") return openPlanetDrawer();
  if (action === "terms") return openTermsDrawer();
  if (action === "privacy") return openPrivacyDrawer();
  if (action === "resign") return void (location.href = "/user/auth/resign/");
}

function openLogoutModal() {
  openModal({
    title: "로그아웃",
    body: "로그아웃 하시겠습니까?",
    confirmLabel: "로그아웃",
    onConfirm: async () => {
      await logout();
      location.href = "/";
    },
  });
}

// Figma "프로필 - 행성 변경 - 드로워"(4084:669, 잠금 상태 4084:785, 타블렛 4149:1612) 반영.
// 12종 행성 그리드 — 컬렉션 조건은 아직 없어서(사용자 요청으로 UI만 먼저 구현) "현재 장착
// 중인 행성"만 보유로 간주하고 나머지는 전부 잠금(회색 원 + 감은 눈) 상태로 표시한다.
// 조건이 추가되면 collected 판정만 실제 보유 목록 조회로 바꾸면 되도록 분리해 둠.
function openPlanetDrawer() {
  const current = currentProfile?.planet || planets[0].id;
  let selected = current;
  let cta;

  openContentDrawer({
    title: "행성 변경",
    render(body) {
      body.innerHTML = `<div class="planet-picker" data-grid></div>`;
      const grid = body.querySelector("[data-grid]");

      planets.forEach((planet) => {
        const collected = planet.id === current;

        const item = document.createElement("button");
        item.type = "button";
        item.className = "planet-picker__item" + (collected ? "" : " is-locked");
        item.disabled = !collected;
        item.innerHTML = `
          <span class="planet-picker__image-wrap">
            ${
              collected
                ? `<img class="planet-picker__image" src="${planet.image}" alt="${planet.name}" />`
                : `<span class="planet-picker__placeholder" aria-hidden="true">
                     <span class="planet-picker__eye"></span>
                     <span class="planet-picker__eye"></span>
                   </span>`
            }
          </span>
          <span class="planet-picker__name${planet.id === selected ? " is-picked" : ""}">${planet.name}</span>
        `;

        if (collected) {
          item.addEventListener("click", () => {
            selected = planet.id;
            grid
              .querySelectorAll(".planet-picker__name")
              .forEach((el) => el.classList.remove("is-picked"));
            item.querySelector(".planet-picker__name").classList.add("is-picked");
            cta.setDisabled(selected === current);
          });
        }

        grid.appendChild(item);
      });
    },
    renderFooter(footer) {
      cta = createCtaButton({
        label: "행성 변경",
        disabled: true, // 기본값 = 현재 장착 행성 그대로라 비활성(Figma 타블렛 "비활성화" 상태 그대로)
        onClick: async () => {
          cta.setLoading(true);
          await setPlanet(selected);
          cta.setLoading(false);
          currentProfile.planet = selected;
          applyAvatar(selected);
          closeContentDrawer();
          showToast("행성을 변경했습니다.");
        },
      });
      cta.el.classList.add("planet-picker__cta");
      footer.appendChild(cta.el);
    },
  });
}

function openTermsDrawer() {
  openContentDrawer({
    title: "이용 약관",
    render(body) {
      body.innerHTML = `<p class="legal-text">${TERMS_TEXT}</p>`;
    },
  });
}

function openPrivacyDrawer() {
  openContentDrawer({
    title: "개인 정보 처리 방침",
    render(body) {
      body.innerHTML = `<p class="legal-text">${PRIVACY_TEXT}</p>`;
    },
  });
}

// 정의서에 실제 약관/방침 문구가 없어 자리표시자로 작성 — 실제 문구 확정 시 교체 필요 (blueprint.md §9 참조)
const TERMS_TEXT = `제1조(목적)
이 약관은 Plan It(이하 "서비스")의 이용조건 및 절차에 관한 사항을 규정함을 목적으로 합니다.

제2조(서비스의 제공)
서비스는 일정 관리, 포인트 적립, 상점 이용 등의 기능을 제공합니다.

제3조(이용자의 의무)
이용자는 서비스 이용 시 관계 법령과 이 약관을 준수해야 합니다.`;

const PRIVACY_TEXT = `1. 수집하는 개인정보 항목
서비스는 이메일, 닉네임을 수집합니다.

2. 개인정보의 수집 및 이용목적
회원 식별, 서비스 제공 및 부정 이용 방지를 위해 이용합니다.

3. 개인정보의 보유 및 이용기간
회원 탈퇴 시까지 보관하며, 탈퇴 즉시 파기합니다.`;
