/*
  휠 피커 — 공통 UI 컴포넌트 (일정 추가/수정 전용)
  참조: spec.md "일정 추가" 3~5번, Figma "일정 추가 - 휠 피커 바텀 시트 - 시간/시작 날짜/종료 날짜"
        (4079:1055, 4079:1096, 4208:872)

  openBottomSheet(shared/components/bottom-sheet.js)를 셸로 재사용하고, 본문에 스크롤
  스냅 기반 휠 컬럼(들)만 얹는다. 열별 아이템 높이를 39px로 통일해(Figma는 위/아래 행이
  37px로 가운데 행(39px)보다 살짝 낮지만, 스크롤 스냅 인덱스 계산을 단순하게 유지하려고
  통일했다 — 실제 시각 차이는 2px로 미미) `scrollTop / 39`로 바로 인덱스를 구한다.

  Figma CTA 라벨이 "견적 갱신"으로 돼 있는데 이건 다른 화면에서 복붙된 잔재로 보여
  (구매/견적 관련 문구가 일정 추가 흐름과 무관) spec.md 문구("CTA 버튼을 클릭해 ~ 변경할
  수 있다")에 맞춰 "확인"으로 대체한다.
*/

import { openBottomSheet } from "./bottom-sheet.js";

const ITEM_HEIGHT = 39;
const VISIBLE_ROWS = 3;

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function createWheelColumn({ values, selectedIndex, onSettle }) {
  const col = document.createElement("div");
  col.className = "wheel-picker__column";

  const list = document.createElement("div");
  list.className = "wheel-picker__list";
  const edgePad = ITEM_HEIGHT * Math.floor(VISIBLE_ROWS / 2);
  list.style.paddingTop = `${edgePad}px`;
  list.style.paddingBottom = `${edgePad}px`;
  col.appendChild(list);

  let currentValues = values;

  function renderItems() {
    list.innerHTML = "";
    currentValues.forEach((value, i) => {
      const item = document.createElement("div");
      item.className = "wheel-picker__item";
      item.textContent = String(value);
      // 마우스 휠 조작이 정밀하지 않다는 피드백 — 항목을 직접 클릭해도 그 값으로 스크롤되게
      // 한다. scrollTo가 만들어내는 scroll 이벤트를 아래 col의 scroll 리스너가 그대로 받아
      // highlight/onSettle까지 처리하므로 별도 로직 없이 자연스럽게 값이 확정된다.
      item.addEventListener("click", () => {
        col.scrollTo({ top: i * ITEM_HEIGHT, behavior: "smooth" });
      });
      list.appendChild(item);
    });
  }

  function highlight(index) {
    [...list.children].forEach((el, i) => el.classList.toggle("is-selected", i === index));
  }

  // 마우스 휠 한 틱의 기본 deltaY(브라우저/기기마다 40~120px 등 제각각)가 항목 높이(39px)
  // 보다 커서 한 번 굴릴 때마다 여러 칸씩 튀어 원하는 값에 맞추기 어렵다는 피드백 — 네이티브
  // 스크롤을 막고 휠 한 틱당 정확히 한 칸(ITEM_HEIGHT)만 이동하도록 직접 제어한다.
  col.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      if (e.deltaY === 0) return;
      col.scrollTop += e.deltaY > 0 ? ITEM_HEIGHT : -ITEM_HEIGHT;
    },
    { passive: false },
  );

  // 스크롤 가능한(overflow-y:auto) 요소는 바깥쪽 col이다 — list는 위아래 여백용 패딩만
  // 가진 콘텐츠 래퍼라 스크롤이 없다. scrollTop/scroll 이벤트는 반드시 col 기준이어야 한다
  // (처음엔 list에 걸어놔서 스크롤이 전혀 안 먹히는 버그가 있었다).
  let settleTimer = null;
  col.addEventListener("scroll", () => {
    const rawIndex = Math.round(col.scrollTop / ITEM_HEIGHT);
    highlight(Math.max(0, Math.min(currentValues.length - 1, rawIndex)));

    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      const index = Math.max(0, Math.min(currentValues.length - 1, rawIndex));
      col.scrollTop = index * ITEM_HEIGHT;
      highlight(index);
      if (onSettle) onSettle(index, currentValues[index]);
    }, 120);
  });

  renderItems();

  return {
    el: col,
    // bottom-sheet.js는 시트를 root에 붙인 뒤 requestAnimationFrame으로 is-open을 추가해
    // visibility:hidden→visible로 바꾼다. render()는 그 rAF보다 먼저(같은 동기 흐름 안에서)
    // 실행되므로, 이 시점에 scrollTop을 설정하면 조상이 아직 visibility:hidden이라 대입이
    // 조용히 무시된다(크로미움 실측 확인). rAF 한 번으로는 등록 순서상 여전히 is-open보다
    // 먼저 실행돼 버려서, 한 프레임 더 미루는 이중 rAF로 is-open이 반영된 뒤에 설정한다.
    init() {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          col.scrollTop = selectedIndex * ITEM_HEIGHT;
          highlight(selectedIndex);
        });
      });
    },
    /** 컬럼 값 목록을 교체한다 (날짜 휠에서 월이 바뀌어 일(day) 최대치가 달라질 때 사용) */
    setValues(nextValues, nextIndex) {
      currentValues = nextValues;
      renderItems();
      col.scrollTop = nextIndex * ITEM_HEIGHT;
      highlight(nextIndex);
    },
  };
}

function buildWheel(columnDefs) {
  const hasLabels = columnDefs.some((c) => c.label);
  const wrap = document.createElement("div");
  wrap.className = "wheel-picker";

  if (hasLabels) {
    const headRow = document.createElement("div");
    headRow.className = "wheel-picker__head";
    columnDefs.forEach((c) => {
      const label = document.createElement("span");
      label.className = "wheel-picker__head-label";
      label.textContent = c.label || "";
      headRow.appendChild(label);
    });
    wrap.appendChild(headRow);
  }

  const body = document.createElement("div");
  body.className = "wheel-picker__body";
  const highlightBar = document.createElement("div");
  highlightBar.className = "wheel-picker__highlight";
  body.appendChild(highlightBar);

  const columns = columnDefs.map((c) =>
    createWheelColumn({
      values: c.values,
      selectedIndex: c.selectedIndex,
      onSettle: c.onSettle,
    }),
  );
  columns.forEach((col) => body.appendChild(col.el));
  wrap.appendChild(body);

  return {
    el: wrap,
    columns,
    /** wrap이 실제 문서에 붙은 뒤 호출해야 한다 — 각 컬럼의 초기 스크롤 위치를 잡는다. */
    init() {
      columns.forEach((col) => col.init());
    },
  };
}

/** 일정 시간 — 시(0~23) / 분(0~59) 두 컬럼. spec.md "일정 추가" 3번. */
export function openTimeWheelPicker({ hour, minute, onConfirm }) {
  let selHour = hour;
  let selMinute = minute;

  return openBottomSheet({
    title: "일정 시간",
    submitLabel: "확인",
    render(body) {
      const wheel = buildWheel([
        { label: "시", values: range(0, 23), selectedIndex: hour, onSettle: (i) => (selHour = i) },
        { label: "분", values: range(0, 59), selectedIndex: minute, onSettle: (i) => (selMinute = i) },
      ]);
      body.appendChild(wheel.el);
      wheel.init();
    },
    onSubmit: () => {
      onConfirm(selHour, selMinute);
      return { ok: true, message: "일정 시간을 변경했습니다." };
    },
  });
}

/**
 * 날짜 휠(일/월/년 세 컬럼) — spec.md "일정 추가" 4~5번(시작/종료 날짜).
 * minDate가 주어지면(종료 날짜 피커) 그보다 이른 날짜는 선택할 수 없다 — 휠 자체를 막는 대신
 * CTA 클릭 시 유효성 검사로 막는다(휠 스크롤 중 부분적으로 막긴 UX가 더 헷갈림).
 */
export function openDateWheelPicker({ title, date, minDate, onConfirm }) {
  const YEAR_RANGE = 6; // 올해 기준 -1 ~ +5년 (달력/일정 수정 화면 범위와 맞춘 임의값)
  const years = range(date.getFullYear() - 1, date.getFullYear() + YEAR_RANGE);

  let selYear = date.getFullYear();
  let selMonth = date.getMonth() + 1;
  let selDay = date.getDate();

  function daysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  }

  return openBottomSheet({
    title,
    submitLabel: "확인",
    render(body) {
      const dayValues = range(1, daysInMonth(selYear, selMonth));
      const wheel = buildWheel([
        {
          values: years,
          selectedIndex: years.indexOf(selYear),
          onSettle: (_, value) => {
            selYear = value;
            syncDayColumn();
          },
        },
        {
          values: range(1, 12),
          selectedIndex: selMonth - 1,
          onSettle: (_, value) => {
            selMonth = value;
            syncDayColumn();
          },
        },
        {
          values: dayValues,
          selectedIndex: selDay - 1,
          onSettle: (_, value) => (selDay = value),
        },
      ]);
      body.appendChild(wheel.el);
      wheel.init();

      const dayColumn = wheel.columns[2];
      function syncDayColumn() {
        const max = daysInMonth(selYear, selMonth);
        if (selDay > max) selDay = max;
        dayColumn.setValues(range(1, max), selDay - 1);
      }
    },
    onSubmit: () => {
      const picked = new Date(selYear, selMonth - 1, selDay);
      if (minDate && picked < minDate) {
        return { ok: false, message: "시작 날짜보다 이른 날짜는 선택할 수 없습니다." };
      }
      onConfirm(picked);
      return { ok: true, message: `${title}를 변경했습니다.` };
    },
  });
}
