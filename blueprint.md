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
  - 일정 수정: `/user/plans/edit.html?planId=45`
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
| `/user/plans/` | 홈 | `user/plans/index.html` | 헤더 | `?date=` (선택) |
| `/user/plans/add.html` | 일정 추가 | `user/plans/add.html` | 앱바 | |
| `/user/plans/edit.html` | 일정 수정 | `user/plans/edit.html` | 앱바 | `?planId=` |
| `/user/plans/success.html` | 일정 완료 ※ | `user/plans/success.html` | 앱바 | `?points=` |
| `/user/calendar/` | 캘린더 | `user/calendar/index.html` | 헤더 | |
| `/user/ranking/` | 랭킹 | `user/ranking/index.html` | 헤더 | |
| `/user/notification/` | 알림 | `user/notification/index.html` | 앱바 | |
| `/user/profile/` | 프로필 | `user/profile/index.html` | 헤더 | |
| `/user/profile/orders/` | 주문 내역 ※ | `user/profile/orders/index.html` | 헤더 | |
| `/user/store/products/` | 상점 | `user/store/products/index.html` | 헤더 | |
| `/user/products/order/` | 구매 | `user/products/order/index.html` | 앱바 | `?id=` (제품) |
| `/user/order/success/` | 구매 완료 | `user/order/success/index.html` | 앱바 | `?orderId=` |
| `/user/auth/resign/` | 회원 탈퇴 | `user/auth/resign/index.html` | 헤더 | |
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
    │       └── index.js
    │
    ├── 👤 고객
    │   └── user/
    │       │
    │       ├── plans/                     # 홈 & 일정
    │       │   ├── index.html             # 홈 (/user/plans/)
    │       │   ├── index.css
    │       │   ├── index.js
    │       │   ├── add.html               # 일정 추가 (/user/plans/add.html)
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
    │       ├── profile/                   # 프로필 (/user/profile/)
    │       │   ├── index.html · index.css · index.js
    │       │   └── orders/                # 주문 내역 (/user/profile/orders/)
    │       │       ├── index.html · index.css · index.js
    │       │
    │       ├── store/
    │       │   └── products/              # 상점 (/user/store/products/)
    │       │       ├── index.html · index.css · index.js
    │       │
    │       ├── products/
    │       │   └── order/                 # 구매 (/user/products/order/?id=)
    │       │       ├── index.html · index.css · index.js
    │       │
    │       ├── order/
    │       │   └── success/               # 구매 완료 (/user/order/success/?orderId=)
    │       │       ├── index.html · index.css · index.js
    │       │
    │       └── auth/
    │           └── resign/                # 회원 탈퇴 (/user/auth/resign/)
    │               ├── index.html · index.css · index.js
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
            │   ├── data.js                # 목 데이터 (일정/제품/랭킹/알림/주문)
            │   ├── api.js                 # 목 API (성공/실패/지연 시뮬레이션 · 실패 시 /timeout 이동)
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
                └── wheel-picker.js / wheel-picker.css
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
| **input** | `createInput(opts)` | 안내문구 / 포커스 강조 / blur 유효성 / 검증성공 색상 / 실패 error 테두리+오류문구 |
| **cta-button** | `createCtaButton(opts)` | 기본 비활성→조건 충족 시 활성 / 요청중 스피너 / 성공·실패 토스트 |
| **toast** | `showToast(msg, type)` | `#toast-root`에 성공/실패 토스트 |
| **skeleton** | `renderSkeleton(el, variant)` | 첫 진입 로딩 영역 |
| **stepper** | `mountStepper(el, {step, total})` | 회원가입 3단계 표시 |
| **wheel-picker** | `openWheelPicker(opts)` | 시(00~23)·분(00~59) / 연·월·일(월별 일수 반영) |

---

## 5. 상태 관리 (localStorage 키 규약)

MPA라 메모리 상태가 페이지마다 초기화되므로, 아래 키로 공유한다.

| 키 | 용도 |
|---|---|
| `planit.auth` | 로그인 토큰/유저 정보 (없으면 가드가 `/`로 보냄) |
| `planit.onboarded` | 홈 최초 진입 온보딩 노출 여부 |
| `planit.address` | 저장된 배송 주소지 (구매 페이지 프리필) |
| `planit.plans` | (목 단계) 일정 데이터 캐시 |
| `planit.orders` | (목 단계) 주문 데이터 캐시 |

---

## 6. 작업 TODO (빌드 순서)

### 1단계: 공유 자원 · 환경
- [x] 정적 서버 실행 확인 — `npm run dev` (`scripts/dev-server.js`, src/+public/ 병합 서빙, 기본 포트 3000)
- [x] `shared/css/variables.css` — 전역 변수, 리셋 (Figma 폰트 시스템 4111:853 기준 컬러·타이포 토큰 반영)
- [x] `shared/css/layout.css` — 헤더/앱바/레이아웃 공통 (mount point 셸 배치만, 컴포넌트별 스타일은 shared/components/*.css)
- [x] `shared/js/utils.js` — `toISODate`, `getWeekDates`, `formatFullDateLabel`, `storage` 래퍼 구현. `requireAuth`/`getQuery`/`navigate`는 아직 (인증 가드 붙일 때 추가)
- [x] `shared/js/data.js` — 목 일정 데이터 (오늘/내일 날짜 기준 동적 생성)
- [x] `shared/js/api.js` — `getPlansByDate`(고정 항목 상단 정렬, 고정 2개 이상이면 그 안에서도 시간 오름차순), `setPlanDone`(id, done — 체크 시 로컬 낙관적 업데이트와 값이 어긋나지 않도록 내부에서 toggle 하지 않고 호출측이 정한 값을 그대로 저장), `pinPlan`(다중 고정 허용), `deletePlan` (지연 시뮬레이션만, 실패·`/timeout/` 이동 케이스는 아직)

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
- [x] `index.*` (로그인) — 이메일·비번 입력, 눈 아이콘, 유효성, 성공→`/user/plans/` / 회원가입 이동. Figma 기본(4001:44)·입력창 활성화(4006:955)·검증(4006:989)·에러(4434:1479)·타블렛(4146:1040) 기준. 실패 시 입력값 유지 + 두 입력창 빨간 테두리 + 인라인 에러 문구 + CTA 재비활성화. 선행 작업으로 `shared/components/input.*`, `cta-button.*` 공통 컴포넌트 구현. 목 로그인(`mockLogin`)은 `shared/js/api.js` 생기면 교체 필요
- [ ] `signup/index.*` — 스텝퍼 3-step(①닉네임+중복확인 ②이메일 인증+5분 타이머+연장 ③비번+확인) + 완료 화면
- [ ] `user/auth/resign/index.*` — 이메일 인증 후 탈퇴, 시간초과 시 이동

### 4단계: 홈 & 일정
- [x] `user/plans/index.*` (1차) — Figma 일정-기본(4066:724)/리스트(4005:67)/스켈레톤(4095:444) 기준. 다음 일정 제목(완료 안 된 항목 중 가장 이른 시간, 없으면 "일정을 추가해 주세요!") / 금주 월~일 날짜 선택 클릭 시 해당 날짜 데이터 재조회 / 날짜별 목록(시간 오름차순) / 체크박스로 완료 토글 / 전체완료 시 "일정 완료!" CTA → `success.html`. `empty_list.png`는 선택한 날짜에 일정이 0개일 때만 표시
  - [x] 더보기(⋮) → 고정·수정·삭제 바텀시트 연동. 고정=상단 정렬(다중 고정 가능, 2개 이상이면 시간 오름차순 재정렬), 삭제=목록에서 제거, 수정=`/user/plans/edit.html?planId=` 이동(페이지는 아직 없음). 고정된 항목은 제목 옆에 빨간 점(Figma 4007:232 실측 `#eb0000`) 표시
  - [ ] 최초 진입 온보딩 3-step
  - [ ] `?date=` 쿼리스트링 연동 (현재는 클릭 시 메모리 상태만 갱신, URL 미반영)
  - [ ] `requireAuth` 가드 (로그인 성공 시 토큰 저장 로직도 아직 없음)
- [ ] `user/plans/add.*` — 일정 입력, 시간·시작일·종료일·주기(휠피커 바텀시트), 유효성(종료≥시작)
- [ ] `user/plans/edit.*` — add 로직 재사용 + `?planId=` 프리필
- [x] `user/plans/success.*` — 완료 일러스트(`good_titi.png`) + 지급 포인트(`?points=`, 완료 개수×10) 카운트업 애니메이션(아래→위 등장 후 위로 사라짐) → CTA로 `/user/profile/` 이동. 전용 Figma "/plans/success"(4006:940) 반영 완료 — §9 참조

### 5단계: 캘린더
- [x] `user/calendar/index.*` — Figma 캘린더-기본(4107:736)/캘린더-리스트(4006:1076)/캘린더-바텀시트(4008:405) 반영. 화살표로 월 이동, 날짜 클릭 시 선택 표시(주조색 원)+하단 패널 갱신. 하단 "선택일 일정" 패널은 모달이 아니라 화면 하단에 항상 고정(fixed)돼 있는 독(dock)형 패널(전용 컴포넌트 없이 이 페이지 CSS/JS에 직접 구현, `#overlay-root`/`.bottom-sheet`와 동일하게 `left/right:0 + max-width + margin:auto`로 데스크탑 600px 중앙 정렬 유지) — 핸들(초록 반투명 pill)을 포인터 드래그하면 높이를 조절할 수 있다(spec.md "바텀 시트 - 공통 UI" 9번), 최대 높이는 `100vh - 헤더 높이`로 캡을 둬서 늘려도 헤더 영역은 절대 침범하지 않는다. 더보기(⋮)는 홈과 동일하게 `shared/components/bottom-sheet.js`의 `openListBottomSheet`(고정/수정/삭제)를 그대로 재사용 — Figma 4008:405가 홈의 "일정 - 바텀 시트"와 동일 레이아웃이라 별도 컴포넌트 불필요. 페이지 배경은 다른 화면과 달리 흰색이 아니라 `--color-calendar-bg`(#f9f9f9, 4107:736 실측) — `user/products/order`와 동일한 패턴으로 이 페이지 CSS에서 `body` 배경을 오버라이드하고, 헤더도 이 페이지에서만 투명 처리(`.header{background:transparent}`)해 캘린더/바텀시트와 하나로 이어지는 배경처럼 보이게 함

### 6단계: 상점 · 구매 · 주문 내역
구매완료/주문내역 2개 화면은 전용 Figma 프레임을 API rate limit(429)로 끝내 못 받아와
spec.md 텍스트 + 기존 디자인 토큰/컴포넌트 언어로 구현 — §9 참조. 스토어(4278:843)·구매
(4293:1252 등)는 이후 Desktop Bridge 플러그인 경로(로컬, REST API 우회)로 실측 확보해 반영.
- [x] `user/store/products/index.*` — Figma "/store"(4278:843) 반영: 아이콘(`store_icon.png`)+"스토어" 타이틀(24px) → "나의 포인트" 라벨+회색 필(pill) 배경의 포인트 값 → 단일 열 상품 리스트(썸네일 80×80 + 카테고리/이름/가격, 가격은 초록 원형 "P" 배지+검정 숫자). 카테고리는 spec.md의 "씨앗·식물·묘목"이 아니라 Figma 실측 "나무"/"다육식물" 2종을 그대로 사용(§9), 상품 7종·가격·이미지 매핑(나무=`tree3.png`/`tree2.png`, 다육식물=`tree1.png`)도 Figma 그대로. 행 클릭 시 구매 확인 바텀시트 → `order/index.html?id=`
  - [x] 타블렛(≥600px) 리스트 항목(4324:1295 실측) — 카테고리/이름 묶음(`.store__item-info`)과 가격을 세로로 쌓지 않고 한 행에서 좌우 끝으로 배치(`justify-content:space-between`), 가격도 모바일보다 크게(배지 15→17px, 숫자 12→16px medium)
  - [x] 구매 확인 바텀시트(4278:893 "구매창" 실측) — 실측 결과 제목/X 헤더가 아예 없는 레이아웃(이름+잔여포인트 줄 / CTA / 안내문구만 존재)이라 공용 `shared/components/bottom-sheet.js`를 쓰지 않고 전용 컴포넌트 `shared/components/purchase-sheet.js`(+`.css`)로 구현 — 상점 목록과 구매 페이지 양쪽에서 재사용(아래 참조). 배경 블러+딤/외부 클릭·Esc 닫힘/아래→위 슬라이드는 공용 바텀시트와 동일하게 유지. "결제 후 포인트 N"은 주황 원형 "P" 배지(`--color-accent`), CTA 버튼은 `createCtaButton` 재사용, 버튼 아래 "주문 내용을 확인 하였으며, 정보 제공 등에 동의 합니다." 안내 문구. `onConfirm`이 `{ok:false}` 반환 시 에러 토스트+유지(bottom-sheet.js와 동일 규약), `onClose` 콜백으로 호출측이 트리거 상태(체크박스 등)를 되돌릴 수 있음
- [x] `user/products/order/index.*` — Figma "상점 - 구매"(4293:1252 기본) / 주소지 입력 활성화(4295:1489) / 구매 동의 체크(4295:1464) 반영. 앱바 타이틀은 제품명이 아니라 고정 문구 "결제", 제품 정보는 가격(20px semibold 검정)이 이름(14px regular) 위에 옴(다른 화면과 반대 순서). 카드 3개(흰 배경, `--color-card-border` 테두리, radius12): ①MY 포인트(다크그레이 원형 "P" 배지) ②주소지(기본 없음 4295:1338/값 있음 4295:1369 모두 접힌 카드 테두리는 회색 유지, 꺽쇠로 입력폼 토글 — 펼쳐도 카드 테두리는 회색이다가 입력창에 포커스가 들어갈 때만(4295:1489) 카드 전체 테두리가 초록으로 바뀜(`:focus-within`, JS 상태 불필요). 공용 `input-field`가 그대로 focus/valid 색상과 일치해 입력창 자체는 별도 스타일 불필요. "주소지 저장" 클릭 시 `planit.address`(localStorage)에 저장 — 페이지를 새로고침해도 유지되고 다음 방문 시 프리필) ③구매 동의(원형 체크박스+굵은 제목이 곧 토글 버튼, 체크 시 원 배경 회색→초록/사용 포인트 값 회색→초록, **체크하는 순간** 구매 바텀시트가 배경 딤 없이 열림 — `purchase-sheet`를 `backdrop:false`로 재사용, 사용자 요청). 페이지 배경은 다른 화면과 달리 흰색이 아니라 `--color-order-bg`(#f8f9fb) — 이 페이지 CSS에서 `body` 배경 자체를 오버라이드(페이지별 stylesheet라 다른 화면엔 영향 없음)하고 `.app-bar`는 투명 처리해 앱바 영역까지 같은 배경색 하나로 이어지게 함. `createOrder()` 성공 시 `../../order/success/index.html?orderId=`
- [x] `user/order/success/index.*` — Figma "구매 완료"(4295:1520) 반영: 안내 문구 "구매 완료!" + 일러스트(`smile_titi.png`, 피사체가 중앙이라 오프셋 보정 불필요) → CTA "주문 내역 확인하기"로 `/user/profile/orders/` 이동(§9 "구매 완료 이동" 항목과 동일한 해석). 라벨은 실제로는 "구매 내역 확인"이지만 주문내역 페이지 이동 흐름과 맞춰 기존 문구 유지
  - [x] **버그 수정**: 모바일에서 CTA가 화면 오른쪽으로 16px 밀려나가던 문제 — `.cta-button`(공용, `width:100%`)과 `position:fixed;left:16px;right:16px`를 같이 쓰면 `width:100%`가 뷰포트 기준으로 먼저 계산되면서 `right`가 무시돼 버림. `width:auto`를 추가로 얹어야 left/right 사이 폭으로 재계산됨 — `plan-success__cta`(일정 완료)에도 동일한 버그가 있어 같이 수정. 이 "고정 CTA + left/right 16px" 패턴을 새로 쓸 때는 항상 `width:auto`를 같이 넣을 것
- [x] `user/profile/orders/index.*` — Figma "profile/orders"(4376:1786) 반영. "나의 포인트" 바는 상점과 동일한 라벨+초록 필(pill), "주문 내역 N건" 타이틀(18px semibold + 초록 건수). 카드(흰 배경, `--color-card-border`): 상태 행(`lucide/Info` 아이콘 + 상태 텍스트 — 주문 접수 중은 `--color-accent`, 취소 접수 중은 `--color-error`, 주문 배송 중은 `--color-primary`, 배송중 색상은 실측 예시가 없어 팔레트 흐름상 추정) → 제품(가격 20px semibold이 이름 위, 구매 페이지와 동일 순서) → 구분선 → "사용 후 포인트" 박스 → "주문 취소" 버튼. **주문 취소 버튼은 "주문 접수 중"일 때만 활성화**(진한 초록), 취소 접수 중·주문 배송 중이면 비활성화(`--color-primary-disabled-bg` — 연한 초록, 실측 색상 값과 정확히 일치, 사용자 지정 규칙) → 주문 취소 모달(`openModal`) 확인 시 `cancelOrder()`로 상태 전환

### 7단계: 프로필 & 드로워
- [x] `user/profile/index.*` — Figma "/profile"(4007:187) 기준. 행성 캐릭터(기본:지구, `front_titi.png`)·닉네임·이메일(스켈레톤) + 포인트/STORE/주문내역 카드(`store_icon.png`/`truck.png`, `--color-page-bg` 배경) + 세팅 리스트(로그아웃 모달·행성변경/약관/개인정보 드로워·계정탈퇴 이동·버전). "계정 탈퇴" 행은 Figma에서 `visible:false`였지만 spec.md 명시 요구사항이라 포함 — §9 참조
- [x] 행성 변경 / 이용 약관 / 개인 정보 처리 방침 드로워 — `content-drawer` 공통 컴포넌트로 구현. 행성 컬렉션은 현재 목데이터상 지구(`front_titi.png`)·달(`moon.png`) 2종만 존재 — §9 참조. 약관/개인정보 본문은 정의서에 실제 문구가 없어 플레이스홀더 텍스트로 채움

### 8단계: 랭킹 & 알림
- [ ] `user/ranking/index.*` — 1~3등, 내 순위, 전체 순위 목록, 공유하기(오픈그래프 메타)
- [ ] `user/notification/index.*` — 알림 리스트(완료 시 비활성), 클릭 → `/user/plans/`

### 9단계: 에러 페이지
- [ ] `404/index.*` — 일러스트 + 홈 이동 (서버 미매칭 fallback 설정)
- [ ] `timeout/index.*` — 일러스트 + 이전 도메인 이동

### 10단계: 관리자
- [ ] `admin/orders/index.*` — 주문 개수, 주문 테이블(고객·상품·번호·상태·주소지), 배송/취소 모달
- [ ] `admin/products/index.*` — 제품 목록, 추가 폼 / 수정 폼(프리필) / 삭제

---

## 7. 화면 흐름 (핵심 여정)

```
로그인(/) → 홈(/user/plans/) → 일정 추가(add.html) → 수행(체크) → 전체 완료
      → 일정 완료(success.html?points=) → 프로필(/user/profile/)
      → 상점(/user/store/products/) → 제품(order/?id=) → 구매
      → 구매 완료(order/success/?orderId=) → 주문 내역(/user/profile/orders/)
```

---

## 8. 데이터 모델 (목 데이터 초안)

- **User**: `{ nickname, email, points, planet }` — `shared/js/data.js`의 `user` 목데이터로 구현
- **Planet**: `{ id, name, image }` — `shared/js/data.js`의 `planets` 목데이터. 현재 지구/달 2종만 존재(§9)
- **Plan**: `{ id, title, time, startDate, endDate, repeat(당일·매일·매주·격주·매월·매년), done, pinned }`
- **Product**: `{ id, name, price, category(씨앗·식물·묘목), image }` — `shared/js/data.js`의 `products` 목데이터(3종)
- **Order**: `{ id(8자리), productId, status(주문 접수 중·취소 접수 중·주문 배송 중), pointsUsed, remainingAfter, address }` — `shared/js/data.js`의 `orders` 목데이터. `remainingAfter`는 주문 직후 시점의 잔여 포인트 스냅샷(주문 내역 화면 표시용), `createOrder()`가 생성 시점에 기록
- **Ranking**: `{ rank, nickname, points }`
- **Notification**: `{ id, planId, message, active }`

---

## 9. 확인 필요 항목 (정의서 내 표기 불일치)

1. **일정 완료 도메인** — 본문 `/user/plants/success` vs 흐름 `/user/plans/success` → `plans`로 가정(오타)
2. **주문 내역 도메인** — 섹션 헤더 `/user/products/orders` vs 프로필 버튼 `/user/profile/orders` → `/user/profile/orders`로 가정
3. **로그인 성공 이동** — `/index`로 기재되나 실제 홈은 `/user/plans` → `/user/plans/`로 해석
4. **구매 완료 이동** — CTA가 `/products/orders`로 기재 → `/user/profile/orders/`로 해석
5. **일정 완료 이동** — CTA가 `/profile`로 기재 → `/user/profile/`로 해석
6. **상점 사용자 흐름** — MVP 정의서 "상점" 흐름이 "랭킹" 흐름과 동일하게 복붙된 오류 → 재정의 필요
7. **타블렛 브레이크포인트 폭** — 정의서·Figma 모두 타블렛은 "최소 높이 600px"만 명시, 폭 기준 없음. Figma "나브" 타블렛 프레임(4146:1022) 실측 폭이 600px라 `--breakpoint-tablet: 600px`로 가정해 `nav-drawer.css`에 반영함 → 실제 타블렛 폭 기준(예: 768px 등) 확정 필요
8. **입력창 텍스트 크기** — "폰트 시스템"(4111:853) 프레임의 콘텐츠/어시스트 텍스트는 14px로 정의됐지만, 로그인 화면(4001:44 등) 실제 입력창의 placeholder·입력값은 12px로 그려져 있음 → `--font-size-input: 12px`로 별도 토큰을 두고 실측값을 따름. 의도적 축소인지 확인 필요
9. **헤더 로고 표기** — 재사용 컴포넌트(4132:588)의 헤더 워드마크가 모바일은 "PLAN !T", 타블렛은 "PLAN T!T"로 다르게 적혀 있음(오타로 추정) → `header.js`는 두 브레이크포인트 모두 "PLAN !T"로 통일해 구현. 실제 의도 확인 필요
10. ~~**종 아이콘 소스**~~ → 사용자 요청으로 확정: `header.js`에서 lucide `Bell` 대신 Figma 원본 그대로 solar 아이콘셋(`solar:bell-outline`)을 사용. 빌드 스텝 없이 CDN ESM(`iconify-icon@2.1.0/+esm`)으로 Iconify 웹 컴포넌트를 불러와 `<iconify-icon icon="solar:bell-outline">`로 렌더링(CLAUDE.md "아이콘" 섹션에 예외로 명시). 다른 아이콘은 계속 lucide 사용
11. **로그인 실패 안내 방식** — ~~spec.md는 "실패 토스트를 띄운다"고 적혀 있지만, 로그인 에러 화면(4434:1479) 캡처에는 토스트 없이 인라인 문구만 보여 처음엔 인라인 문구만 구현했었음~~ → 이후 재사용 컴포넌트(4132:588)에 에러 토스트("요청에 실패 했습니다.")가 추가돼 **인라인 문구 + 토스트 둘 다** 띄우는 것으로 확정. 입력값은 지우지 않고 유지, 두 입력창 빨간 테두리, CTA 버튼은 실패 후 다시 비활성(연한 초록) 상태로 돌아가 사용자가 값을 수정해야 재시도 가능. 다른 실패 케이스(회원가입 등)에도 이 패턴(인라인+토스트 동시)을 적용
12. ~~**일정 완료 화면 디자인 부재**~~ → 전용 Figma "/plans/success"(4006:940) 확보돼 반영 완료. 확정 사항: 제목은 `--font-family-brand`(Gmarket Sans) 36px, 안내 문구는 한 줄("포인트를 지급 했어요!", 16px medium, `--color-primary`) — spec.md의 2번째 문장("포인트를 모아서...")은 Figma에 없어 제외, CTA 라벨은 "포인트 확인 하기"(공백 포함, 기존 임의 문구 대체), 지급 포인트는 "+ N POINT" 형식·`--color-accent`·Gmarket Sans 20px. 이미지 영역: 원본 `good_titi.png`의 피사체(지구본)가 캔버스 중앙보다 오른쪽에 있어 Figma도 컨테이너 폭 기준 좌측 10.1333%(38/375) 오프셋·70.9333%(266/375) 폭으로 배치(정중앙 아님) — `%` 기반으로 구현해 화면 폭이 달라져도 동일 비율 유지
13. **행성 변경/이용약관/개인정보 드로워 전용 Figma 미확인** — 프로필(4007:187)은 확보했지만 이 3개 드로워는 Figma API rate limit(429)로 프레임을 못 받아옴 → spec.md 텍스트만으로 `content-drawer`(앱바 톤 헤더+콘텐츠) 공통 셸을 만들어 구현. 행성 컬렉션은 `public/images`에 실제로 존재하는 행성류 이미지가 `front_titi.png`(지구)·`moon.png`(달) 2종뿐이라 이 둘로만 구성 — 실제 Figma 프레임/추가 행성 에셋 확보되면 교체·확장 필요. 이용약관/개인정보 처리방침 본문도 정의서에 실제 문구가 없어 플레이스홀더 텍스트로 채움
14. **데스크탑(600px 초과) 뷰** — Figma "데스크탑"(4159:806) 기준으로 확정: `body`는 600px 카드로 고정, 바깥 캔버스는 `--color-page-bg`(#f7f7f7, html에 적용), 카드 그림자는 `#overlay-root`에 `box-shadow: 0 0 4px rgba(0,0,0,.09)`. Figma의 "qr 영역"(4405:1251, 139×128, 흰 배경 + `--color-qr-border` 테두리, radius 5)은 카드 왼쪽 아래 여백에 `#desktop-qr`로 배치했지만 **내용은 비워둠** — 추후 모바일 접속용 QR 이미지를 이 안에 넣을 예정. 카드와 겹치지 않을 최소 폭(`min-width:960px`)에서만 노출

15. ~~**상점 전용 Figma 미확인**~~ → REST API가 계속 rate limit(429)이었지만, Figma Desktop에 Desktop Bridge 플러그인이 연결돼 있어 `figma_capture_screenshot`/`figma_execute`(플러그인 로컬 실행, REST 안 거침)로 "/store"(4278:843) 실측 확보해 반영 완료. 카테고리는 spec.md "씨앗·식물·묘목"이 아니라 실측 "나무"/"다육식물" 2종, 상품 7종(사철 나무 묘목·구슬 얽이·고스티×2·사과 나무 묘목·오육 나무 묘목·달랑 나무 묘목)·가격·이미지 매핑 모두 실측 그대로.
16. ~~**구매 전용 Figma 미확인**~~ → Desktop Bridge 플러그인 경로(`figma_execute`, REST 우회)로 기본(4293:1252)/주소지 입력 활성화(4295:1489)/구매 동의 체크(4295:1464) 3개 상태 모두 확보해 반영 완료.
17. ~~**주문내역 전용 Figma 미확인**~~ → `figma_execute`로 "profile/orders"(4376:1786) 확보해 반영 완료(위 6단계 체크리스트 참조).
18. **구매완료 전용 Figma 미확인** — 이 화면은 여전히 전용 프레임을 못 받아와 spec.md 텍스트 + 기존 디자인 언어로 구현. 15·16·17번과 같이 Figma Desktop에 파일이 열려 있고 플러그인이 연결된 상태라면 `figma_execute`로 재시도 가능.

> 위 항목은 구현 착수 전 확정 권장.
