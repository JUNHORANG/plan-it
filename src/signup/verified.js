/*
  이메일 인증 완료 랜딩 (/signup/verified)
  참조: shared/js/api.js의 sendVerificationCode — emailRedirectTo가 이 페이지를 가리킨다.

  메일의 확인 링크를 누르면 Supabase가 서버에서 인증 처리를 마친 뒤 반드시 앱으로
  리다이렉트한다(링크형 이메일 인증 방식인 한 이 한 번의 이동 자체는 피할 수 없다).
  전에는 리다이렉트 대상이 /signup/이라 스테퍼가 1단계부터 다시 그려져 "회원가입을
  처음부터 다시 하는 것"처럼 보였다 — 그래서 스테퍼 없는 이 조용한 안내 페이지로
  따로 분리했다. supabase-client 모듈을 로드하기만 해도 그 시점에 URL의 세션 토큰을
  자동으로 감지·저장하고(detectSessionInUrl 기본값), 그 세션이 storage 이벤트로
  원래 열려 있던 탭(아직 2단계 화면)에도 동기화된다 — 거기서 "다음"을 누르면
  is_email_verified 조회 후 3단계로 넘어간다.
*/
import "/shared/js/supabase-client.js";

const app = document.querySelector("#app");
app.innerHTML = `
  <div class="verified-page">
    <h1 class="verified-page__title">이메일 인증 완료!</h1>
    <p class="verified-page__desc">인증이 완료됐어요.<br />원래 탭으로 돌아가 회원가입을 계속 진행해 주세요.</p>
  </div>
`;
