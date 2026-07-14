/*
  목 데이터 — 식물 카탈로그 (상점에서 파는 유일한 상품 목록)
  참조: blueprint.md §8 데이터 모델, Figma "/store"(4278:843)의 Product 모양({id,name,category,price,image}) 그대로

  기존 data.js의 7개 시드 상품을 대체하는 20개 카탈로그. 이미지는 새로 만들지 않고 기존
  public/images의 tree1~3.png 3장을 돌려가며 재사용(발표용이라 이미지 디테일은 중요하지 않음).
  가격은 2,000~10,000 사이로 흩어 둬서(사용자 요청으로 10,000 초과 없음), 시드 포인트
  (8,000) 기준으로 살 수 있는 것과 없는 것이 자연히 섞이게 했다 — 포인트 부족 시나리오를
  별도로 조작하지 않아도 데모 중 바로 보여줄 수 있다.
*/

export const plants = [
  { id: "pl1", name: "몬스테라", category: "다육식물", price: 6000, image: "/images/tree1.png" },
  { id: "pl2", name: "금전수", category: "나무", price: 8000, image: "/images/tree2.png" },
  { id: "pl3", name: "율마", category: "나무", price: 9500, image: "/images/tree3.png" },
  { id: "pl4", name: "산세베리아", category: "다육식물", price: 4500, image: "/images/tree1.png" },
  { id: "pl5", name: "고무나무", category: "나무", price: 9800, image: "/images/tree2.png" },
  { id: "pl6", name: "떡갈고무나무", category: "나무", price: 9500, image: "/images/tree3.png" },
  { id: "pl7", name: "홍콩야자", category: "나무", price: 7000, image: "/images/tree1.png" },
  { id: "pl8", name: "스투키", category: "다육식물", price: 3000, image: "/images/tree2.png" },
  { id: "pl9", name: "다육 콤보", category: "다육식물", price: 2000, image: "/images/tree3.png" },
  { id: "pl10", name: "선인장 미니", category: "다육식물", price: 2500, image: "/images/tree1.png" },
  { id: "pl11", name: "올리브나무", category: "나무", price: 10000, image: "/images/tree2.png" },
  { id: "pl12", name: "벵갈고무나무", category: "나무", price: 9700, image: "/images/tree3.png" },
  { id: "pl13", name: "테이블야자", category: "나무", price: 6500, image: "/images/tree1.png" },
  { id: "pl14", name: "관음죽", category: "나무", price: 9000, image: "/images/tree2.png" },
  { id: "pl15", name: "에케베리아", category: "다육식물", price: 3500, image: "/images/tree3.png" },
  { id: "pl16", name: "하월시아", category: "다육식물", price: 4000, image: "/images/tree1.png" },
  { id: "pl17", name: "파키라", category: "나무", price: 8500, image: "/images/tree2.png" },
  { id: "pl18", name: "유칼립투스", category: "나무", price: 9200, image: "/images/tree3.png" },
  { id: "pl19", name: "크로톤", category: "나무", price: 8800, image: "/images/tree1.png" },
  { id: "pl20", name: "칼랑코에", category: "다육식물", price: 5000, image: "/images/tree2.png" },
];
