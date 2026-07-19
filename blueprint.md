# Plan It — 프로젝트 블루프린트 (Vanilla JS · HTML MPA)

> Todo 기반 일정 관리 + 게이미피케이션(포인트·수집·랭킹) + 친환경 경험
> **Vanilla HTML / CSS / JS · MPA(멀티 페이지) · 완전 코로케이션 · 모바일 퍼스트(최소 360×640)**

---

## 0. MPA 아키텍처 (이 프로젝트의 전제)

- **각 `.html`은 독립 문서.** 브라우저가 페이지를 통째로 새로 로드한다. SPA 라우터·가상 DOM 없음.
- **페이지 이동** = 실제 문서 이동: `<a href="...">` 또는 `location.href = '...'`.
- **페이지 간 상태 공유**는 `localStorage` / `sessionStorage`로 처리한다.
  - 로그인 토큰/유저, 온보딩 완료 플래그, 주소지 저장, (필요 시) 임시 폼 값 등.
- **동적 경로는 쿼리스트링으로 처리** (정적 MPA는 path param 불가):
  - 구매: `/user/products/order/?id=123`
  - 구매 완료: `/user/order/success/?orderId=abc12345`
  - 일정 수정: `/user/plans/edit?planId=45`
- **`src/` vs `public/` 분리.** `src/`는 소스(html·css·js — `index.*`, `signup/`, `user/`, `admin/`, `shared/`, `404/`, `timeout/` 등), `public/`는 순수 정적 자산(`fonts/`, `images/`)만 둔다. 둘은 프로젝트 루트에서 형제 폴더다.
- **공통 자원은 루트 절대경로(`/shared/...`, `/fonts/...`, `/images/...`)로 참조**한다. 폴더가 3단계까지 깊어져 상대경로(`../../../`)가 지저분해지므로, `src/`와 `public/`를 **하나의 서버 루트로 합쳐서 서빙**하는 것을 전제로 한다 (요청 경로를 `src/`에서 먼저 찾고 없으면 `public/`로 폴백).
- **정적 서버 필수.** ES module `import`와 `fetch`는 `file://`에서 동작하지 않는다. 단, 위 병합 서빙이 필요해 범용 정적 서버(Live Server 등 단일 루트 지정 도구)로는 부족하다.
  - **`npm run dev`** — `scripts/dev-server.js`(빌드 없는 순수 Node, 의존성 0개)가 `src/`+`public/`를 병합해 `http://localhost:3000`으로 서빙한다. `PORT` 환경변수로 포트 변경 가능.
- **컴포넌트 로딩** = ES 모듈. 각 페이지 `.js`를 `<script type="module">`로 불러오고, 그 안에서 필요한 공통 컴포넌트만 `import` 후 mount 한다.
- **인증 가드**: `/user/**`, `/admin/**` 페이지는 로드 시 `localStorage` 토큰을 확인하고, 없으면 `/`(로그인)로 리다이렉트하는 가드 유틸을 호출한다.
- **에러 페이지**: `404`는 정적 서버가 미매칭 경로에 `404/index.html`을 응답하도록 설정한다. `timeout`은 요청 타임아웃/실패 시 JS에서 `/timeout/`으로 이동시킨다.

### 페이지 표준 보일러플레이트 (모든 HTML 공통 골격)

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Plan It · 홈</title>
  <link rel="stylesheet" href="/shared/css/variables.css" />
  <link rel="stylesheet" href="/shared/css/layout.css" />
  <link rel="stylesheet" href="/user/plans/index.css" />   <!-- 페이지 전용 CSS -->
</head>
<body>
  <div id="header"></div>          <!-- 공통 헤더 mount 지점 (앱바 페이지는 #app-bar) -->
  <div id="nav-drawer"></div>      <!-- 공통 나브 드로워 mount 지점 -->
  <main id="app"><!-- 페이지 콘텐츠 --></main>
  <div id="toast-root"></div>      <!-- 토스트 mount 지점 -->
  <div id="overlay-root"></div>    <!-- 바텀시트/모달/드로워 mount 지점 -->
  <div id="desktop-qr" aria-hidden="true"></div> <!-- 데스크탑(4159:806) QR 자리, 비워둠 -->
  <script type="module" src="/user/plans/index.js"></script>  <!-- 페이지 전용 JS -->
</body>
</html>
```

> **좌우 여백은 `#app`(layout.css)이 전역으로 준다.** 페이지별 CSS에서 콘텐츠 컨테이너에 또
> `padding: 0 16px` 같은 걸 넣지 않는다(2중 패딩 방지). 페이지 전용 CSS는 세로 여백만 잡는다.

> **데스크탑(600px 초과) 배경/그림자**: `body`는 항상 600px 카드로 고정되고, 그 바깥 캔버스는
> `html { background-color: var(--color-page-bg) }`(변수는 variables.css), 카드 그림자는
> `#overlay-root`의 `box-shadow`(레이아웃 전역, layout.css)로 표현한다 — 페이지별로 반복 구현하지 않는다.

### 페이지 JS 진입 패턴 (예: 홈)

```js
// /user/plans/index.js
import { requireAuth } from '/shared/js/utils.js';
import { mountHeader } from '/shared/components/header.js';
import { mountNavDrawer } from '/shared/components/nav-drawer.js';

requireAuth();                 // 토큰 없으면 '/'로 리다이렉트
mountHeader('#header');        // 공통 헤더 렌더
mountNavDrawer('#nav-drawer'); // 공통 GNB 렌더

// ↓ 이 페이지 고유 로직 (일정 목록 렌더, 날짜 선택, 바텀시트 등)
```

> **컴포넌트 규약**: 모든 공통 컴포넌트는 `mountX(selector, props?)` 형태의 render 함수로 export 한다.
> 오버레이(바텀시트/모달/드로워)는 `openBottomSheet(opts)`처럼 호출형으로 export 한다.
> (모듈이 부담이면 대안: `<script src>`로 전역 `window.PlanIt.*` 노출 방식도 가능. 단 권장은 ES 모듈.)

---

## 1. 설계 원칙

- **HTML과 동일 디렉토리에 css, js를 평탄하게 배치** (별도 하위 폴더 없음)
- **파일명은 HTML 파일명과 매칭** (`index.html` → `index.css`, `index.js`)
- **도메인(라우트) = 폴더 경로**를 그대로 반영
- **단일 페이지 도메인은 `index.*`**, 같은 도메인 하위 액션은 동사명으로 콜로케이션 (`add`, `edit`, `success`)
- 공통 UI 컴포넌트/전역 자원만 `shared/`로 분리 (루트 절대경로로 참조)
- **고객(`user/`) / 관리자(`admin/`)** 역할별 최상위 분리
- 반응형: 모바일 최소 **360×640**, 타블렛 최소 높이 **600**

---

## 2. 라우팅 맵 (URL → 파일 → 파라미터)

### 고객 (User)
| URL | 화면 | 진입 파일 | 헤더 | 파라미터 |
|---|---|---|---|---|
| `/` | 로그인 | `index.html` | — | |
| `/signup/` | 회원가입 (3-step) | `signup/index.html` | 앱바 | |
| `/signup/verified` | 이메일 인증 완료 랜딩 (헤더 없음) | `signup/verified.html` | — | Supabase 확인 링크 리다이렉트 전용, `/signup/` 탭과 별개로 새 탭에서 열림 |
| `/user/plans/` | 홈 | `user/plans/index.html` | 헤더 | `?date=` (선택) |
| `/user/plans/add` | 일정 추가 | `user/plans/add.html` | 앱바 | |
| `/user/plans/edit` | 일정 수정 | `user/plans/edit.html` | 앱바 | `?planId=` |
| `/user/plans/success` | 일정 완료 ※ | `user/plans/success.html` | 앱바 | `?points=` |
| `/user/calendar/` | 캘린더 | `user/calendar/index.html` | 헤더 | |
| `/user/ranking/` | 랭킹 | `user/ranking/index.html` | 헤더 | |
| `/user/notification/` | 알림 | `user/notification/index.html` | 앱바 | |
| `/user/profile/` | 프로필 | `user/profile/index.html` | 헤더 | |
| `/user/store/` | 상점 목록 | `user/store/index.html` | 헤더 | |
| `/user/store/buy` | 구매 | `user/store/buy.html` | 앱바 | `?id=` (제품) |
| `/user/store/success` | 구매 완료 | `user/store/success.html` | 앱바 | `?orderId=` |
| `/user/store/history` | 주문 내역 ※ | `user/store/history.html` | 헤더 | |
| `/user/resign/` | 회원 탈퇴 | `user/resign/index.html` | 헤더 | |
| `/user/resign/verified` | 탈퇴 인증 완료 랜딩 (헤더 없음) | `user/resign/verified.html` | — | Supabase 확인 링크 리다이렉트 전용, `/user/resign/` 탭과 별개로 새 탭에서 열림 |
| `/timeout/` | 네트워크 지연 | `timeout/index.html` | 앱바 | |
| (미매칭) | 404 | `404/index.html` | 앱바 | |

### 관리자 (Admin)
| URL | 화면 | 진입 파일 | 파라미터 |
|---|---|---|---|
| `/admin/orders/` | 주문 관리 | `admin/orders/index.html` | |
| `/admin/products/` | 상점 관리 (제품 CRUD) | `admin/products/index.html` | |

### 드로워 (독립 URL 아님 · 프로필에서 호출되는 오버레이 컴포넌트)
- 행성 변경 / 이용 약관 / 개인 정보 처리 방침

> ※ 정의서 내 표기 불일치 항목 → 아래 **9. 확인 필요 항목** 참조
> ※ `store`/`resign` 경로는 **10. 폴더 구조 재정리** 결과로 반영된 신규 경로다 (구 경로: `/user/store/products/`, `/user/products/order/`, `/user/order/success/`, `/user/profile/orders/`, `/user/auth/resign/`). 실제 파일 이동은 아직 실행 전이며, 승인 후 §10 체크리스트대로 진행한다.

---

## 3. 폴더 구조

```
plan-it/
├── scripts/
│   └── dev-server.js                   # src/+public/ 병합 서빙 (npm run dev)
│
├── public/                             # 순수 정적 자산만 (소스 코드 없음)
│   ├── 🔤 fonts/                        # 루트 절대경로 /fonts/... 로 참조
│   │   ├── Pretendard-*.woff2           # Thin~Black 9종 (본문 기본 폰트)
│   │   └── GmarketSans*.otf             # Light/Medium/Bold (로고·브랜드 텍스트 전용)
│   └── 🖼️ images/                       # 루트 절대경로 /images/... 로 참조
│
└── src/                                 # 소스 코드 (html · css · js)
    │
    ├── index.html                        # 로그인 (/)
    ├── index.css
    ├── index.js
    │
    ├── 👤 회원가입
    │   └── signup/
    │       ├── index.html                # 회원가입 3-step (/signup/)
    │       ├── index.css
    │       ├── index.js
    │       ├── verified.html              # 이메일 인증 완료 랜딩 (/signup/verified, 스테퍼 없음)
    │       ├── verified.css
    │       └── verified.js
    │
    ├── 👤 고객
    │   └── user/
    │       │
    │       ├── plans/                     # 홈 & 일정
    │       │   ├── index.html             # 홈 (/user/plans/)
    │       │   ├── index.css
    │       │   ├── index.js
    │       │   ├── add.html               # 일정 추가 (/user/plans/add)
    │       │   ├── add.css
    │       │   ├── add.js
    │       │   ├── edit.html              # 일정 수정 (?planId=)
    │       │   ├── edit.css
    │       │   ├── edit.js
    │       │   ├── success.html           # 일정 완료 (?points=)
    │       │   ├── success.css
    │       │   └── success.js
    │       │
    │       ├── calendar/                  # 캘린더 (/user/calendar/)
    │       │   ├── index.html · index.css · index.js
    │       │
    │       ├── ranking/                   # 랭킹 (/user/ranking/)
    │       │   ├── index.html · index.css · index.js
    │       │
    │       ├── notification/              # 알림 (/user/notification/)
    │       │   ├── index.html · index.css · index.js
    │       │
    │       ├── profile/                   # 프로필 (/user/profile/) — orders 하위 폴더 없음(→ store/history로 이동, §10)
    │       │   ├── index.html · index.css · index.js
    │       │
    │       ├── store/                     # 🆕 상점 시스템 — 목록·구매·완료·내역 통합 (§10, 구 store/products + products/order + order/success + profile/orders)
    │       │   ├── index.html · index.css · index.js      # 상점 목록 (/user/store/)
    │       │   ├── buy.html · buy.css · buy.js             # 구매 (/user/store/buy?id=)
    │       │   ├── success.html · success.css · success.js # 구매 완료 (/user/store/success?orderId=)
    │       │   └── history.html · history.css · history.js # 주문 내역 (/user/store/history)
    │       │
    │       └── resign/                    # 🆕 회원 탈퇴 (§10, 구 auth/resign — auth/ 래퍼 제거)
    │           ├── index.html · index.css · index.js
    │           └── verified.html · verified.css · verified.js  # 탈퇴 인증 완료 랜딩 (/user/resign/verified)
    │
    ├── 🔴 관리자
    │   └── admin/
    │       ├── orders/                    # 주문 관리 (/admin/orders/)
    │       │   ├── index.html · index.css · index.js
    │       └── products/                  # 상점 관리 (/admin/products/)
    │           ├── index.html · index.css · index.js
    │
    ├── ⚠️ 에러 페이지
    │   ├── 404/     → index.html · index.css · index.js
    │   └── timeout/ → index.html · index.css · index.js
    │
    └── 📦 공유 자원 (루트 절대경로 /shared/... 로 참조)
        └── shared/
            ├── css/
            │   ├── variables.css          # 전역 변수, 리셋, @font-face
            │   └── layout.css             # 헤더/앱바/하단 공통 레이아웃
            │
            ├── js/
            │   ├── data.js                # 남은 목데이터: planets(표시용 카탈로그) · ranking/rankingMeta
            │   ├── api.js                 # Supabase 연동 계층 (일정/유저/상점/주문/알림/관리자 — §8 데이터 모델)
            │   ├── supabase-client.js     # Supabase 클라이언트 인스턴스
            │   └── utils.js               # 날짜·시간·포인트 포맷, storage, requireAuth, 쿼리파싱, 라우팅
            │
            └── components/                # 공통 UI 컴포넌트 (ES 모듈, mountX / openX)
                ├── header.js / header.css
                ├── app-bar.js / app-bar.css
                ├── nav-drawer.js / nav-drawer.css
                ├── bottom-sheet.js / bottom-sheet.css
                ├── purchase-sheet.js / purchase-sheet.css
                ├── modal.js / modal.css
                ├── content-drawer.js / content-drawer.css
                ├── input.js / input.css
                ├── cta-button.js / cta-button.css
                ├── toast.js / toast.css
                ├── skeleton.js / skeleton.css
                ├── stepper.js / stepper.css
                ├── wheel-picker.js / wheel-picker.css
                ├── admin-header.js / admin-header.css   # 관리자 상단 네비(로고+주문/상점관리+로그아웃)
                └── admin-layout.css                     # 관리자 페이지 전용 데스크탑 레이아웃 오버라이드
```

---

## 4. 공통 UI 컴포넌트 명세 (MPA 로딩 방식 포함)

각 페이지는 필요한 컴포넌트만 `import` 해서 mount 한다. 페이지가 리로드될 때마다 재초기화되는 것이 정상.

| 컴포넌트 | export(예시) | 핵심 동작 |
|---|---|---|
| **header** | `mountHeader('#header')` | 로고→`/user/plans/` · 종→`/user/notification/`(새 알림 시 빨간 뱃지) · 햄버거→나브 열기 |
| **app-bar** | `mountAppBar('#header', {title})` | 뒤로가기 → `history.back()` 또는 지정 도메인 |
| **nav-drawer** | `mountNavDrawer('#nav-drawer')` | 홈/캘린더/스토어/랭킹/프로필/알림 이동 · X로 닫기 |
| **bottom-sheet** | `openBottomSheet(opts)` | X·외부영역 닫힘 / 아래→위 애니메이션 / 항목 강조 / 기본값 없으면 CTA 비활성 / 요청중 스피너 / 성공→닫고 토스트, 실패→유지+토스트 / 핸들 높이 조절 / 열려있는 동안 배경 스크롤 잠금(`shared/js/utils.js`의 `lockScroll`/`unlockScroll`) |
| **purchase-sheet** | `openPurchaseSheet({name, remaining, submitLabel, onConfirm, backdrop, onClose})` | 제목/X 없는 전용 구매 확인 시트(4278:893). `backdrop:false`로 배경 딤 제거 가능(구매 페이지), `onClose`로 트리거 상태 복원, 열려있는 동안 배경 스크롤 잠금(bottom-sheet와 동일한 `lockScroll`/`unlockScroll`) |
| **modal** | `openModal(opts)` | X·취소·외부영역 닫힘 / 실패 시 에러 토스트 |
| **content-drawer** | `openContentDrawer({title, render})` | 앱바 톤 헤더(뒤로가기+제목) + 임의 콘텐츠, 오른쪽에서 슬라이드 (행성변경/약관/개인정보) |
| **input** | `createInput(opts)` | 안내문구 / 포커스 강조 / blur 유효성 / 검증성공 색상 / 실패 시 테두리 2px+순빨강(`--color-input-error`)로 굵어짐(기본·검증은 1px)+오류문구 — Figma "입력창 - 공통 UI" 상태(4554:1722) 실측 |
| **cta-button** | `createCtaButton(opts)` | 기본 비활성→조건 충족 시 활성 / 요청중 스피너 / 성공·실패 토스트 |
| **toast** | `showToast(msg, type)` | `#toast-root`에 성공/실패 토스트 |
| **skeleton** | `renderSkeleton(el, variant)` | 첫 진입 로딩 영역 |
| **wheel-picker** | `openWheelPicker(opts)` | 시(00~23)·분(00~59) / 연·월·일(월별 일수 반영) |
| **stepper** | `mountStepper(el, {step, total, from})` | 회원가입 3단계 표시, 현재 스텝까지 주조색 바 채움(`from` 이전 구간은 애니메이션 없이 즉시 채움) |

---

## 5. 상태 관리 (localStorage 키 규약)

MPA라 메모리 상태가 페이지마다 초기화되므로, 아래 키로 공유한다.

> **갱신 이력**: 이 표는 Supabase 연동 전(localStorage 통합 상태 관리, §9 25번) 기준 문서였다. 현재는 유저(닉네임/이메일/포인트/행성/주소)·일정·상품·주문·알림이 모두 Supabase 테이블(`profiles`/`plans`/`products`/`orders`/`notifications`, RLS로 계정별 격리)에서 직접 관리되고, `shared/js/state.js`와 `planit.state` 키는 삭제됐다. localStorage에는 아래 두 키만 남는다.

| 키 | 용도 |
|---|---|
| `planit.onboarded` | 홈 최초 진입 온보딩 노출 여부 |

> `planit.auth`는 별도 키로 쓰지 않는다 — Supabase Auth(`supabase.auth`)가 세션을 자체 관리하고, `shared/js/utils.js`의 `requireAuth()`가 세션 유무로 가드한다.
> `planit.address`는 더 이상 쓰지 않는다 — `profiles.address`/`profiles.address_detail` 컬럼으로 이전(§10-1 참조). 다른 브라우저/기기에서 재로그인해도 주소가 유지되고, 같은 브라우저를 여러 계정이 공유해도 계정 간에 섞이지 않는다.

---

## 6. 작업 TODO (빌드 순서)

### 1단계: 공유 자원 · 환경
- [x] 정적 서버 실행 확인 — `npm run dev` (`scripts/dev-server.js`, src/+public/ 병합 서빙, 기본 포트 3000)
- [x] `shared/css/variables.css` — 전역 변수, 리셋 (Figma 폰트 시스템 4111:853 기준 컬러·타이포 토큰 반영)
- [x] `shared/css/layout.css` — 헤더/앱바/레이아웃 공통 (mount point 셸 배치만, 컴포넌트별 스타일은 shared/components/*.css)
- [x] `shared/js/utils.js` — `toISODate`, `getWeekDates`, `formatFullDateLabel`, `storage` 래퍼 구현. `requireAuth`/`getQuery`/`navigate`는 아직 (인증 가드 붙일 때 추가)
- [x] `shared/js/data.js` — 목 일정/유저/랭킹/알림/관리자주문 데이터 (오늘/내일 날짜 기준 동적 생성). `user`/`plans`는 `state.js`의 시드 소스로만 쓰이고, 예전에 있던 `products`/`orders`는 `plants.js`+`state.js`로 이전되며 삭제됨 — §9 25번 참조
- [x] `shared/js/plants.js` (신규) — 식물 카탈로그 20종(`pl1~pl20`), `tree1~3.png` 순환 재사용, 가격 2,000~15,000 분산(포인트 부족 시나리오가 자연히 나오도록)
- [x] `shared/js/state.js` (신규) — localStorage 단일 키 `planit.state`(user/plans/products/orders 통합)의 유일한 소유자. `getState()`/`updateState(mutatorFn)`/`resetState()` 3개만 노출, 내부적으로 `utils.js`의 `storage` 래퍼 재사용. MPA라 페이지 이동마다 모듈이 재실행되며 메모리 상태가 날아가던 문제(포인트 차감·일정 완료 등 어떤 변경도 유지 안 됨)를 해결 — §5, §9 25번 참조
- [x] `shared/js/api.js` — `getPlansByDate`(고정 항목 상단 정렬, 고정 2개 이상이면 그 안에서도 시간 오름차순), `setPlanDone`(id, done — 체크 시 로컬 낙관적 업데이트와 값이 어긋나지 않도록 내부에서 toggle 하지 않고 호출측이 정한 값을 그대로 저장), `pinPlan`(다중 고정 허용), `deletePlan` (지연 시뮬레이션만, 실패·`/timeout/` 이동 케이스는 아직). user/plans/products/orders 관련 함수는 전부 `state.js`를 거쳐 읽고 쓰도록 교체됨(§9 25번). `awardPoints(points)`(일정 완료 보상 실제 반영), `resetDemoState()`(데모 초기화, 아직 UI 트리거는 없음) 추가

### 2단계: 공통 UI 컴포넌트 (ES 모듈)
- [x] `header` — 로고·종(알림 뱃지)·햄버거, 재사용 컴포넌트(4132:588) "헤더" 섹션 기준. 햄버거 클릭 시 `nav-drawer.js`의 `openNavDrawer()` 호출로 연동 (`shared/components/header.css`, `.js`)
- [x] `app-bar` — 뒤로가기(44px 터치영역)+제목, 모바일 60px/타블렛 68px 높이 (`shared/components/app-bar.css`, `.js`)
- [x] `nav-drawer` — Figma 나브 모바일(4007:333)/타블렛(4146:1022) 기준 1차 구현 (`shared/components/nav-drawer.css`, `.js`)
- [x] `bottom-sheet` — Figma "일정 - 바텀 시트"(4006:323) 기준. 범용 셸(`openBottomSheet`) + 목록형 헬퍼(`openListBottomSheet`, 고정/수정/삭제 등 재사용) 구현. 배경 블러(6px)+딤, 아래→위 슬라이드, X/배경 클릭 닫힘, CTA 로딩→성공 시 닫힘+토스트/실패 시 유지+토스트 (`shared/components/bottom-sheet.css`, `.js`)
- [x] `modal` — Figma 재사용 컴포넌트(4132:588) "모달"(4132:650) 기준: 흰 카드(radius 10, `box-shadow: 0 0 1px rgba(0,0,0,.25)`) + 제목/본문 + 취소·확인 텍스트 버튼(배경 없음) + 우상단 X. X·취소·외부(배경) 클릭 닫힘, 확인 콜백이 `{ok:false}` 반환 시 에러 토스트 + 유지 (`shared/components/modal.css`, `.js`)
- [x] `content-drawer` — 행성변경/이용약관/개인정보처리방침처럼 "제목 + 임의 콘텐츠"가 필요한 오버레이 공통 셸. nav-drawer(왼쪽 슬라이드)와 구분되도록 오른쪽에서 슬라이드, 헤더는 앱바 톤(뒤로가기+제목). 전용 Figma 프레임은 API rate limit로 못 받아와 앱바 패턴을 그대로 적용 — §9 참조 (`shared/components/content-drawer.css`, `.js`)
- [x] `toast` — 재사용 컴포넌트(4132:588) "토스트" 섹션 기준 재구현: 흰 카드 + 상태 점(성공 초록/실패 빨강) + 텍스트 (`shared/components/toast.css`, `.js`)
- [x] `input` — 로그인 이메일/비밀번호 입력창 기준 구현, 눈 아이콘 토글 포함 (`shared/components/input.css`, `.js`)
- [x] `cta-button` — 비활성/활성/로딩(점 3개) 상태 구현 (`shared/components/cta-button.css`, `.js`)
- [x] `skeleton` — 재사용 컴포넌트(4132:588) "스켈레톤" 섹션 그라디언트 실측 반영 (`shared/components/skeleton.css`, `.js`)
- [ ] `stepper` / `wheel-picker`
- [ ] **보일러플레이트 HTML 템플릿** 확정 (mount 지점 `#header`/`#nav-drawer`/`#app`/`#toast-root`/`#overlay-root`)

### 3단계: 인증
- [x] `index.*` (로그인) — 이메일·비번 입력, 눈 아이콘, 유효성, 성공→`/user/plans/` / 회원가입 이동. Figma 기본(4001:44)·입력창 활성화(4006:955)·검증(4006:989)·에러(4434:1479)·타블렛(4146:1040) 기준. 실패 시 입력값 유지 + 두 입력창 빨간 테두리 + CTA 재비활성화, 에러 문구는 비밀번호 입력창 자체의 기본 에러 슬롯(`input.js`의 `setError(message)`)에만 표시(이메일은 테두리만, 문구 중복 없음) — 처음엔 절대좌표로 띄우는 별도 배너(`.login__error`)를 만들어 썼다가 불필요하게 복잡해 제거하고 `passwordInput.setError()`로 단순화. 이후 Figma(4434:1479) 좌표 실측 결과 에러 문구가 일반 문서 흐름을 차지하면 안 되고(버튼·회원가입 링크 위치가 에러 유무와 무관하게 고정) 메시지 없는 필드는 빈 자리도 차지하면 안 된다는 걸 확인 → `shared/components/input.css`의 `.input-field__error`를 `position:absolute`(부모 기준 `top:100%`)로 빼서 형제 요소를 안 밀어내게 하고, `:not(:empty)`로 메시지 없는 필드(이메일)는 렌더링 자체를 안 하게 수정 — 버튼/링크 위치가 Figma 실측과 정확히 일치(각각 461px/541px)함을 Playwright로 확인. 선행 작업으로 `shared/components/input.*`, `cta-button.*` 공통 컴포넌트 구현. 목 로그인(`mockLogin`)은 `shared/js/api.js` 생기면 교체 필요
- [x] `signup/index.*` — 스텝퍼 3-step(①닉네임+중복확인 ②이메일 인증+5분 타이머+연장 ③비번+확인) + 완료 화면. Figma 회원가입-닉네임(4008:358/680)/이메일(4007:482, 4008:249)/비밀번호(4008:290)/완료(4008:340)/뒤로가기 모달(4106:699), 타블렛(4146:1105) 기준. `/signup/` 한 URL 안에서 스텝을 상태로만 전환(MPA지만 페이지 이동 없이 `#app` 재렌더링), 완료 화면도 같은 페이지의 마지막 상태. 뒤로가기(앱바)는 스텝 1~3에서 공용 `modal.js`로 확인 모달(취소하기/뒤로가기, 뒤로가기 색 `--color-accent`) 띄우고 확인 시 `/`로 이동, 완료 화면은 잃을 값이 없어 모달 없이 바로 이동. 새 공용 컴포넌트 `shared/components/stepper.js`(`mountStepper(el,{step,total,from})`, 현재 스텝까지 주조색 채움 애니메이션 — 이미 지나온 구간은 `from` 기준으로 애니메이션 없이 즉시 채움, 새로 도달한 구간만 0.6s로 서서히 채움) 구현. 입력창은 `shared/components/input.js`를 처음엔 `label`/`showValidIcon` 옵션으로 확장해 재사용했으나, 회원가입 입력창엔 라벨이 있어 라벨 없는 로그인/구매 화면과 아이콘(눈·체크) 세로 위치가 달라야 하는데 같은 CSS 클래스를 공유하다 보니 회원가입에 맞춰 고칠 때마다 로그인·구매 입력창 레이아웃이 같이 깨짐 → **`shared/components/input.js`는 원래대로 되돌리고(label/showValidIcon 제거, 로그인/구매 전용으로 유지)**, 회원가입 전용 `signup/signup-input.js`+`signup-input.css`(`createSignupInput()`, 클래스명 `signup-field*`부터 완전히 분리)를 새로 만들어 회원가입 3-step은 이걸로 교체. `shared/js/api.js`에 `checkNickname`/`sendVerificationCode`/`verifyEmailCode`/`signup` 목 함수 추가(중복 닉네임 목록·인증번호 "123456" 하드코딩은 로그인 `mockLogin`과 같은 데모 목적, 이후 Supabase 연동으로 전부 실 API 교체 — 아래 갱신 참조). 완료 화면 일러스트는 Figma 전용 이미지가 없어 기존 에셋(`front_titi.png` 지구 + `shining.png` 반짝임 2개)으로 대체, 제목은 `plans/success`와 동일하게 `--font-family-brand`(Gmarket Sans) 36px 재사용. 이메일 인증 타이머(4008:249 실측: 인증번호 입력창 바로 아래가 아니라 CTA 바로 위, 30px 간격)는 처음엔 입력창 바로 아래에 붙여 그렸다가 실측과 다름을 확인 → `.signup__fields`를 `flex:1`로 채우고 `.signup__timer`에 `margin-top:auto`를 줘서 뷰포트 높이와 무관하게 항상 CTA 바로 위에 붙게 수정 — §9 23번 참조
  - [x] 이메일 인증 방식 변경(2단계) — 6자리 코드 입력(`verifyEmailCode`/`auth.verifyOtp`) 대신 Supabase 기본 발송 템플릿의 확인 링크 클릭 방식으로 전환. 코드를 이메일 본문에 실제로 채워 보내려면 커스텀 SMTP + 템플릿(`{{ .Token }}`) 설정이 필요해 로컬/데모 환경엔 과함. `sendVerificationCode`가 `emailRedirectTo: `${origin}/signup/verified``로 확인 메일을 보내고, 사용자가 메일의 링크를 클릭하면(다른 탭에서 세션이 만들어지고 supabase-js가 storage 이벤트로 원래 탭에도 그 세션을 동기화) 이 탭의 "다음" CTA는 메일 발송 직후부터 바로 눌러볼 수 있다 — 클릭 시점에 새 RPC `is_email_verified(p_email)`(`is_nickname_available`과 동일하게 anon 실행 가능한 SECURITY DEFINER, `auth.users.email_confirmed_at`만 boolean으로 노출)로 실제 확인 여부를 조회해 아니면 토스트로 실패 안내, 맞으면 3단계로 이동. 코드 입력창이 없어졌으니 `verifyEmailCode` API는 제거, 5분 타이머·연장 버튼 UX는 그대로 유지. 리다이렉트 대상을 처음엔 `/signup/`으로 뒀다가 스테퍼가 1단계부터 다시 그려져 "회원가입을 처음부터 다시 하는 것"처럼 보이는 문제가 있어(Supabase 확인 링크 클릭 후 앱으로 되돌아오는 자체는 링크형 인증인 한 피할 수 없는 동작), 스테퍼 없이 짧은 안내만 보여주는 `signup/verified.*` 랜딩 페이지로 분리 — §2 라우팅 맵 참조. **주의**: Supabase 대시보드 Authentication > URL Configuration > Redirect URLs에 앱 origin이 허용돼 있어야 리다이렉트가 동작한다(확인 필요 — 로컬 개발 포트 기준)
- [x] `user/auth/resign/index.*` + `verified.*` — 로그인 이메일 확인 링크 인증 후 탈퇴, 시간초과 시 `/user/plans/`로 이동 — §9 29번 참조

### 4단계: 홈 & 일정
- [x] `user/plans/index.*` (1차) — Figma 일정-기본(4066:724)/리스트(4005:67)/스켈레톤(4095:444) 기준. 다음 일정 제목(완료 안 된 항목 중 가장 이른 시간, 없으면 "일정을 추가해 주세요!") / 금주 월~일 날짜 선택 클릭 시 해당 날짜 데이터 재조회 / 날짜별 목록(시간 오름차순) / 체크박스로 완료 토글 / 전체완료 시 "일정 완료!" CTA → `success`. `empty_list.png`는 선택한 날짜에 일정이 0개일 때만 표시
  - [x] 더보기(⋮) → 고정·수정·삭제 바텀시트 연동. 고정=상단 정렬(다중 고정 가능, 2개 이상이면 시간 오름차순 재정렬), 삭제=목록에서 제거, 수정=`/user/plans/edit?planId=` 이동(페이지는 아직 없음). 고정된 항목은 제목 옆에 빨간 점(Figma 4007:232 실측 `#eb0000`) 표시
  - [x] 최초 진입 온보딩 3-step — Figma 온보딩-step1(4163:2534)/step2(4164:1021)/step3(4164:1039) + 타블렛(4180:821/838/857) 기준, `user/plans/onboarding.js`(신규, `maybeShowOnboarding()`)로 분리해 `index.js`에서 헤더/나브 mount 직후 호출. `#overlay-root`에 전체 화면 흰 배경으로 마운트(배경 클릭/X로 닫는 방법 없음 — spec.md대로 건너뛰기 또는 step3 CTA로만 닫힘), 페이지네이션 점 3개(현재 스텝까지 검정, 나머지 회색)·좌우 화살표(첫/마지막 스텝에서 각각 비활성)·헤드라인 강조 단어(초록, Figma 텍스트 런 실측: "루틴"/"포인트"/"식물")·`public/images/Onboarding_step1~3.png`(이미 존재하던 에셋) 반영. `planit.onboarded` localStorage 플래그로 1회만 노출. step3 CTA는 공용 `createCtaButton` 재사용, 클릭 시 플래그 설정 + `/user/plans/add` 이동 — §9 22번 참조. 이후 보완: (1) 이미지 폭을 스텝 공통 고정값(277px)으로 두면 원본 에셋 비율이 step3만 유독 좁아(1312×2656 vs 다른 두 스텝 1573×2656) step3만 세로로 길쭉해 보이던 문제 → Figma처럼 높이 기준(`max-height:100%`)+`max-width`로 비율 유지하며 맞추도록 수정, 최소 뷰포트(360×640)에서 step3의 CTA가 차지하는 만큼 이미지가 자연스럽게 더 줄어들어 겹침 없음. (2) 좌우 화살표 버튼이 너무 작다는 피드백으로 44px→56px(아이콘 30→40)로 확대. (3) 스텝 전환이 즉시 바뀌어 딱딱해 보이는 문제 → 헤드라인+이미지+화살표를 감싸는 `.onboarding__panel`에 페이드 아웃(180ms)→콘텐츠 교체→페이드 인(180ms) 트랜지션 추가, 애니메이션 중 중복 클릭 무시. (4) (2)에서 아이콘을 30→40으로 키웠다고 적었지만 실제로는 전혀 반영이 안 되고 있었음 — 이 lucide CDN 빌드는 `createElement`의 `{size}` 옵션 자체를 매핑하지 않고 항상 기본 24x24로 렌더링한다(`user/products/order/index.js`에서 이미 발견됐던 것과 같은 문제인데 이 파일엔 그때 적용 안 함) — `{width,height}`로 지정해야 실제 반영됨을 확인, 32x32로 교체. 버튼 터치 영역도 Figma "컨트롤러"(4202:845) 실측 49x59로 교체(기존 56x56은 실측값이 아니라 대충 키운 값), 위치도 화면 패딩(모바일 16px/타블렛 24px) 안쪽이 아니라 화면 가장자리에 딱 붙어야 해서(`left`/`right`에 그 패딩만큼 음수 마진) 수정
  - [ ] `?date=` 쿼리스트링 연동 (현재는 클릭 시 메모리 상태만 갱신, URL 미반영)
  - [ ] `requireAuth` 가드 (로그인 성공 시 토큰 저장 로직도 아직 없음)
- [x] `user/plans/add.*` — Figma "일정 추가/수정"(4355:1141) + 휠 피커 바텀시트(4079:1055 시간, 4079:1096 시작 날짜, 4208:872 종료 날짜) + 주기 바텀시트(4080:341) 반영. 항상 초록 테두리인 30자 제한 textarea(`--color-input-valid-bg`, 스크롤/포커스 무관), 시간·시작일·종료일·주기 4개 행. 휠 피커는 새 공용 컴포넌트 `shared/components/wheel-picker.js`(openTimeWheelPicker/openDateWheelPicker, `openBottomSheet` 셸 재사용)로 구현 — 스크롤 스냅 컬럼 3행(37/39/37 실측을 39px 균일로 단순화). 날짜 휠은 년/월/일 순서(라벨 없음), 시간 휠은 시/분(라벨 있음). 마우스 휠 조작 정밀도가 낮다는
  피드백으로 항목 클릭으로도 값을 선택할 수 있게 했고, 네이티브 휠 스크롤은 막고 휠 한 틱당 정확히
  한 칸(39px)만 이동하도록 직접 제어해 스크롤 속도를 늦췄다(§9 참조). 종료 날짜는 주기가 "당일"일 때만 필수/선택 가능하고 그 외엔 "없음"으로 비활성 처리(spec.md "일정 추가" 6번). CTA 라벨이 Figma에 "견적 갱신"으로 잘못 남아있어(다른 화면 복붙 잔재) "확인"으로 대체. `addPlan()`을 shared/js/api.js에 추가했으나 반복 주기(매일/매주 등)에 따라 여러 날짜에 일정을 전개하는 로직은 목데이터 계층 밖이라 미구현(시작일에만 생성) — Playwright로 휠 스크롤·스냅·날짜 재계산·CTA 활성화 전 구간 직접 검증 완료. addPlan()으로 만든 일정은 pinPlan/deletePlan 등 기존 목데이터 함수들과 동일하게 페이지 새로고침 시 초기화됨(진짜 백엔드 없는 이 프로젝트의 공통 한계, 신규 버그 아님)
- [x] `user/plans/edit.*` — add 폼 로직을 `user/plans/plan-form.js`(신규, `initPlanForm()`)로 뽑아내 add.js/edit.js가 공유. CSS도 별도 파일 없이 `add.css`를 그대로 링크(사용자 지정). `?planId=`로 `getPlan()` 조회 후 프리필 — 시드 데이터(add 화면을 거치지 않은 최초 목데이터)엔 startDate/endDate/recurrence가 없어 그 경우 `date`를 시작/종료 날짜로, 주기는 "당일"로 간주. 잘못된 planId면 `/user/plans/`로 리다이렉트. `updatePlan()`을 shared/js/api.js에 추가. Playwright로 홈 더보기→수정 진입 시 프리필 값 일치, 제목 수정 후 저장→홈 리다이렉트까지 확인 — addPlan과 동일하게 페이지 새로고침 시 초기화되는 한계는 동일
- [x] `user/plans/success.*` — 완료 일러스트(`good_titi.png`) + 지급 포인트(`?points=`, 완료 개수×10) 카운트업 애니메이션(아래→위 등장 후 위로 사라짐) → CTA로 `/user/profile/` 이동. 전용 Figma "/plans/success"(4006:940) 반영 완료 — §9 참조

### 5단계: 캘린더
- [x] `user/calendar/index.*` — Figma 캘린더-기본(4107:736)/캘린더-리스트(4006:1076)/캘린더-바텀시트(4008:405) 반영. 화살표로 월 이동, 날짜 클릭 시 선택 표시(주조색 원)+하단 패널 갱신. 하단 "선택일 일정" 패널은 모달이 아니라 화면 하단에 항상 고정(fixed)돼 있는 독(dock)형 패널(전용 컴포넌트 없이 이 페이지 CSS/JS에 직접 구현, `#overlay-root`/`.bottom-sheet`와 동일하게 `left/right:0 + max-width + margin:auto`로 데스크탑 600px 중앙 정렬 유지) — 핸들(초록 반투명 pill)을 포인터 드래그하면 높이를 조절할 수 있다(spec.md "바텀 시트 - 공통 UI" 9번), 최대 높이는 `100vh - 헤더 높이`로 캡을 둬서 늘려도 헤더 영역은 절대 침범하지 않는다. 더보기(⋮)는 홈과 동일하게 `shared/components/bottom-sheet.js`의 `openListBottomSheet`(고정/수정/삭제)를 그대로 재사용 — Figma 4008:405가 홈의 "일정 - 바텀 시트"와 동일 레이아웃이라 별도 컴포넌트 불필요. 페이지 배경은 다른 화면과 달리 흰색이 아니라 `--color-calendar-bg`(#f9f9f9, 4107:736 실측) — `user/products/order`와 동일한 패턴으로 이 페이지 CSS에서 `body` 배경을 오버라이드하고, 헤더도 이 페이지에서만 투명 처리(`.header{background:transparent}`)해 캘린더/바텀시트와 하나로 이어지는 배경처럼 보이게 함

### 6단계: 상점 · 구매 · 주문 내역
구매완료/주문내역 2개 화면은 전용 Figma 프레임을 API rate limit(429)로 끝내 못 받아와
spec.md 텍스트 + 기존 디자인 토큰/컴포넌트 언어로 구현 — §9 참조. 스토어(4278:843)·구매
(4293:1252 등)는 이후 Desktop Bridge 플러그인 경로(로컬, REST API 우회)로 실측 확보해 반영.
- [x] `user/store/products/index.*` — Figma "/store"(4278:843) 반영: 아이콘(`store_icon.png`)+"스토어" 타이틀(24px) → "나의 포인트" 라벨+회색 필(pill) 배경의 포인트 값 → 단일 열 상품 리스트(썸네일 80×80 + 카테고리/이름/가격, 가격은 초록 원형 "P" 배지+검정 숫자). 카테고리는 spec.md의 "씨앗·식물·묘목"이 아니라 Figma 실측 "나무"/"다육식물" 2종을 그대로 사용(§9). 상품 목록은 이후 `shared/js/plants.js`(20종, §9 25번)로 교체됨. 행 클릭 시 구매 확인 바텀시트 → `order/index.html?id=`. 스켈레톤(모바일 4534:1055 343x77 / 타블렛 4561:1796 551x69 실측)은 처음엔 그 실측 높이를 그대로 썼는데, 실제 리스트 행 높이(`.store__item`, 88px, 모바일·타블렛 공통)보다 낮아서 로딩이 끝나고 실제 목록이 뜨는 순간 스켈레톤보다 커지며 튀어 보이는 문제가 있어 실제 행 높이(88)에 맞춰 수정. 타블렛 미디어쿼리의 `margin: 0 24px`가 세로 여백까지 0으로 지워버려 스켈레톤이 "나의 포인트" 구분선에 거의 붙어 보이던 것도 `margin: 16px 24px`로 수정(Figma 실측: 위쪽 25px 여백). 그래도 좌우 여백이 한쪽만 넓어 보이는 문제가 남아있었는데, 원인은 JS에서 스켈레톤 요소에 `width: calc(100% - 32px)`를 CSS margin과 같이 주고 있어서였음 — 그 32px(모바일 여백 16+16 기준)이 타블렛 여백(24+24=48px)과 안 맞아 박스가 16px만큼 overflow하며 오른쪽 여백만 어긋나 보였음 → width 지정을 아예 없애고 CSS margin만으로 좌우를 들여쓰게 해서 블록 요소가 남는 공간을 자동으로 채우도록 수정, 모바일 16=16/타블렛 24=24로 완전히 대칭 확인
  - [x] 타블렛(≥600px) 리스트 항목(4324:1295 실측) — 카테고리/이름 묶음(`.store__item-info`)과 가격을 세로로 쌓지 않고 한 행에서 좌우 끝으로 배치(`justify-content:space-between`), 가격도 모바일보다 크게(배지 15→17px, 숫자 12→16px medium)
  - [x] 구매 확인 바텀시트(4278:893 "구매창" 실측) — 실측 결과 제목/X 헤더가 아예 없는 레이아웃(이름+잔여포인트 줄 / CTA / 안내문구만 존재)이라 공용 `shared/components/bottom-sheet.js`를 쓰지 않고 전용 컴포넌트 `shared/components/purchase-sheet.js`(+`.css`)로 구현 — 상점 목록과 구매 페이지 양쪽에서 재사용(아래 참조). 배경 블러+딤/외부 클릭·Esc 닫힘/아래→위 슬라이드는 공용 바텀시트와 동일하게 유지. "결제 후 포인트 N"은 주황 원형 "P" 배지(`--color-accent`), CTA 버튼은 `createCtaButton` 재사용, 버튼 아래 "주문 내용을 확인 하였으며, 정보 제공 등에 동의 합니다." 안내 문구. `onConfirm`이 `{ok:false}` 반환 시 에러 토스트+유지(bottom-sheet.js와 동일 규약), `onClose` 콜백으로 호출측이 트리거 상태(체크박스 등)를 되돌릴 수 있음
- [x] `user/products/order/index.*` — Figma "상점 - 구매"(4293:1252 기본) / 주소지 입력 활성화(4295:1489) / 구매 동의 체크(4295:1464) 반영. 앱바 타이틀은 제품명이 아니라 고정 문구 "결제", 제품 정보는 가격(20px semibold 검정)이 이름(14px regular) 위에 옴(다른 화면과 반대 순서). 카드 3개(흰 배경, `--color-card-border` 테두리, radius12): ①MY 포인트(다크그레이 원형 "P" 배지) ②주소지(기본 없음 4295:1338/값 있음 4295:1369 모두 접힌 카드 테두리는 회색 유지, 꺽쇠로 입력폼 토글 — 펼쳐도 카드 테두리는 회색이다가 입력창에 포커스가 들어갈 때만(4295:1489) 카드 전체 테두리가 초록으로 바뀜(`:focus-within`, JS 상태 불필요). 공용 `input-field`가 그대로 focus/valid 색상과 일치해 입력창 자체는 별도 스타일 불필요. "주소지 저장" 클릭 시 `planit.address`(localStorage)에 저장 — 페이지를 새로고침해도 유지되고 다음 방문 시 프리필) ③구매 동의(원형 체크박스+굵은 제목이 곧 토글 버튼, 체크 시 원 배경 회색→초록/사용 포인트 값 회색→초록, **체크하는 순간** 구매 바텀시트가 배경 딤 없이 열림 — `purchase-sheet`를 `backdrop:false`로 재사용, 사용자 요청). 페이지 배경은 다른 화면과 달리 흰색이 아니라 `--color-order-bg`(#f8f9fb) — 이 페이지 CSS에서 `body` 배경 자체를 오버라이드(페이지별 stylesheet라 다른 화면엔 영향 없음)하고 `.app-bar`는 투명 처리해 앱바 영역까지 같은 배경색 하나로 이어지게 함. `createOrder()` 성공 시 `../../order/success/index.html?orderId=`. 스켈레톤(4555:1723 실측): 처음엔 이미지·가격·이름을 각각 스켈레톤하고 있었는데, 실제로는 그 영역 전체를 스켈레톤 블록 하나(168x77)로 가리는 방식이라 마크업을 이미지+텍스트 그룹과 스켈레톤 블록을 형제로 두고 로딩 중엔 전자를 숨기는 구조로 수정. MY 포인트(89x20)·구매 후 포인트(86x20) 스켈레톤 크기도 실측값으로 맞추고, 구매 후 포인트는 스켈레톤 자체가 빠져 있어서 추가(spec.md "구매 후 잔여 포인트... 스켈레톤 필요"). 주소지 값은 마크업에 "미설정"이 정적 텍스트로 박혀 있어 스켈레톤을 씌워도 그 텍스트가 그대로 비쳐 보이는 버그가 있어 스켈레톤 적용 전 `textContent`를 비우도록 수정(Figma도 스켈레톤 상태에선 이 텍스트 자체를 visible:false로 숨김). "사용 포인트" 필드는 spec.md에 스켈레톤 요구사항이 없어(`--color-assist` 톤으로 항상 즉시 표시) 그대로 둠
- [x] `user/order/success/index.*` — Figma "구매 완료"(4295:1520) 반영: 안내 문구 "구매 완료!" + 일러스트(`smile_titi.png`, 피사체가 중앙이라 오프셋 보정 불필요) → CTA "주문 내역 확인하기"로 `/user/profile/orders/` 이동(§9 "구매 완료 이동" 항목과 동일한 해석). 라벨은 실제로는 "구매 내역 확인"이지만 주문내역 페이지 이동 흐름과 맞춰 기존 문구 유지
  - [x] **버그 수정**: 모바일에서 CTA가 화면 오른쪽으로 16px 밀려나가던 문제 — `.cta-button`(공용, `width:100%`)과 `position:fixed;left:16px;right:16px`를 같이 쓰면 `width:100%`가 뷰포트 기준으로 먼저 계산되면서 `right`가 무시돼 버림. `width:auto`를 추가로 얹어야 left/right 사이 폭으로 재계산됨 — `plan-success__cta`(일정 완료)에도 동일한 버그가 있어 같이 수정. 이 "고정 CTA + left/right 16px" 패턴을 새로 쓸 때는 항상 `width:auto`를 같이 넣을 것
- [x] `user/profile/orders/index.*` — Figma "profile/orders"(4376:1786) 반영. "나의 포인트" 바는 상점과 동일한 라벨+초록 필(pill), "주문 내역 N건" 타이틀(18px semibold + 초록 건수). 카드(흰 배경, `--color-card-border`): 상태 행(`lucide/Info` 아이콘 + 상태 텍스트 — 주문 접수 중은 `--color-accent`, 취소 접수 중은 `--color-error`, 주문 배송 중은 `--color-primary`, 배송중 색상은 실측 예시가 없어 팔레트 흐름상 추정) → 제품(가격 20px semibold이 이름 위, 구매 페이지와 동일 순서) → 구분선 → "사용 후 포인트" 박스 → "주문 취소" 버튼. **주문 취소 버튼은 "주문 접수 중"일 때만 활성화**(진한 초록), 취소 접수 중·주문 배송 중이면 비활성화(`--color-primary-disabled-bg` — 연한 초록, 실측 색상 값과 정확히 일치, 사용자 지정 규칙) → 주문 취소 모달(`openModal`) 확인 시 `cancelOrder()`로 상태 전환

### 7단계: 프로필 & 드로워
- [x] `user/profile/index.*` — Figma "/profile"(4007:187) 기준. 행성 캐릭터(기본:지구, `front_titi.png`)·닉네임·이메일(스켈레톤) + 포인트/STORE/주문내역 카드(`store_icon.png`/`truck.png`, `--color-page-bg` 배경) + 세팅 리스트(로그아웃 모달·행성변경/약관/개인정보 드로워·계정탈퇴 이동·버전). "계정 탈퇴" 행은 Figma에서 `visible:false`였지만 spec.md 명시 요구사항이라 포함 — §9 참조
- [x] 행성 변경 / 이용 약관 / 개인 정보 처리 방침 드로워 — `content-drawer` 공통 컴포넌트로 구현. 행성 컬렉션은 현재 목데이터상 지구(`front_titi.png`)·달(`moon.png`) 2종만 존재 — §9 참조. 약관/개인정보 본문은 정의서에 실제 문구가 없어 플레이스홀더 텍스트로 채움

### 8단계: 랭킹 & 알림
- [x] `user/ranking/index.*` — Figma "/ranking"(4259:1235) · 랭킹 리스트 타블렛(4319:1165) 반영. "총 N명 참여 중"(초록)+"M월 랭킹"(24px semibold) → "나의 순위" 풀블리드 카드(위아래 구분선, 아바타+순위+닉네임+포인트+공유하기 필 버튼) → 구분선 → 전체 순위 목록(흰 카드 radius10, 60px 행, 15px 간격). 1~3등은 순위 숫자 대신 왕관 이미지(`crown1/2/3.png`), 포인트는 주조색(초록); 4등 이하는 순위 숫자 검정, 포인트는 회색(`#8c9aae` 실측값 그대로 인라인 — `feat/calendar` 브랜치의 캘린더 미선택 날짜 숫자와 우연히 같은 색이지만 그 브랜치가 아직 `main`에 없어 변수로 공유하지 않고 각자 인라인 처리); 로그인 사용자 본인 행은 목록 안에서도 순위 숫자·포인트가 강조색(주황)으로 다시 하이라이트. 아바타 이미지는 프로필과 동일한 행성(planets, 지구/달) 재사용. 모바일은 닉네임/포인트를 세로로 쌓고 타블렛(≥600px)은 한 행에 좌우로 배치(4319:1165 실측). "나의" 랭킹 데이터는 목데이터 대신 실제 로그인 사용자(user.nickname/points/planet)를 그대로 사용해 프로필 화면과 어긋나지 않게 함. 공유하기: `navigator.share` 지원 시 공유 시트, 미지원이면 클립보드 복사+토스트 — `index.html`에 정적 Open Graph 메타(`og:title`/`og:description`/`og:image`) 추가
- [x] `user/notification/index.*` — Figma "/notification"(4293:1216) 반영. 앱바(뒤로가기+"알림") + "오늘"/"어제" 섹션별 카드 리스트(흰 배경 radius12). 완료(done) 안 된 항목은 일정 제목만 주조색(초록)으로 강조하고 나머지 문구는 검정 — 실측 결과 리치 텍스트(같은 줄 안에서 색만 다름, 굵기는 동일)라 굵게 처리하지 않음. 완료된 항목은 시간·문구 전체가 `--color-assist`(회색)로 비활성화 표시되고 클릭 불가, 활성 항목만 버튼으로 렌더링해 클릭 시 `/user/plans/` 이동. "오늘" 알림은 `shared/js/data.js`의 `plans`(오늘 날짜) 배열에서 파생해 done 상태가 항상 일치하도록 하고, "어제" 알림은 대응하는 plans 데이터가 없어 별도 목데이터로 채움(§9 참조)

### 9단계: 에러 페이지
- [x] `404/index.*` — Figma 모바일(4087:755) / 타블렛·데스크탑(4145:934) 반영. 앱바(뒤로가기, 제목 없음) + "404"(GmarketSans Bold 40px) + 안내 문구(`--color-assist`, 178px 폭 자동 줄바꿈) + 달 일러스트(`moon.png`, §7단계에서 이미 확보한 행성 에셋 재사용) + CTA "홈페이지로 이동"(`/user/plans/` — "홈" 해석은 §9 3번과 동일). CTA는 `user/plans/success.css`의 하단 고정 패턴 그대로 재사용. `scripts/dev-server.js`가 미매칭 경로에 `src/404/index.html`을 404 상태코드로 응답하도록 이미 구현돼 있어 서버 쪽 추가 작업 없음
- [x] `timeout/index.*` — Figma 모바일(4087:773) / 타블렛·데스크탑(4146:1003) 반영. 앱바(뒤로가기, 제목 없음) + "네트워크 지연"(GmarketSans Bold 36px) + 안내 문구(`--color-assist`, 223px 폭 자동 줄바꿈) + `timeout_titi.png` 일러스트 + CTA "이전 페이지로 이동"(`history.back()`). 레이아웃은 `404/index.css`와 동일한 하단 고정 CTA 패턴 재사용. CTA 라벨은 타블렛 프레임에 "홈페이지로 이동"이 잘못 남아 있어 모바일 프레임·spec.md 문구를 채택 — index.js 주석 참조. 아직 실제 요청 타임아웃/실패 시 자동으로 `/timeout/`으로 보내는 JS 훅은 없음(페이지 자체만 구현, 별도 작업 필요)

### 10단계: 관리자
관리자 화면은 나머지 앱과 달리 모바일 카드(600px 고정)가 아니라 데스크탑 전용 대시보드
(Figma 4388:2254 등 1920px 캔버스) — `shared/components/admin-layout.css`가 이 페이지들에서만
전역 body/#app/#toast-root/#overlay-root의 "600px 카드" 레이아웃을 오버라이드한다. 공통 상단
네비게이션(로고+주문관리/상점관리/로그아웃)은 `shared/components/admin-header.*`로 분리.
- [x] `admin/orders/index.*` — Figma "관리자 - 주문 관리 - 주문 확인"(4388:2254 기본 / 4392:2529 모달) 반영. "들어온 주문 N개" + 테이블(주문 고객/상품/번호/상태/주소지), 상태는 점 색상만으로 표시(주문 접수 중=주황 accent, 취소 접수 중=빨강 error, 주문 배송 중=초록 primary — user/profile/orders와 동일한 상태-색상 규칙). 접수 중·취소 접수 중 행만 클릭 가능, 배송 중은 이미 처리된 최종 상태라 클릭 불가. 4392:2529는 배송 모달/취소 모달 두 변형이 같은 좌표에 겹쳐 있는 프레임이었음(둘 다 `visible:true`) — 실제로는 주문 상태에 따라 배송 모달(CTA "배송", 접수중→배송중) 또는 취소 모달(CTA "주문 취소", 성공 시 리스트에서 삭제)만 열리도록 분기 구현. 두 모달 다 CTA 배경은 (취소여도) 초록 — Figma 실측 그대로. 주문 데이터는 사용자 개인 주문 내역(`orders[]`, 소유자 구분 없음)과 분리한 `adminOrders[]`(고객명 포함, Figma 샘플 데이터 그대로)를 신설해 사용 — 안 그러면 다른 고객 목데이터가 로그인한 사용자 "내 주문 내역" 화면에도 섞여 보이는 문제가 생김
- [x] `admin/products/index.*` — Figma "관리자 - 상점 관리 - 기본"(4392:2654) / "제품 수정"(4404:1119) 반영. 좌측 제품 목록(썸네일+카테고리+이름+가격+수정/삭제) + 우측 추가/수정 폼(사진 추가/제품명/가격/카테고리 — 수정 클릭 시 같은 폼에 프리필, 사진 영역은 "사진 추가"(빈 대시 박스)에서 "사진 변경"(기존 미리보기+대시 박스)으로 전환). 카테고리는 spec.md "씨앗·식물·묘목"이 아니라 상점(6단계)에서 이미 확정한 실제 값 "나무"/"다육식물" 재사용 — Figma 제품 수정 목업(4404:1119)의 드롭다운엔 "묘목"이 선택돼 있었지만 정작 그 제품(사과 나무 묘목)은 목록에서 "나무"로 분류돼 있어 드롭다운 쪽이 갱신 안 된 낡은 값으로 판단, §9 참조. Figma에는 폼 제출 버튼이 없어(프레임 하단에서 잘린 것으로 추정) 공용 `createCtaButton`으로 추가하기/수정하기 버튼을 새로 붙여야 실제로 동작함. 사진은 실제 업로드 서버가 없어 `FileReader`로 data URL 변환 후 그대로 저장(세션 동안만 유지)
  - [x] **버그 수정**: `shared/js/data.js`의 `products` 배열이 원래 상품 7종을 실수로 3벌 복붙해 21개였음(id가 p1~p7로 겹침) — 그동안 상점(6단계)은 그냥 다 렌더링해서 티가 안 났지만, 관리자 CRUD는 id로 항목을 특정해야 해서 이 상태로는 삭제/수정이 어느 항목을 가리키는지 모호해지는 실제 버그였음 → 7개로 정리

---

## 7. 화면 흐름 (핵심 여정)

```
로그인(/) → 홈(/user/plans/) → 일정 추가(add) → 수행(체크) → 전체 완료
      → 일정 완료(success?points=) → 프로필(/user/profile/)
      → 상점(/user/store/) → 구매(buy?id=)
      → 구매 완료(success?orderId=) → 주문 내역(/user/store/history)
```

---

## 8. 데이터 모델

> **갱신 이력**: 이 표는 원래 localStorage 목데이터(`data.js`/`plants.js`/`state.js`) 초안이었다. Supabase 연동(§5 참조) 이후 Ranking을 뺀 전부가 실제 DB 테이블로 옮겨갔고 `state.js`/`plants.js`는 삭제됐다 — 아래는 2026-07-19 기준 실제 스키마(`public` 스키마, `mcp__supabase__list_tables`로 확인)다. `shared/js/data.js`에는 이제 `planets`(표시용 카탈로그)와 `ranking`/`rankingMeta`(목데이터) 두 개만 남아 있다. §9(1~29번)의 옛 표기(`state.js`/`plants.js`/`adminOrders` 등)는 그 시점 기준 히스토리라 그대로 둔다.

- **User** (`public.profiles`, RLS로 계정별 격리): `{ id(uuid, auth.users FK), nickname(unique), email, points(≥0), planet_id(FK planets.id, 기본 earth), is_admin, address?, address_detail?, resign_confirmed_at?, created_at }`. `shared/js/api.js`의 `getProfile()`/`setPlanet()`/`awardPoints()`/`getAddress()`/`saveAddress()`/`clearAddress()`가 직접 조회·갱신한다. 랭킹은 별도 테이블 없이 이 테이블의 `points`로 정렬해서 계산(아래 Ranking 참조). 주소는 §10-1로 이전됨
- **Planet**: 두 계층이 있다 — 실제 DB `public.planets`(`{ id, name, image, sort_order }`, `profiles.planet_id`가 참조, 현재 지구/달 2행만 존재)와 프로필 드로워 표시용 `shared/js/data.js`의 `planets`(12종 전체 카탈로그, DB에 없는 10종은 `image: null`로 항상 잠금 상태로만 렌더링 — §9 13번 참조)
- **Plan** (`public.plans`, RLS): `{ id(uuid), user_id(FK profiles), title(1~30자), plan_time, start_date, end_date?, repeat(당일·매일·매주·격주·매월·매년), done, pinned, created_at }`. `repeat`는 한글 컬럼값이라 프론트의 영문 토큰(day/daily/weekly/biweekly/monthly/yearly)과 `api.js`의 `RECURRENCE_TO_DB`/`RECURRENCE_FROM_DB`로 상호 변환. 반복 주기에 따라 여러 날짜에 걸쳐 일정을 전개하는 로직은 미구현 — `addPlan()`은 `start_date` 한 날짜에만 행을 만든다(§6 4단계 로그 참조)
- **Product** (`public.products`, RLS): `{ id(text), name, category(나무|다육식물 — spec.md "씨앗·식물·묘목"은 §9 15번대로 실제 미채택), price(>0), image, created_at }`. 관리자 CRUD는 `addProduct()`/`updateProduct()`/`deleteProduct()`(id는 `pl${Date.now()}`로 클라이언트에서 생성)
- **Order** (`public.orders`, RLS: 본인 소유 또는 관리자만): `{ id(text, DB 기본값 generate_order_id()), user_id(FK profiles), product_id(FK products), status(주문 접수 중·취소 접수 중·주문 배송 중), points_used(>0), remaining_after(≥0), address, address_detail?, created_at }`. 생성은 포인트 차감+주문 생성을 원자적으로 묶은 `create_order` RPC(`createOrder()`), 취소 요청은 `cancelOrder()`(status만 변경), 관리자 배송/취소 승인은 `shipOrder()`/`cancelAdminOrder()`(승인 시 행 자체 삭제)
- **AdminOrder**: 별도 테이블 없음 — 예전 `data.js`의 `adminOrders` 배열은 폐기되고, `getAdminOrders()`가 `orders`를 `profiles(nickname)`와 조인해 그대로 조회한다(관리자는 RLS로 전체 유저 주문 열람 허용, 사용자는 본인 주문만)
- **Ranking**: `{ rank, nickname, points, planet, isMe? }` — 유일하게 남은 목데이터(`shared/js/data.js`의 `ranking`/`rankingMeta`, 다른 유저 15명분). 다중 유저 랭킹 집계 기능이 이번 범위 밖이라(§9 6번) 실 DB로 못 옮겼다. `getRanking()`이 "나의 순위"(6등) 항목만 실시간 `profiles`로 덮어쓰고 포인트 기준으로 재정렬해 순위를 매긴다
- **Notification** (`public.notifications`, RLS): `{ id(uuid), user_id(FK profiles), plan_id?(FK plans), title, occurred_at, done, created_at }`. `section`(오늘·어제)은 저장 컬럼이 아니라 `occurred_at`을 그때그때 오늘/어제와 비교해 계산. `done`은 연결된 `plan_id`가 있으면 그 `plans.done`을 우선 사용(일정 완료 시 알림도 즉시 반영). DB 크론잡 `create_upcoming_plan_notifications()`가 일정 시작 10분 전에 행을 생성

---

## 9. 확인 필요 항목 (정의서 내 표기 불일치)

1. **일정 완료 도메인** — 본문 `/user/plants/success` vs 흐름 `/user/plans/success` → `plans`로 가정(오타)
2. **주문 내역 도메인** — 섹션 헤더 `/user/products/orders` vs 프로필 버튼 `/user/profile/orders` → `/user/profile/orders`로 가정 (이후 §10 폴더 구조 재정리로 `/user/store/history`로 다시 이동 — §9 30번 참조)
3. **로그인 성공 이동** — `/index`로 기재되나 실제 홈은 `/user/plans` → `/user/plans/`로 해석
4. **구매 완료 이동** — CTA가 `/products/orders`로 기재 → `/user/profile/orders/`로 해석 (이후 §10 폴더 구조 재정리로 `/user/store/history`로 다시 이동 — §9 30번 참조)
5. **일정 완료 이동** — CTA가 `/profile`로 기재 → `/user/profile/`로 해석
6. **상점 사용자 흐름** — MVP 정의서 "상점" 흐름이 "랭킹" 흐름과 동일하게 복붙된 오류 → 재정의 필요
7. **타블렛 브레이크포인트 폭** — 정의서·Figma 모두 타블렛은 "최소 높이 600px"만 명시, 폭 기준 없음. Figma "나브" 타블렛 프레임(4146:1022) 실측 폭이 600px라 `--breakpoint-tablet: 600px`로 가정해 `nav-drawer.css`에 반영함 → 실제 타블렛 폭 기준(예: 768px 등) 확정 필요
8. **입력창 텍스트 크기** — "폰트 시스템"(4111:853) 프레임의 콘텐츠/어시스트 텍스트는 14px로 정의됐지만, 로그인 화면(4001:44 등) 실제 입력창의 placeholder·입력값은 12px로 그려져 있음 → `--font-size-input: 12px`로 별도 토큰을 두고 실측값을 따름. 의도적 축소인지 확인 필요
9. **헤더 로고 표기** — 재사용 컴포넌트(4132:588)의 헤더 워드마크가 모바일은 "PLAN !T", 타블렛은 "PLAN T!T"로 다르게 적혀 있음(오타로 추정) → `header.js`는 두 브레이크포인트 모두 "PLAN !T"로 통일해 구현. 실제 의도 확인 필요
10. ~~**종 아이콘 소스**~~ → 사용자 요청으로 확정: `header.js`에서 lucide `Bell` 대신 Figma 원본 그대로 solar 아이콘셋(`solar:bell-outline`)을 사용. 빌드 스텝 없이 CDN ESM(`iconify-icon@2.1.0/+esm`)으로 Iconify 웹 컴포넌트를 불러와 `<iconify-icon icon="solar:bell-outline">`로 렌더링(CLAUDE.md "아이콘" 섹션에 예외로 명시). 다른 아이콘은 계속 lucide 사용
11. **로그인 실패 안내 방식** — ~~spec.md는 "실패 토스트를 띄운다"고 적혀 있지만, 로그인 에러 화면(4434:1479) 캡처에는 토스트 없이 인라인 문구만 보여 처음엔 인라인 문구만 구현했었음~~ → 이후 재사용 컴포넌트(4132:588)에 에러 토스트("요청에 실패 했습니다.")가 추가돼 **인라인 문구 + 토스트 둘 다** 띄우는 것으로 확정. 입력값은 지우지 않고 유지, 두 입력창 빨간 테두리, CTA 버튼은 실패 후 다시 비활성(연한 초록) 상태로 돌아가 사용자가 값을 수정해야 재시도 가능. 다른 실패 케이스(회원가입 등)에도 이 패턴(인라인+토스트 동시)을 적용
12. ~~**일정 완료 화면 디자인 부재**~~ → 전용 Figma "/plans/success"(4006:940) 확보돼 반영 완료. 확정 사항: 제목은 `--font-family-brand`(Gmarket Sans) 36px, 안내 문구는 한 줄("포인트를 지급 했어요!", 16px medium, `--color-primary`) — spec.md의 2번째 문장("포인트를 모아서...")은 Figma에 없어 제외, CTA 라벨은 "포인트 확인 하기"(공백 포함, 기존 임의 문구 대체), 지급 포인트는 "+ N POINT" 형식·`--color-accent`·Gmarket Sans 20px. 이미지 영역: 원본 `good_titi.png`의 피사체(지구본)가 캔버스 중앙보다 오른쪽에 있어 Figma도 컨테이너 폭 기준 좌측 10.1333%(38/375) 오프셋·70.9333%(266/375) 폭으로 배치(정중앙 아님) — `%` 기반으로 구현해 화면 폭이 달라져도 동일 비율 유지
13. **행성 변경/이용약관/개인정보 드로워 전용 Figma 미확인** — 프로필(4007:187)은 확보했지만 이 3개 드로워는 Figma API rate limit(429)로 프레임을 못 받아옴 → spec.md 텍스트만으로 `content-drawer`(앱바 톤 헤더+콘텐츠) 공통 셸을 만들어 구현. 행성 컬렉션은 `public/images`에 실제로 존재하는 행성류 이미지가 `front_titi.png`(지구)·`moon.png`(달) 2종뿐이라 이 둘로만 구성 — 실제 Figma 프레임/추가 행성 에셋 확보되면 교체·확장 필요. 이용약관/개인정보 처리방침 본문도 정의서에 실제 문구가 없어 플레이스홀더 텍스트로 채움
14. **데스크탑(600px 초과) 뷰** — Figma "데스크탑"(4159:806) 기준으로 확정: `body`는 600px 카드로 고정, 바깥 캔버스는 `--color-page-bg`(#f7f7f7, html에 적용), 카드 그림자는 `#overlay-root`에 `box-shadow: 0 0 4px rgba(0,0,0,.09)`. Figma의 "qr 영역"(4405:1251, 139×128, 흰 배경 + `--color-qr-border` 테두리, radius 5)은 카드 왼쪽 아래 여백에 `#desktop-qr`로 배치, 카드와 겹치지 않을 최소 폭(`min-width:960px`)에서만 노출. 내용(`public/images/qr.svg` + 라벨 "모바일 바로 보기", 4550:1674 실측: 16px Pretendard Medium, `--color-assist`, QR 박스 중앙 정렬로 위 7px)은 모든 페이지에 이미 있는 빈 `#desktop-qr` div를 페이지마다 고치지 않고 `layout.css`의 `::before`(QR 배경이미지)/`::after`(라벨 텍스트) 의사요소만으로 채움 — `aria-hidden="true"`라 접근성 문제 없음

15. ~~**상점 전용 Figma 미확인**~~ → REST API가 계속 rate limit(429)이었지만, Figma Desktop에 Desktop Bridge 플러그인이 연결돼 있어 `figma_capture_screenshot`/`figma_execute`(플러그인 로컬 실행, REST 안 거침)로 "/store"(4278:843) 실측 확보해 반영 완료. 카테고리는 spec.md "씨앗·식물·묘목"이 아니라 실측 "나무"/"다육식물" 2종, 상품 7종(사철 나무 묘목·구슬 얽이·고스티×2·사과 나무 묘목·오육 나무 묘목·달랑 나무 묘목)·가격·이미지 매핑 모두 실측 그대로.
16. ~~**구매 전용 Figma 미확인**~~ → Desktop Bridge 플러그인 경로(`figma_execute`, REST 우회)로 기본(4293:1252)/주소지 입력 활성화(4295:1489)/구매 동의 체크(4295:1464) 3개 상태 모두 확보해 반영 완료.
17. ~~**주문내역 전용 Figma 미확인**~~ → `figma_execute`로 "profile/orders"(4376:1786) 확보해 반영 완료(위 6단계 체크리스트 참조).
18. **구매완료 전용 Figma 미확인** — 이 화면은 여전히 전용 프레임을 못 받아와 spec.md 텍스트 + 기존 디자인 언어로 구현. 15·16·17번과 같이 Figma Desktop에 파일이 열려 있고 플러그인이 연결된 상태라면 `figma_execute`로 재시도 가능.
19. **관리자 주문 배송/취소 모달 프레임 중첩** — Figma "관리자 - 주문 관리 - 주문 확인"(4392:2529)은 배송 모달(4392:2586)과 취소 모달(4392:2631) 두 프레임이 같은 좌표에 완전히 겹쳐 있고 둘 다 `visible:true`라, 스크린샷 한 장으론 위에 그려진 취소 모달만 보였음 — `figma_execute`로 두 프레임을 각각 조회해서 확인. 두 프레임 다 샘플 데이터·타이틀("주문 접수 중", 주황)이 동일해 실제로는 CTA 라벨("배송" vs "주문 취소")만 다른 변형이었고, 실제 구현은 주문 상태에 따라 이 중 하나만 열리도록 분기함(위 10단계 참조)
20. **관리자 상점 관리 카테고리 드롭다운 낡은 값** — 제품 수정 목업(4404:1119)의 "제품 카테고리" 드롭다운엔 "묘목"이 선택돼 있었지만, 정작 그 제품(사과 나무 묘목)은 목록에서 "나무"로 분류돼 있음 → 상점(6단계, §9 15번)에서 이미 확정한 실제 카테고리 "나무"/"다육식물"을 그대로 써서 드롭다운 값이 목록 표기와 어긋나지 않게 구현
21. **관리자 상점 관리 폼 제출 버튼 없음** — Figma 제품 추가/수정 폼(4392:2654, 4404:1119) 모두 카테고리 드롭다운에서 프레임이 끝나고 제출 버튼이 없음(레이아웃 하단에서 잘린 것으로 추정) → 공용 `createCtaButton`으로 추가하기/수정하기 버튼을 새로 만들어 붙임(위 10단계 참조)

22. **온보딩 모바일/타블렛 실측 불일치 2건** — (a) step3 헤드라인 원문이 모바일 "포인트를 다 모았다면"과 타블렛 "포인트를 모으시면"으로 다름 → 모바일 문구로 통일. (b) 건너뛰기 버튼 색이 모바일 step2만 `--color-accent`(orange)이고 나머지 5개 측정(모바일 step1·3, 타블렛 3개 전부)은 `--color-assist`(gray-blue) → 다수결로 전부 assist 통일. 두 건 모두 Figma 원본에 실제 의도 확인 필요

23. **회원가입 spec.md ↔ Figma 문구 불일치** — (a) spec.md는 이메일 인증 단계에 "인증 번호 전송"→"인증 번호 확인"→"다음" 3개 CTA 라벨을 언급하나 Figma 실측은 "이메일 인증"(코드 발송) → "다음"(코드 검증+다음 스텝, 중간 라벨 없음) 2단계뿐이라 Figma를 따름. (b) spec.md "비밀번호 설정" 6번의 "다음 CTA 버튼을 클릭하면 사용자 정보 입력 단계로 이동한다"는 Figma에 없는 4번째 스텝을 가리키는 문구(다른 화면 복붙 잔재로 추정)라 무시하고 비밀번호 다음은 바로 완료 화면(4008:340)으로 이동

24. **입력창 상태 실측 확보(4554:1722)** — 처음엔 기본/검증/에러 모두 테두리 2px 고정에 색만 바꿨는데, 실제로는 기본·검증은 1px, 에러만 2px로 굵어지고 색도 범용 `--color-error`(#ef4444)가 아니라 순빨강 `#ff0000`(신규 토큰 `--color-input-error`) → `shared/components/input.css`·`signup/signup-input.css` 둘 다 수정. (이후 사용자 요청으로 테두리 두께는 다시 상태 상관없이 2px로 통일 — 색만 상태별로 다름)

25. **localStorage 통합 상태 관리 도입** — MPA 특성상 `shared/js/data.js`의 `user`/`plans`/`products`/`orders`가 페이지 이동마다 모듈이 재실행되며 초기 시드값으로 리셋되던 문제(포인트 차감·일정 완료 체크 등 어떤 변경도 다음 페이지에서 사라짐)를 해결하기 위해 `shared/js/state.js`(localStorage 키 `planit.state` 하나로 통합) 도입. 상품 카탈로그는 `shared/js/plants.js`(20종)로 교체(예전 `data.js`의 7종 폐기), `adminOrders`의 productId도 새 카탈로그 id(`pl1~pl20`)로 갱신. 확인/수정된 기존 드리프트 버그 2건: (a) 로그인 `mockLogin`이 `test@planit.com`을 하드코딩해 실제 유저 이메일과 무관하게 동작 → `getProfile()`로 얻은 실제 이메일과 비교하도록 수정. (b) 홈에서 일정 완료 시 `plans.length*10` 포인트를 계산해 success 화면에 애니메이션으로만 보여주고 실제 `user.points`엔 반영 안 됨 → `awardPoints()` 추가해 CTA 클릭 시점에 실제로 적립. `getRanking()`도 "나의 순위" 항목을 실시간 `user`로 덮어써서 프로필과 랭킹의 포인트가 항상 일치하게 함. 사용자가 "기능만 구현, 기존 UI/레이아웃은 손대지 말 것"을 명시적으로 지침으로 줘서, 원 계획에 있던 프로필 페이지의 "데모 데이터 초기화" 새 버튼과 구매 페이지의 "클릭 시 토스트"는 UI 변경 없이는 불가능해 스킵/조정함(포인트 부족 안내는 클릭이 아니라 네이티브 disabled 버튼이라 클릭 자체가 안 먹혀서, 페이지 로드 시점에 기존 `showToast`로 자동 안내하는 것으로 대체 — 새 UI 요소 없음). 리셋 기능은 이번 범위에서 미구현(`resetDemoState()` 함수 자체는 `api.js`에 있으나 호출하는 UI/트리거 없음) — 나중에 트리거 방식(URL 쿼리, 콘솔 전역 함수 등) 결정 필요. 이후 데모 계정을 `test@email.com`/`test1234`로 바꿨는데(`data.js`의 `user.email`, `index.js`의 고정 비밀번호 값), 이미 예전 시드로 `planit.state`가 저장돼 있던 브라우저는 "값이 있으니" 그대로 유지돼 새 이메일로 로그인이 안 되는 문제 발견 → `state.js`에 `__seedVersion` 필드 추가, 저장된 상태의 버전이 현재 코드의 `SEED_VERSION`과 다르면 자동으로 재시드하도록 수정(수동으로 localStorage를 지울 필요 없어짐). 앞으로 시드 데이터(`data.js`/`plants.js`)를 바꿀 때마다 `SEED_VERSION`을 올려야 함.

26. **상점/구매 페이지 스켈레톤 Figma 실측 수정** — 상점(`user/store/products/index.*`, Figma 4561:1796): 스켈레톤 높이가 Figma 목업 값(77px)과 실제 `.store__item` 렌더 높이(88px)가 달라 로딩 완료 시 카드가 튀는 문제 → 88px로 통일. 타블렛 미디어 쿼리의 `margin: 0 24px`가 세로 여백을 실수로 0으로 만든 버그도 `margin: 16px 24px`로 수정. `renderSkeleton()` 호출에 모바일 여백(16+16) 기준 `width: calc(100% - 32px)`를 명시했었는데 타블렛(24+24 여백)에서 CSS margin과 겹쳐 16px만큼 넘쳐 한쪽 여백만 좁아 보이는 버그 발견("한쪽만 여백이 넓어") → 명시적 width 제거, block 기본 `width:auto`가 margin을 그대로 존중하도록 정리. 구매(`user/products/order/index.*`, Figma 4555:1723): 이미지·가격·이름 필드별로 나뉘어 있던 스켈레톤을 하나의 `[data-product-skeleton]` 블록으로 통합, "구매 후 포인트"(`remainingEl`, 86x20)에 스켈레톤이 아예 빠져있던 것 추가, 배송지 값(`addressValueEl`)에 정적 텍스트("미설정")가 baked-in 상태로 스켈레톤 클래스만 씌워져 텍스트가 그대로 비쳐 보이던 버그를 로딩 시작 시 `textContent = ""`로 비운 뒤 스켈레톤 적용하도록 수정.

27. **온보딩 컨트롤러(chevron) 크기·위치 Figma 실측 수정** — Figma "컨트롤러"(4202:845, 타블렛 4180:821 등) 실측 결과 터치 영역이 기존 구현(56x56)보다 훨씬 크고, 화면 좌우 여백 없이 가장자리에 딱 붙어 있음을 확인. `.onboarding__nav`를 Figma 실측(49x59)으로 먼저 맞췄으나 이후 사용자가 100x100으로 직접 재조정(보존). 위치는 `.onboarding__stage`가 `.onboarding`의 좌우 패딩(모바일 16px/타블렛 24px) 안쪽에 있어 그대로 두면 화면 가장자리에서 안쪽으로 들어가 보이므로, `:first-of-type{left:-16px}`/`:last-of-type{right:-16px}`(타블렛 `-24px`) 음수 마진으로 밀어내 실제 화면 가장자리에 플러시하게 붙임. 아이콘은 lucide CDN의 `{size}` prop이 무시되고 항상 24px로 렌더링되는 버그(다른 화면에서도 발견된 동일 이슈, `user/products/order/index.js` 참조)로 인해 `size:40`을 줘도 실제로는 24px로만 나오고 있었던 게 "화살표가 너무 작다"는 문제의 원인 → `{width, height}`로 직접 지정(이후 사용자 요청으로 44px까지 확대)하도록 수정.

28. **온보딩 step3 이미지 Figma 갱신분 반영** — Figma에서 step3(4164:1039, 그룹 4164:1060) 디자인이 변경되어, 프로필 화면 목업 안의 "STORE" 카드가 이전엔 화면 오른쪽 끝에서 잘려 보이던 것이 이제 완전히 화면 안에 들어오도록 수정됨 → `public/images/Onboarding_step3.png` 재추출. REST `figma_get_component_image`가 429로 막혀 `figma_execute`로 `node.exportAsync({format:"PNG", constraint:{type:"SCALE", value:N}})`를 직접 실행해 base64로 받는 우회 경로 사용. 원본과 동일한 배율(5.312, `2656/500`)로 내보내니 드롭섀도우 효과가 있는 노드 특성상 이미지 오른쪽에 어두운 노이즈/얼룩 아티팩트가 생기는 내보내기 버그 발견(scale=2는 깨끗, scale=5.312는 깨짐) → scale=4로 재시도해 아티팩트 없이 깨끗한 1135x2000 PNG 확보, 최종본으로 교체. `.onboarding__image`가 `max-height:100%` 기준으로 비율을 유지한 채 스케일하므로(§ CSS 주석 참조) 소스 픽셀 해상도가 step1/2(1573x2656)와 달라도 실제 화면에 표시되는 크기는 동일한 스테이지 높이에 맞춰져 시각적으로 일치.

29. **회원 탈퇴 인증 시간 초과 이동 도메인 오타 + Figma 미확인** — spec.md "회원 탈퇴" 6번 "인증 시간을 넘기면 도메인 /planit으로 이동한다"의 `/planit`은 실제 존재하는 라우트가 아니라(1번·3번과 같은 유형의 오타) `/user/plans/`(홈)로 해석해 구현. 전용 Figma(4589:1159)도 계속 API rate limit(429)로 실측 못 받아와 spec.md 문구 + signup 이메일 인증 스텝(§9 23번)과 동일한 컴포넌트/흐름(공용 `shared/components/input.js` 비활성화 상태로 로그인 이메일 읽기 전용 표시, 5분 타이머+연장)을 그대로 재사용해 우선 구현 — 나중에 Figma 확인되면 세부 스타일만 맞추면 됨. 이메일 인증도 signup과 동일하게 SMTP 없이 6자리 코드 대신 확인 링크 방식(`sendResignVerification`이 `emailRedirectTo: /user/auth/resign/verified`로 발송, `is_resign_verified`류 전용 RPC로 확인 여부만 조회 — signup의 `is_email_verified`는 "언젠가 한 번이라도 확인됐는지"라 이미 가입된 계정엔 항상 true라 재사용 불가, `profiles.resign_confirmed_at`을 매 시도마다 초기화→재확인하는 별도 RPC 3종 사용). 탈퇴 자체는 `delete_own_account()` RPC(`auth.users` 삭제, `profiles.id`가 `auth.users.id`에 CASCADE라 plans/orders/notifications까지 함께 삭제)로 처리, 성공 시 로그인(`/`)으로 이동.

30. **상점/구매/주문내역/회원탈퇴 도메인 — spec.md 원본 표기 vs §10 폴더 구조 재정리 후 최종 경로** — spec.md는 원본 요구사항 문서라 CLAUDE.md 방침대로 그대로 두고, 실제 채택 경로만 여기 정리한다. spec.md 안에서도 같은 화면을 가리키는 표기가 서로 갈리던 부분(예: 79번줄 `/user/store` vs 296·338번줄 `/user/store/products`)이 있었는데, §10 재정리로 그 표기 차이 자체가 무의미해졌다(전부 `/user/store/`로 통합됐기 때문).

| 화면 | spec.md 표기(라인) | 최종 채택 경로 |
|---|---|---|
| 상점 목록 | `/user/store`(79) · `/user/store/products`(296, 338) | `/user/store/` |
| 구매 | `/user/products/order/:product_id`(356, 363) | `/user/store/buy?id=` |
| 구매 완료 | `/user/order/success`(439) · `/user/order/success/order_id`(389) | `/user/store/success?orderId=` |
| 구매 완료 CTA 이동 | `/products/orders`(447, 오타 추정) | `/user/store/history` |
| 주문 내역 | `/user/profile/orders`(297) · `/user/products/orders`(312, 오타 추정) | `/user/store/history` |
| 회원 탈퇴 | `/user/auth/resign`(305, 558) | `/user/resign/` |

기존 §9 2번(주문 내역 도메인)·4번(구매 완료 이동)이 가정했던 `/user/profile/orders/`는 §10 재정리로 `/user/store/history`로 다시 한번 바뀌었다 — 2번·4번은 "그 시점" 해석 기록으로 그대로 두고, 최종 채택 경로는 이 30번을 따른다.

> 위 항목은 구현 착수 전 확정 권장.

---

## 10. 폴더 구조 재정리 — `user/` 시스템 단위 재배치 (완료, 2026-07-19)

> **실행 완료.** `git mv`로 6개 화면 파일을 이동하고, 아래 "영향 범위" 26개 파일의 경로 문자열을 전부 새 경로로 치환했다. `npm run dev`로 신규 경로(`/user/store/`, `/user/store/buy`, `/user/store/success`, `/user/store/history`, `/user/resign/`, `/user/resign/verified`) 전부 200, 구 경로 전부 404 확인 완료(§10 실행 체크리스트 참조). §2 라우팅 맵 · §3 폴더 구조 · §7 화면 흐름은 이 신규 경로 기준으로 이미 갱신돼 있다. 반면 §6(작업 TODO 로그)과 §9(확인 필요 항목 1~29번)에 나오는 `user/store/products`, `user/products/order`, `user/order/success`, `user/profile/orders`, `user/auth/resign` 등의 경로 표기는 **구현 당시 기준 히스토리**라 그대로 남겨뒀다 — 실제 이동 후에도 로그 자체는 수정하지 않는다.

### 배경 · 원칙

- `store/products`(상점 목록) · `products/order`(구매) · `order/success`(구매 완료) · `profile/orders`(주문 내역) 4개가 실제로는 "상점" 이용 흐름 하나(목록→구매→완료→내역)인데 서로 다른 최상위 폴더에 흩어져 있어, 1번 설계 원칙("코로케이션")과 어긋나 있었다.
- `auth/resign`은 하위 액션이 탈퇴 하나뿐인데 `auth/` 래퍼가 불필요하게 한 겹 더 있었다.
- 사용자가 제시한 참고 구조(메뉴/마이페이지/장바구니/주문내역처럼 화면 묶음이 곧 최상위 폴더가 되는 "시스템 단위" 배치)와 동일한 원칙을 적용해, **관련 화면을 하나의 최상위 폴더**로 모으고 불필요한 중첩 폴더(액션이 하나뿐인 폴더)는 제거한다.
- `plans/`, `calendar/`, `ranking/`, `notification/`은 이미 시스템 단위 폴더라 변경하지 않는다.

### 경로 매핑

| 시스템 | 구 URL | 구 파일 | 신규 URL | 신규 파일 |
|---|---|---|---|---|
| 상점 목록 | `/user/store/products/` | `user/store/products/index.*` | `/user/store/` | `user/store/index.*` |
| 구매 | `/user/products/order/?id=` | `user/products/order/index.*` | `/user/store/buy?id=` | `user/store/buy.*` |
| 구매 완료 | `/user/order/success/?orderId=` | `user/order/success/index.*` | `/user/store/success?orderId=` | `user/store/success.*` |
| 주문 내역 | `/user/profile/orders/` | `user/profile/orders/index.*` | `/user/store/history` | `user/store/history.*` |
| 회원 탈퇴 | `/user/auth/resign/` | `user/auth/resign/index.*` | `/user/resign/` | `user/resign/index.*` |
| 탈퇴 인증 완료 | `/user/auth/resign/verified` | `user/auth/resign/verified.*` | `/user/resign/verified` | `user/resign/verified.*` |

`구매`(구 `order`)와 `주문 내역`(구 `orders`)이 단수/복수로만 구분돼 있던 것도 이번에 `buy`/`history`로 이름을 갈라 눈으로 헷갈릴 여지를 없앴다(CLAUDE.md에 이미 기록된 `/user/plants/` vs `/user/plans/` 류 오타 문제와 같은 유형의 위험을 사전 제거).

### 영향 범위 (경로 문자열을 참조 중인 파일, grep 확인 완료 · 26개)

**상점 관련 경로 참조**
`shared/js/api.js`, `shared/components/purchase-sheet.js`, `shared/components/nav-drawer.js`, `user/plans/onboarding.js`, `user/calendar/index.css`(주석 언급뿐), `user/profile/index.js`, `admin/orders/index.js`, `admin/products/index.js`, 그리고 이동 대상 자신인 `user/store/products/index.{html,css,js}` · `user/products/order/index.{html,css,js}` · `user/order/success/index.{html,css,js}` · `user/profile/orders/index.{html,css,js}`

**회원 탈퇴 경로 참조**
이동 대상 자신인 `user/auth/resign/index.{html,css,js}` · `user/auth/resign/verified.{html,css,js}`

### 실행 체크리스트 (완료)

1. [x] `git mv`로 위 6개 화면의 파일 이동/이름변경(히스토리 보존) — `store/products/index.*` → `store/index.*`, `products/order/index.*` → `store/buy.*`, `order/success/index.*` → `store/success.*`, `profile/orders/index.*` → `store/history.*`, `auth/resign/*` → `resign/*`. 이제 빈 폴더가 된 `user/store/products/`, `user/products/`, `user/order/`, `user/profile/orders/`, `user/auth/`는 삭제
2. [x] 각 이동한 `.html`의 `<script type="module" src="...">` / `<link rel="stylesheet" href="...">` 경로 수정
3. [x] 위 "영향 범위"의 26개 파일에서 구 경로 문자열(`/user/store/products`, `/user/products/order`, `/user/order/success`, `/user/profile/orders`, `/user/auth/resign`) 전부 치환 — 기능 경로(`location.href`, nav-drawer 메뉴, 프로필 링크, `shared/js/api.js`의 `emailRedirectTo`)와 주석 모두 갱신. `user/store/history.*`·`user/store/success.js`에 남은 "profile/orders" 문자열 2건은 Figma 프레임 이름/과거 해석을 가리키는 인용이라 의도적으로 유지
4. [x] `npm run dev` + `curl`로 신규 경로 6개(`/user/store/`, `/user/store/buy`, `/user/store/success`, `/user/store/history`, `/user/resign/`, `/user/resign/verified`) 200 응답, 구 경로 5개 404 응답 확인. 이동된 `.js`/`.css` 정적 서빙과 `node --check` 문법 검사도 통과. 로그인이 필요한 실제 클릭 흐름(구매 완료→주문내역, 탈퇴 이메일 링크 등)은 이번 검증 범위 밖 — 다음 로그인 세션에서 수동 확인 권장
5. [ ] **Supabase 대시보드 확인 필요**: `sendResignVerification`의 `emailRedirectTo`가 `/user/auth/resign/verified` → `/user/resign/verified`로 바뀌었다. Authentication > URL Configuration > Redirect URLs 허용 목록이 와일드카드(`/user/**`)가 아니라 구 경로를 정확히 등록해뒀다면 여기도 갱신해야 실제 탈퇴 인증 메일 링크가 동작한다
6. [ ] 관리자(`admin/orders`, `admin/products`)는 경로 문자열만 주석에 있었고 기능 참조는 없어 실사용 여정 확인은 낮은 우선순위 — 필요 시 수동 확인

### 10-1. 주소 저장 Supabase 이전 (완료, 2026-07-19)

`planit.address`(localStorage) → `profiles.address`/`profiles.address_detail` 컬럼(마이그레이션 `add_profile_address_columns`)으로 이전. 다른 사용자 데이터(`points`/`planet_id`)와 동일하게 RLS로 로그인 계정에 귀속되므로, 다른 브라우저/기기에서 재로그인해도 저장한 주소가 유지되고 같은 브라우저를 여러 계정이 공유해도 주소가 계정 간에 섞이지 않는다. `shared/js/api.js`의 `getAddress()`/`saveAddress()`/`clearAddress()`가 localStorage 대신 `profiles` 테이블을 조회/갱신하도록 교체됐고, 반환/인자 형태(`{ address, detail }`)는 그대로라 호출부(`user/store/buy.js`)는 수정하지 않았다.
