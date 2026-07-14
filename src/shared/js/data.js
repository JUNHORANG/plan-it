/*
  목 데이터 — 랭킹 목록
  참조: blueprint.md §8 데이터 모델, §3 shared/js/data.js

  일정·알림·유저 프로필·상점 상품·주문(사용자/관리자 모두)은 전부 Supabase 실 DB를 쓴다
  (shared/js/api.js 참조). 랭킹은 "다른 유저 15명" 목록 자체가 다중 유저 집계 기능(이번
  범위 밖)이 없으면 실데이터로 못 채우는 부분이라 여기만 목데이터로 남아 있다.
*/

// 행성 컬렉션 전체 목록 — Figma "프로필 - 행성 변경 - 드로워"(4084:669) 실측 12종.
// image가 있는 항목(earth/moon)만 실제 DB(public.planets)에도 존재해 프로필/랭킹 아바타로
// 쓰인다. 나머지 10종은 아직 실제로 모을 수 있는 방법(컬렉션 조건)이 없어 image를 비워두고
// 항상 미보유(잠금) 상태로만 표시한다 — 조건이 생기면 그때 실제 아트·DB 행을 추가한다.
export const planets = [
  { id: "earth", name: "지구", image: "/images/front_titi.png" },
  { id: "moon", name: "달", image: "/images/ranking_moon.png" },
  { id: "mercury", name: "수성", image: null },
  { id: "venus", name: "금성", image: null },
  { id: "mars", name: "화성", image: null },
  { id: "super-earth", name: "슈퍼 지구", image: null },
  { id: "jupiter", name: "목성", image: null },
  { id: "saturn", name: "토성", image: null },
  { id: "uranus", name: "천왕성", image: null },
  { id: "neptune", name: "해왕성", image: null },
  { id: "pluto", name: "명왕성", image: null },
  { id: "sun", name: "태양", image: null },
];

// "나의 순위"(6등) 자리는 실제 로그인 계정으로 덮어써지므로(shared/js/api.js의 getRanking
// 참조) 여기 있는 값은 초기 렌더용 자리표시자일 뿐이다.
const placeholderMe = { nickname: "행성지킴이", points: 8000, planet: "earth" };

// 랭킹 — Figma "/ranking"(4259:1235) 실측 그대로(닉네임·포인트·순위), "나의 순위"(6등) 항목만
// 실제 로그인 사용자 데이터로 대체해 프로필 화면과 값이 어긋나지 않게 한다
export const ranking = [
  { rank: 1, nickname: "계획인간", points: 1024, planet: "earth" },
  { rank: 2, nickname: "404error", points: 824, planet: "moon" },
  { rank: 3, nickname: "키키", points: 810, planet: "earth" },
  { rank: 4, nickname: "캐치캐치", points: 620, planet: "earth" },
  { rank: 5, nickname: "스티키", points: 540, planet: "moon" },
  {
    rank: 6,
    nickname: placeholderMe.nickname,
    points: placeholderMe.points,
    planet: placeholderMe.planet,
    isMe: true,
  },
  { rank: 7, nickname: "ADP", points: 420, planet: "moon" },
  { rank: 8, nickname: "레몬에이드", points: 380, planet: "moon" },
  { rank: 9, nickname: "달빛산책", points: 340, planet: "moon" },
  { rank: 10, nickname: "초록지구", points: 295, planet: "earth" },
  { rank: 11, nickname: "부지런한개미", points: 250, planet: "earth" },
  { rank: 12, nickname: "야근탈출", points: 190, planet: "moon" },
  { rank: 13, nickname: "느긋한거북이", points: 155, planet: "earth" },
  { rank: 14, nickname: "별헤는밤", points: 120, planet: "moon" },
  { rank: 15, nickname: "새벽러너", points: 95, planet: "earth" },
  { rank: 16, nickname: "감자밭", points: 60, planet: "moon" },
];

export const rankingMeta = { participants: ranking.length };
