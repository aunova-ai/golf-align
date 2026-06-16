# GolfAlign Repository Layer

이 폴더는 화면과 데이터 저장소 사이의 중간 계층이다.

현재는 mock 데이터를 반환한다.  
나중에 Google Sheets, Supabase, PostgreSQL로 바꿀 때는 이 계층의 구현을 교체한다.

## 현재 구조

- `memberRepository.ts`
  - 회원 홈 피드백
  - 오늘 훈련
  - 최근 기록
  - 프로방 요약

- `proRepository.ts`
  - 프로 대시보드 지표
  - 프로방 목록
  - 회원 목록
  - 피드백 대기 기록
  - 훈련 결과 확인 대상

## 교체 원칙

화면 컴포넌트는 Google Sheets를 직접 호출하지 않는다.

```text
Component
  -> Repository
    -> mock data
    -> Google Sheets
    -> PostgreSQL/Supabase
```

MVP 초반에는 repository가 mock 데이터를 반환한다.  
Google Sheets 연동 단계에서는 같은 함수 이름을 유지하고 내부 구현만 바꾼다.

