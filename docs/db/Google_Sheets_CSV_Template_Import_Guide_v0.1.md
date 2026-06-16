# Google Sheets CSV 템플릿 가져오기 가이드 v0.1

작성일: 2026-05-14

## 목적

Google Sheets 폴더 안에 `GolfAlign_MVP_DB_v0.1` 스프레드시트를 만들고, 초기 DB 시트 구조를 빠르게 구성하기 위한 CSV 템플릿이다.

## Drive 기준 위치

상위 Drive 폴더:

```text
1yn75-KuQ1GRR6GqnRZ2n8t5u2t83AEZO
```

Google Sheets 폴더:

```text
1ixM9gVRDFSYkNIuqhbbuPdxJ0UTodPUP
```

## 로컬 CSV 템플릿 위치

```text
C:\Users\asura\Documents\New project 2\data\google-sheets\templates
```

생성된 파일:

- `users.csv`
- `pro_profiles.csv`
- `lesson_rooms.csv`
- `room_invites.csv`
- `room_members.csv`
- `records.csv`
- `shared_records.csv`
- `feedback.csv`
- `snapshot_feedback.csv`
- `training_assignments.csv`
- `training_results.csv`
- `training_reviews.csv`

각 CSV는 첫 번째 행에 컬럼명, 두 번째 행에 예시 데이터를 포함한다.

## 권장 생성 순서

1. Google Drive의 `Google Sheets` 폴더 안에서 새 Google Spreadsheet를 만든다.
2. 파일명을 `GolfAlign_MVP_DB_v0.1`로 지정한다.
3. 아래 시트들을 순서대로 만든다.
4. 각 시트에 같은 이름의 CSV를 가져온다.

권장 시트 순서:

1. `users`
2. `pro_profiles`
3. `lesson_rooms`
4. `room_invites`
5. `room_members`
6. `records`
7. `shared_records`
8. `feedback`
9. `snapshot_feedback`
10. `training_assignments`
11. `training_results`
12. `training_reviews`

## Google Sheets에서 CSV 가져오기

각 CSV 파일을 가져올 때:

1. Google Sheets에서 원하는 시트 선택
2. `파일 > 가져오기`
3. `업로드`
4. CSV 파일 선택
5. 가져오기 위치는 `현재 시트 바꾸기` 또는 `새 시트 삽입`
6. 구분자는 `쉼표`
7. 텍스트를 숫자/날짜로 자동 변환하지 않는 옵션이 있으면 끄는 것을 권장

## 생성 후 해야 할 일

스프레드시트 URL 예시:

```text
https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit
```

URL에서 `{SPREADSHEET_ID}` 부분을 복사해서 `.env.local`에 입력한다.

```text
GOOGLE_SHEETS_SPREADSHEET_ID={SPREADSHEET_ID}
```

## 다음 개발 단계

1. `.env.local` 생성
2. `GOOGLE_SHEETS_SPREADSHEET_ID` 입력
3. Google Cloud 서비스 계정 설정
4. 서비스 계정 이메일을 스프레드시트에 편집자로 공유
5. Sheets API read 테스트
6. Repository 내부를 mock에서 Google Sheets로 교체

