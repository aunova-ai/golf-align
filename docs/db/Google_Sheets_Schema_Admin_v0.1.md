# GolfAlign Google Sheets Schema Admin v0.1

## 목적

Google Sheets를 MVP DB처럼 사용할 때 탭과 헤더가 앱 코드의 DB 스키마와 맞는지 점검하고, 초기 개발 단계에서 빠르게 보정하기 위한 관리 API입니다.

## 기준 스키마

앱의 기준 스키마는 아래 파일을 사용합니다.

`lib/google/sheetSchema.ts`

## API

### 1. 시트 구조 점검

```http
GET /api/admin/sheets/schema
```

응답 예시:

```json
{
  "configured": true,
  "ok": false,
  "sheets": [
    {
      "name": "users",
      "status": "header_mismatch",
      "missingColumns": ["role"],
      "extraColumns": [],
      "headerMatchesExact": false
    }
  ]
}
```

상태값:

- `ok`: 탭과 헤더 순서가 앱 기준과 일치
- `missing_sheet`: 탭 없음
- `missing_header`: 헤더 행 없음
- `header_mismatch`: 컬럼 누락, 추가, 순서 불일치

### 2. 시트 구조 초기화/보정

```http
POST /api/admin/sheets/schema
```

처리 내용:

- 없는 탭 생성
- 각 탭의 1행 헤더를 `sheetSchema.ts` 기준으로 업데이트

주의:

MVP 초기 개발용 보정 기능입니다. 기존 데이터가 많은 상태에서 헤더 순서를 바꾸면 기존 행의 의미가 어긋날 수 있으므로, 상용 데이터가 쌓인 뒤에는 백업 후 실행해야 합니다.

## 실행 전 필요한 환경값

`.env.local`에 아래 값이 있어야 실제 Google Sheets와 통신합니다.

```env
GOOGLE_SHEETS_SPREADSHEET_ID=
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=
```

현재 `configured: false`가 나오면 위 값 중 하나 이상이 비어 있는 상태입니다.
