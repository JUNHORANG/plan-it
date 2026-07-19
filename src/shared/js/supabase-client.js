/*
  Supabase 클라이언트 — 단일 인스턴스
  참조: CLAUDE.md "아이콘" 섹션과 동일한 방식(빌드 스텝 없는 정적 MPA라 npm 설치 대신
  CDN ESM import). publishable key는 RLS로 보호되는 공개 키라 클라이언트 코드에 그대로 둔다.

  버전은 CLAUDE.md/보안 체크리스트 관례대로 latest가 아니라 특정 버전으로 고정한다
  (jsDelivr @latest는 예고 없이 배포판이 바뀌어 breaking change에 그대로 노출됨).
*/
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.110.5/+esm";

const SUPABASE_URL = "https://zobiflgbduusepgogwos.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_pqSKgEf98zJ6AAEwM_6edA_9x3RnYKU";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
