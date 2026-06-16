# Google Sheets 연동 준비 v0.1

작성일: 2026-05-14

## Drive 폴더 확인

사용자가 제공한 Drive 폴더:

```text
https://drive.google.com/drive/folders/1yn75-KuQ1GRR6GqnRZ2n8t5u2t83AEZO
```

확인 결과, 해당 폴더 안에 Google Sheets 테스트용 하위 폴더가 있다.

| 이름 | ID | 용도 |
|---|---|---|
| Google Sheets | `1ixM9gVRDFSYkNIuqhbbuPdxJ0UTodPUP` | Google Sheets 테스트 폴더로 사용 |

폴더명은 사용자가 `Google Sheets`로 수정했다. 폴더 ID는 그대로 유지되므로 코드 수정은 필요 없다.

## 현재 코드 반영

환경 변수 예시 파일:

```text
.env.example
```

추가된 값:

```text
GOOGLE_DRIVE_ROOT_FOLDER_ID=1yn75-KuQ1GRR6GqnRZ2n8t5u2t83AEZO
GOOGLE_DRIVE_SHEET_FOLDER_ID=1ixM9gVRDFSYkNIuqhbbuPdxJ0UTodPUP
GOOGLE_SHEETS_SPREADSHEET_ID=
```

생성된 MVP DB 스프레드시트:

```text
GolfAlign_MVP_DB_v0.1
https://docs.google.com/spreadsheets/d/1Y1dAKoggA1Ae-DSZQZf2FilxZE7VOJod-n-lechyJ0M/edit
```

로컬 `.env.local`에는 아래 값이 반영되어 있다.

```text
GOOGLE_SHEETS_SPREADSHEET_ID=1Y1dAKoggA1Ae-DSZQZf2FilxZE7VOJod-n-lechyJ0M
```

스키마 정의:

```text
lib/google/sheetSchema.ts
```

Google Sheets repository 준비:

```text
lib/repositories/googleSheetsRepository.ts
```

## 다음 실제 연동 순서

1. Drive의 `seet/sheet` 폴더 안에 Google Spreadsheet 생성
2. 스프레드시트 ID를 `.env.local`의 `GOOGLE_SHEETS_SPREADSHEET_ID`에 입력
3. Google Cloud에서 Sheets API, Drive API 활성화
4. 서비스 계정 생성
5. 서비스 계정 이메일을 스프레드시트에 편집자로 공유
6. `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY` 입력
7. repository 내부 구현을 mock에서 Google Sheets API로 교체

## MVP 초기 생성 시트

초기에는 아래 시트를 먼저 만든다.

- `users`
- `pro_profiles`
- `lesson_rooms`
- `room_invites`
- `records`
- `shared_records`
- `feedback`
- `training_assignments`
- `training_results`

나머지는 기능 확장 시 추가한다.
