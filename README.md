# GolfAlign

스윙을 기록하고, 성장을 정렬하다.

GolfAlign은 골프 회원과 프로를 연결해 영상/이미지 기반 자세 기록, 프로 피드백, 훈련 과제 관리, 프로방 초대 흐름을 제공하는 웹앱/PWA MVP 프로젝트다.

## 현재 상태

현재 단계는 실제 개발 전 기획/프로토타입 정리 단계다.

완료된 작업:

- 앱 이름 확정: GolfAlign
- 브랜드 방향 정리
- MVP 화면 구조 v0.4 정리
- DB 구조 v0.5 정리
- 개발 스택/아키텍처 v0.4 정리
- HTML 프로토타입 v0.4 제작
- 로고 3종 적용
- 프로젝트 폴더 구조 정리

커리큘럼 추천 목록은 프로와 논의 후 별도 반영한다.

## MVP 핵심 기능

회원 기능:

- 영상/이미지 기록 업로드
- 스윙, 퍼팅, 어프로치 기록 관리
- 기록 상세 확인
- 프로방 가입
- 기존 기록 선택 공유
- 훈련 과제 확인
- 훈련 결과 기록
- 언어 설정

프로 기능:

- 프로방 관리
- 초대 링크 공유
- 회원 목록 확인
- 공유 기록 확인
- 영상/이미지 스냅샷 피드백
- 훈련 과제 전송
- 훈련 결과 확인
- 짧은 코멘트 작성

MVP 보류 기능:

- 정밀 AI 자동 분석
- 3D 모델/리깅 모델
- 결제
- 센터 관리자 기능
- 라운드 모집 실제 기능
- 앱스토어/플레이스토어 정식 출시

## 주요 문서

### 화면 구조

[GolfAlign_MVP_Screen_Structure_v0.4.md](</C:/Users/asura/Documents/New project 2/docs/planning/GolfAlign_MVP_Screen_Structure_v0.4.md>)

회원 화면, 프로 화면, 초대/가입 흐름, 업로드, 훈련 결과, 언어 설정, MVP 보류 기능을 정리한 문서다.

### DB 구조

[GolfAlign_DB_Structure_v0.5.md](</C:/Users/asura/Documents/New project 2/docs/db/GolfAlign_DB_Structure_v0.5.md>)

Google Sheets 임시 DB, Google Drive/NAS 저장 구조, 권한 규칙, 추후 Supabase/PostgreSQL 전환 기준을 정리한 문서다.

[Google_Sheets_Integration_Setup_v0.1.md](</C:/Users/asura/Documents/New project 2/docs/db/Google_Sheets_Integration_Setup_v0.1.md>)

Google Drive의 Google Sheets 폴더 ID와 API 연동 준비 내용을 정리한 문서다.

[Google_Sheets_CSV_Template_Import_Guide_v0.1.md](</C:/Users/asura/Documents/New project 2/docs/db/Google_Sheets_CSV_Template_Import_Guide_v0.1.md>)

초기 DB용 CSV 템플릿을 Google Sheets로 가져오는 방법을 정리한 문서다.

### 개발 스택/아키텍처

[GolfAlign_Dev_Stack_Architecture_v0.4.md](</C:/Users/asura/Documents/New project 2/docs/architecture/GolfAlign_Dev_Stack_Architecture_v0.4.md>)

PWA, Vercel, Google Sheets, Google Drive, NAS 백업, 인증, 권한, AI/분석 엔진 방향을 정리한 문서다.

### 레슨 커리큘럼 초안

[GolfAlign_Lesson_Curriculum_UTF8.docx](</C:/Users/asura/Documents/New project 2/docs/curriculum/GolfAlign_Lesson_Curriculum_UTF8.docx>)

프로와 논의할 강의/레슨 커리큘럼 초안이다. 실제 적용 전 수정 예정이다.

### 폴더 구조

[PROJECT_STRUCTURE.md](</C:/Users/asura/Documents/New project 2/PROJECT_STRUCTURE.md>)

현재 프로젝트 폴더별 용도를 정리한 문서다.

## HTML 프로토타입

현재 확인용 HTML:

[GolfAlign_MVP_UI_preview_v0.4.html](</C:/Users/asura/Documents/New project 2/prototype/html/GolfAlign_MVP_UI_preview_v0.4.html>)

기존 루트 미리보기 파일도 유지되어 있다.

[루트 v0.4 HTML](</C:/Users/asura/Documents/New project 2/GolfAlign_MVP_UI_preview_v0.4.html>)

브라우저에서 직접 열어 확인할 수 있다.

## 로고/브랜드 assets

정리 위치:

[assets/logo](</C:/Users/asura/Documents/New project 2/assets/logo>)

파일:

- `golfalign-icon.png`
- `golfalign-wordmark.png`
- `golfalign-pro-badge.png`

용도:

- 앱 아이콘/SNS 썸네일: `golfalign-icon.png`
- 앱 상단/브랜드 워드마크: `golfalign-wordmark.png`
- 프로 인증 배지: `golfalign-pro-badge.png`

## 개발 예정 스택

초기 개발:

- Next.js
- TypeScript
- React
- PWA
- Vercel
- Google Sheets API
- Google Drive API
- NAS 백업 스크립트

추후 확장:

- Supabase 또는 PostgreSQL
- S3/R2/Supabase Storage
- 앱스토어/플레이스토어 출시
- AI 분석 엔진 고도화

## 데이터 저장 전략

MVP:

- DB: Google Sheets
- 미디어 임시 저장: Google Drive
- 장기 백업: NAS
- 원본 영상: 사용자 기기 보관 우선

영상 정책:

- 5초 권장
- 최대 7초 허용
- MVP 권장 최대 30MB

Google Sheets CSV 템플릿:

[data/google-sheets/templates](</C:/Users/asura/Documents/New project 2/data/google-sheets/templates>)

## 로컬 확인 방법

HTML 프로토타입은 별도 설치 없이 브라우저에서 열 수 있다.

파일:

```text
C:\Users\asura\Documents\New project 2\prototype\html\GolfAlign_MVP_UI_preview_v0.4.html
```

간단 서버로 보고 싶을 때:

```bash
python -m http.server 3000
```

그 다음 브라우저에서 접속:

```text
http://localhost:3000/
```

Next.js 개발로 전환하면 아래 방식으로 실행한다.

```bash
npm install
npm run dev
```

현재 Next.js 폴더는 초기 생성 상태라 실제 개발 전 정리가 필요하다.

## 다음 작업 목록

1. Next.js 현재 상태 점검
2. 실제 개발용 앱 구조 재정리
3. 공통 UI 컴포넌트 설계
4. mock 데이터 생성
5. 회원 화면 컴포넌트화
6. 프로 화면 컴포넌트화
7. Google Sheets 연동 준비
8. Google Drive 업로드 연동 준비
9. Vercel 배포 테스트
10. 프로와 커리큘럼 논의 후 추천 과정 반영

## 현재 중요한 결정

- 정식 앱 출시는 나중에 한다.
- Apple Developer와 Google Play Console은 지금 필수 아님.
- Supabase도 MVP 초반에는 필수 아님.
- PWA와 Vercel로 먼저 테스트한다.
- 커리큘럼은 프로 검토 후 반영한다.
- 실제 앱에서는 회원/프로 전환 버튼을 노출하지 않고, 로그인 역할로 분기한다.
