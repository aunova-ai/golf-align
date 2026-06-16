# GolfAlign 프로젝트 폴더 구조

작성일: 2026-05-14

## 현재 기준

현재 루트 파일은 기존 미리보기 경로가 깨지지 않도록 유지했다.  
정리본은 아래 폴더에 복사해두었고, 이후 실제 개발 단계에서는 정리본을 기준으로 사용한다.

## 폴더 구조

```text
New project 2/
  docs/
    planning/
    db/
    architecture/
    curriculum/
  prototype/
    html/
      assets/
  assets/
    logo/
  data/
    mock/
  scripts/
    google-sheets/
    google-drive/
    nas-backup/
  app/
```

## 폴더별 용도

### docs/planning

기획, 화면 구조, MVP 범위 문서를 보관한다.

현재 파일:

- `GolfAlign_MVP_Screen_Structure_v0.4.md`

### docs/db

DB 구조와 Google Sheets 기준 컬럼 문서를 보관한다.

현재 파일:

- `GolfAlign_DB_Structure_v0.5.md`

### docs/architecture

개발 스택, 아키텍처, 배포, 저장소 전략 문서를 보관한다.

현재 파일:

- `GolfAlign_Dev_Stack_Architecture_v0.4.md`

### docs/curriculum

프로와 논의할 강의/레슨 커리큘럼 문서를 보관한다.

현재 파일:

- `GolfAlign_Lesson_Curriculum_UTF8.docx`

### prototype/html

HTML 프로토타입을 보관한다.

현재 파일:

- `GolfAlign_MVP_UI_preview_v0.4.html`
- `index.html`
- `assets/` 로고 이미지 복사본

### assets/logo

브랜드 로고 원본/앱 적용용 이미지를 보관한다.

현재 파일:

- `golfalign-icon.png`
- `golfalign-wordmark.png`
- `golfalign-pro-badge.png`

### data/mock

실제 개발 전 더미 데이터 파일을 둘 위치다.

예정 파일:

- `users.mock.ts`
- `rooms.mock.ts`
- `records.mock.ts`
- `training.mock.ts`
- `feedback.mock.ts`

### scripts/google-sheets

Google Sheets 임시 DB 연동 스크립트를 둘 위치다.

### scripts/google-drive

Google Drive 업로드/조회 스크립트를 둘 위치다.

### scripts/nas-backup

NAS 백업 자동화 스크립트를 둘 위치다.

### app

Next.js 앱 개발 폴더다.  
현재는 초기 생성 상태이며, 실제 개발 전 구조 재정리가 필요하다.

## 다음 정리 대상

다음 단계에서는 README를 작성한다.

README에 들어갈 내용:

- 프로젝트 소개
- 현재 진행 상태
- 주요 문서 위치
- HTML 프로토타입 위치
- 개발 실행 방법
- 다음 작업 목록

