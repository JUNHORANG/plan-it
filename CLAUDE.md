# Plan It

Todo 기반 일정 관리 + 게이미피케이션(포인트·수집·랭킹) 웹 서비스. Vanilla HTML/CSS/JS 기반 MPA(멀티 페이지 앱), 완전 코로케이션 구조, 모바일 퍼스트(최소 360×640, 타블렛 최소 높이 600).

## 참고 문서

- [spec.md](./spec.md) — 화면별 상세 기능 정의서 (원본 요구사항). 특정 화면의 정확한 동작·문구·조건을 확인할 때 참조.
- [blueprint.md](./blueprint.md) — spec.md를 바탕으로 설계한 아키텍처: 라우팅 맵, 폴더 구조, 공통 컴포넌트 명세, localStorage 상태 키, 작업 TODO 순서, 데이터 모델.

새 화면/기능을 구현하거나 수정할 때는 blueprint.md의 아키텍처 규칙(파일 배치, 컴포넌트 규약 등)을 따르고, 세부 동작이 불명확하면 spec.md에서 해당 화면 섹션을 확인한다.

## 폴더 구조 · 실행

- `src/` — 소스 코드 (html·css·js, `index.*`/`user/`/`admin/`/`shared/` 등)
- `public/` — 순수 정적 자산만 (`fonts/`, `images/`). 소스 코드를 여기 두지 않는다.
- 실행: `npm run dev` → `scripts/dev-server.js`가 `src/`와 `public/`를 하나의 루트(`http://localhost:3000`)로 합쳐서 서빙한다(요청을 `src/`에서 먼저 찾고 없으면 `public/`로 폴백). 빌드 스텝 없음.

## 아이콘

아이콘은 [lucide-icons](https://lucide.dev)를 사용한다. 빌드 스텝이 없는 정적 MPA이므로 npm 설치 없이 CDN ESM import로 가져온다.

```js
import { createElement, X } from "https://cdn.jsdelivr.net/npm/lucide@latest/+esm";
el.appendChild(createElement(X, { size: 24 }));
```

손으로 그린 인라인 SVG(`<svg>...</svg>`)는 사용하지 않는다. `nav-drawer.js`의 닫기(X) 아이콘 참조.

예외: 헤더 종 아이콘은 Figma 원본이 solar 아이콘셋(`solar:bell-outline`)이라 lucide 대신 그대로 사용한다(`header.js` 참조, blueprint.md §9 10번). 빌드 스텝 없이 CDN ESM으로 Iconify 웹 컴포넌트를 불러와 렌더링한다.

```js
import "https://cdn.jsdelivr.net/npm/iconify-icon@2.1.0/+esm";
// <iconify-icon icon="solar:bell-outline" width="22" height="22"></iconify-icon>
```

## 주의: spec.md ↔ blueprint.md 충돌 시 우선순위

spec.md는 원본 기능 정의서를 그대로 보존한 문서라 도메인 표기 오타·불일치가 일부 남아 있다 (예: `/user/plants/success` vs `/user/plans/success`, `/index` vs `/user/plans/`). 이런 라우팅/도메인 표기가 두 문서 간 다르게 보이면 **spec.md가 아니라 blueprint.md §9(확인 필요 항목)에서 채택한 표기를 따른다.** §9에 없는 새로운 불일치를 발견하면 §9에 추가하고 여기서도 알린다.
