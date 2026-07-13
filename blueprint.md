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
- **공통 자원은 루트 절대경로(`/shared/...`, `/fonts/...`, `/images/...`)로 참조**한다. 폴더가 3단계까지 깊어져 상대경로(`../../../`)가 지저분해지므로, **`public/` 폴더를 정적 서버 루트로 서빙**하는 것을 전제로 한다.
  - 즉 `index.html`, `signup/`, `user/`, `admin/`, `shared/`, `404/`, `timeout/` 등 사이트에 필요한 모든 파일은 **`public/` 안**에 위치해야 한다. (`public/fonts`, `public/images`는 이미 존재)
- **정적 서버 필수.** ES module `import`와 `fetch`는 `file://`에서 동작하지 않는다.
  - VS Code **Live Server**(`public/`을 루트로 지정), 또는 `python3 -m http.server`(작업 디렉터리를 `public/`으로), 또는 `npx serve public` 중 택1.
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
  <script type="module" src="/user/plans/index.js"></script>  <!-- 페이지 전용 JS -->
</body>
</html>
```

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
└── public/                             # 정적 서버 루트 (Live Server / serve 를 이 폴더로 지정)
    │
    ├── index.html                        # 로그인 (/)
    ├── index.css
    ├── index.js
    │
    ├── 🔤 폰트 (루트 절대경로 /fonts/... 로 참조)
    │   └── fonts/
    │       ├── Pretendard-*.woff2         # Thin~Black 9종 (본문 기본 폰트)
    │       └── GmarketSans*.otf            # Light/Medium/Bold (로고·브랜드 텍스트 전용)
    │
    ├── 🖼️ 이미지 (루트 절대경로 /images/... 로 참조)
    │   └── images/
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
                ├── modal.js / modal.css
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
| **bottom-sheet** | `openBottomSheet(opts)` | X·외부영역 닫힘 / 아래→위 애니메이션 / 항목 강조 / 기본값 없으면 CTA 비활성 / 요청중 스피너 / 성공→닫고 토스트, 실패→유지+토스트 / 핸들 높이 조절 |
| **modal** | `openModal(opts)` | X·취소·외부영역 닫힘 / 실패 시 에러 토스트 |
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
- [ ] 정적 서버 실행 확인 (Live Server / `python3 -m http.server`)
- [x] `shared/css/variables.css` — 전역 변수, 리셋 (Figma 폰트 시스템 4111:853 기준 컬러·타이포 토큰 반영)
- [x] `shared/css/layout.css` — 헤더/앱바/레이아웃 공통 (mount point 셸 배치만, 컴포넌트별 스타일은 shared/components/*.css)
- [ ] `shared/js/utils.js` — `requireAuth`, `getQuery`, `navigate`, 날짜·포인트 포맷, storage 래퍼
- [ ] `shared/js/data.js` — 목 데이터
- [ ] `shared/js/api.js` — 목 API (지연·실패 시 `/timeout/` 이동)

### 2단계: 공통 UI 컴포넌트 (ES 모듈)
- [ ] `header` / `app-bar`
- [x] `nav-drawer` — Figma 나브 모바일(4007:333)/타블렛(4146:1022) 기준 1차 구현 (`shared/components/nav-drawer.css`, `.js`). header.js에서 `openNavDrawer()` 호출로 연동 예정
- [ ] `bottom-sheet` / `modal`
- [x] `toast` — 로그인 실패 토스트 등에서 사용 (`shared/components/toast.css`, `.js`)
- [x] `input` — 로그인 이메일/비밀번호 입력창 기준 구현, 눈 아이콘 토글 포함 (`shared/components/input.css`, `.js`)
- [x] `cta-button` — 비활성/활성/로딩(점 3개) 상태 구현 (`shared/components/cta-button.css`, `.js`)
- [ ] `skeleton` / `stepper` / `wheel-picker`
- [ ] **보일러플레이트 HTML 템플릿** 확정 (mount 지점 `#header`/`#nav-drawer`/`#app`/`#toast-root`/`#overlay-root`)

### 3단계: 인증
- [x] `index.*` (로그인) — 이메일·비번 입력, 눈 아이콘, 유효성, 성공→`/user/plans/` / 회원가입 이동. Figma 기본(4001:44)·입력창 활성화(4006:955)·검증(4006:989)·타블렛(4146:1040) 기준. 선행 작업으로 `shared/components/input.*`, `cta-button.*`, `toast.*` 공통 컴포넌트 구현. 목 로그인(`mockLogin`)은 `shared/js/api.js` 생기면 교체 필요
- [ ] `signup/index.*` — 스텝퍼 3-step(①닉네임+중복확인 ②이메일 인증+5분 타이머+연장 ③비번+확인) + 완료 화면
- [ ] `user/auth/resign/index.*` — 이메일 인증 후 탈퇴, 시간초과 시 이동

### 4단계: 홈 & 일정
- [ ] `user/plans/index.*` — 다음 일정 / 금주 날짜 선택(`?date=`) / 날짜별 목록(시간 오름차순) / 체크박스 완료 / 더보기 바텀시트(고정·수정·삭제) / 전체완료 시 완료 CTA → `success.html` / **최초 진입 온보딩 3-step**
- [ ] `user/plans/add.*` — 일정 입력, 시간·시작일·종료일·주기(휠피커 바텀시트), 유효성(종료≥시작)
- [ ] `user/plans/edit.*` — add 로직 재사용 + `?planId=` 프리필
- [ ] `user/plans/success.*` — 완료 일러스트 + 지급 포인트(`?points=`) 애니메이션 → 프로필 이동

### 5단계: 캘린더
- [ ] `user/calendar/index.*` — 월 이동, 날짜 선택, 선택일 일정 바텀시트(핸들 높이 조절), 더보기(고정·수정·삭제)

### 6단계: 상점 · 구매 · 주문 내역
- [ ] `user/store/products/index.*` — 내 포인트, 제품 목록(씨앗·식물·묘목), 구매 확인 바텀시트 → `order/?id=`
- [ ] `user/products/order/index.*` — 제품 정보(`?id=`), 주소지 입력·저장, 구매 동의 체크 → 구매 바텀시트 → `success/?orderId=`
- [ ] `user/order/success/index.*` — 구매 완료 → 주문 내역 이동
- [ ] `user/profile/orders/index.*` — 내 포인트, 주문 내역(접수중·취소접수중·배송중), 주문 취소 모달

### 7단계: 프로필 & 드로워
- [ ] `user/profile/index.*` — 행성 캐릭터(기본:지구)·닉네임·이메일, 포인트, 상점·주문내역 이동, 세팅(로그아웃 모달·행성변경·약관·개인정보·탈퇴·버전)
- [ ] 행성 변경 / 이용 약관 / 개인 정보 처리 방침 드로워 (오버레이 컴포넌트)

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

- **User**: `{ nickname, email, points, planet }`
- **Plan**: `{ id, title, time, startDate, endDate, repeat(당일·매일·매주·격주·매월·매년), done, pinned }`
- **Product**: `{ id, name, price, category(씨앗·식물·묘목), image }`
- **Order**: `{ id(8자리), productId, status(주문접수중·취소접수중·배송중·주문취소), address }`
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

> 위 항목은 구현 착수 전 확정 권장.
