# Google Sheets / Drive 연동 준비 v0.2

작성일: 2026-06-19

## 목적

GolfAlign MVP는 상용 DB로 넘어가기 전까지 Google Sheets를 임시 DB로, Google Drive를 프로필 이미지와 테스트 파일 보관소로 사용할 수 있다. 지금 코드는 Google Sheets 서비스 계정 값이 없으면 로컬 프로토타입 DB로 동작하고, 값이 채워지면 Sheets 쓰기 경로가 활성화된다.

## 현재 Drive / Sheet 정보

사용자가 만든 Drive 폴더:

```text
https://drive.google.com/drive/folders/1yn75-KuQ1GRR6GqnRZ2n8t5u2t83AEZO
```

| 이름 | ID | 용도 |
|---|---|---|
| GolfAlign 루트 폴더 | `1yn75-KuQ1GRR6GqnRZ2n8t5u2t83AEZO` | MVP 파일 관리 루트 |
| Google Sheets 폴더 | `1ixM9gVRDFSYkNIuqhbbuPdxJ0UTodPUP` | DB용 스프레드시트 보관 |
| GolfAlign_MVP_DB_v0.1 | `1Y1dAKoggA1Ae-DSZQZf2FilxZE7VOJod-n-lechyJ0M` | MVP DB 스프레드시트 |

개인 Google 계정의 Drive를 사용해도 된다. 단, 서비스 계정 이메일을 해당 스프레드시트와 필요한 Drive 폴더에 `편집자`로 공유해야 서버에서 읽기/쓰기가 가능하다.

## 필요한 환경 변수

로컬 `.env.local` 또는 Vercel Environment Variables에 아래 값을 넣는다.

```env
NEXT_PUBLIC_APP_URL=https://golf.aunova.ai

GOOGLE_DRIVE_ROOT_FOLDER_ID=1yn75-KuQ1GRR6GqnRZ2n8t5u2t83AEZO
GOOGLE_DRIVE_SHEET_FOLDER_ID=1ixM9gVRDFSYkNIuqhbbuPdxJ0UTodPUP
GOOGLE_SHEETS_SPREADSHEET_ID=1Y1dAKoggA1Ae-DSZQZf2FilxZE7VOJod-n-lechyJ0M

GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=
```

`GOOGLE_PRIVATE_KEY`는 서비스 계정 JSON의 `private_key` 값이다. Vercel에 넣을 때는 줄바꿈을 `\n` 문자로 치환해서 한 줄로 입력한다.

## Google Cloud 설정 순서

1. Google Cloud Console에서 프로젝트를 만든다.
2. `Google Sheets API`와 `Google Drive API`를 활성화한다.
3. 서비스 계정을 생성한다.
4. 서비스 계정 키를 JSON으로 발급한다.
5. JSON에서 `client_email` 값을 복사해 `GOOGLE_CLIENT_EMAIL`에 넣는다.
6. JSON에서 `private_key` 값을 복사해 `GOOGLE_PRIVATE_KEY`에 넣는다.
7. 서비스 계정 이메일을 `GolfAlign_MVP_DB_v0.1` 스프레드시트에 편집자로 공유한다.
8. 프로필 이미지 업로드까지 서버에서 처리할 경우, 루트 Drive 폴더와 프로필 이미지 폴더도 서비스 계정에 편집자로 공유한다.

## Google OAuth 설정 순서

MVP에서는 Google 계정 회원가입/로그인을 제외한다.  
아래 항목은 향후 소셜 로그인 확장 시 다시 검토한다.

1. Google Cloud Console > APIs & Services > Credentials로 이동한다.
2. OAuth client ID를 생성한다.
3. 앱 유형은 Web application을 선택한다.
4. Authorized redirect URI에 아래 값을 등록한다.

```text
http://localhost:3000/api/auth/google/callback
https://golf.aunova.ai/api/auth/google/callback
```

5. 발급된 Client ID와 Client Secret을 `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`에 넣는다.

## MVP 필수 시트

초기 MVP는 아래 시트를 기준으로 동작한다.

- `users`
- `pro_profiles`
- `lesson_rooms`
- `room_invites`
- `room_members`
- `records`
- `shared_records`
- `feedback`
- `training_assignments`
- `training_results`

피드백 시트에는 뼈각도/주석 저장을 위해 아래 컬럼이 포함되어야 한다.

```text
annotations
pose_angles_visible
hidden_angle_mark_ids
pose_analysis_json
pose_engine
```

## 현재 상태

- 로컬/배포 환경 모두 Google Sheets 서비스 계정 값이 비어 있으면 로컬 프로토타입 DB로 로그인과 테스트가 가능하다.
- 관리자 계정과 테스트 계정은 내부 담당자에게만 별도 전달한다.
- 로그인 화면과 사용자용 문서에는 관리자/테스트 계정명이 노출되지 않아야 한다.
- 실제 Sheets 저장 전환은 서비스 계정 이메일과 private key가 입력된 뒤 다시 테스트해야 한다.
