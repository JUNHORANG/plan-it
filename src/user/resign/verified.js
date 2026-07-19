/*
  탈퇴 인증 완료 랜딩 (/user/resign/verified)
  참조: shared/js/api.js의 sendResignVerification — emailRedirectTo가 이 페이지를 가리킨다.
        signup/verified.js와 같은 이유로 폼 없는 조용한 안내만 보여준다.

  이 페이지가 로드되며 URL의 세션 토큰이 처리된 뒤(supabase.auth.getSession()으로 그 처리
  완료를 기다림), 그 시점의 auth.uid() 기준으로 confirm_resign_verification RPC를 호출해
  이번 탈퇴 시도의 확인 여부를 기록한다. 원래 열려 있던 탭(아직 index.js 화면)에는 storage
  이벤트로 세션이 동기화되고, 거기서 "탈퇴하기"를 누르면 is_resign_verified로 이 기록을
  조회한다.
*/
import { supabase } from "/shared/js/supabase-client.js";
import { confirmResignVerification } from "/shared/js/api.js";

await supabase.auth.getSession();
await confirmResignVerification();

const app = document.querySelector("#app");
app.innerHTML = `
  <div class="verified-page">
    <h1 class="verified-page__title">탈퇴 인증 완료</h1>
    <p class="verified-page__desc">인증이 완료됐어요.<br />원래 탭으로 돌아가 탈퇴를 계속 진행해 주세요.</p>
  </div>
`;
