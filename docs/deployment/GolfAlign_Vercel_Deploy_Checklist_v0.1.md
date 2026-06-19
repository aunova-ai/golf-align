# GolfAlign Vercel 배포 체크리스트 v0.2

작성일: 2026-06-19

## 현재 배포 정보

| 항목 | 값 |
|---|---|
| GitHub 저장소 | `https://github.com/aunova-ai/golf-align` |
| Vercel 프로젝트 | `golf-align` |
| 프로덕션 도메인 | `https://golf.aunova.ai` |
| 관리자 계정 | 내부 담당자에게 별도 전달 |
| 회원 테스트 계정 | 내부 담당자에게 별도 전달 |
| 프로 테스트 계정 | 내부 담당자에게 별도 전달 |

## 배포 전 로컬 확인

```powershell
npm.cmd run build
```

통과 기준:

- Next.js 빌드 성공
- TypeScript 오류 없음
- `/api/auth/login` 라우트 포함
- `/api/records`, `/api/feedback` 라우트 포함

## Vercel 환경 변수

Vercel Project Settings > Environment Variables에 아래 값을 등록한다.

```env
NEXT_PUBLIC_APP_URL=https://golf.aunova.ai

ADMIN_LOGIN_ID=
ADMIN_PASSWORD=

GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=https://golf.aunova.ai/api/auth/google/callback

GOOGLE_DRIVE_ROOT_FOLDER_ID=1yn75-KuQ1GRR6GqnRZ2n8t5u2t83AEZO
GOOGLE_DRIVE_SHEET_FOLDER_ID=1ixM9gVRDFSYkNIuqhbbuPdxJ0UTodPUP
GOOGLE_SHEETS_SPREADSHEET_ID=1Y1dAKoggA1Ae-DSZQZf2FilxZE7VOJod-n-lechyJ0M

GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=

NAS_BACKUP_ENABLED=false
NAS_BACKUP_BASE_PATH=
NAS_BACKUP_MODEL=ipTIME NAS1 Dual
NAS_BACKUP_LAN_IP=192.168.0.102
NAS_BACKUP_HOST=https://novart.ipdisk.co.kr
```

주의:

- `GOOGLE_PRIVATE_KEY`는 줄바꿈을 `\n`으로 바꿔 입력한다.
- Google OAuth Console에도 `https://golf.aunova.ai/api/auth/google/callback`을 등록해야 한다.
- 서비스 계정 이메일을 Google Sheets와 필요한 Drive 폴더에 편집자로 공유해야 한다.

## 배포 명령

```powershell
npx.cmd vercel deploy --prod --yes --project golf-align
```

배포 성공 시 Vercel CLI 출력에 아래와 유사한 줄이 보여야 한다.

```text
Production  https://golf-align-....vercel.app
Aliased     https://golf.aunova.ai
```

## 배포 후 API 확인

관리자 로그인:

```powershell
$body = @{ username='<ADMIN_ID>'; password='<ADMIN_PASSWORD>' } | ConvertTo-Json
Invoke-RestMethod -Uri 'https://golf.aunova.ai/api/auth/login' -Method Post -ContentType 'application/json' -Body $body
```

회원 테스트 로그인:

```powershell
$body = @{ username='<MEMBER_TEST_ID>'; password='<MEMBER_TEST_PASSWORD>' } | ConvertTo-Json
Invoke-RestMethod -Uri 'https://golf.aunova.ai/api/auth/login' -Method Post -ContentType 'application/json' -Body $body
```

프로 테스트 로그인:

```powershell
$body = @{ username='<PRO_TEST_ID>'; password='<PRO_TEST_PASSWORD>' } | ConvertTo-Json
Invoke-RestMethod -Uri 'https://golf.aunova.ai/api/auth/login' -Method Post -ContentType 'application/json' -Body $body
```

통과 기준:

- `ok: true`
- 관리자 계정은 `mode: admin`
- 회원/프로 테스트 계정은 `mode: local_prototype`
- `role`이 각각 `admin`, `member`, `pro`로 반환

## 배포 후 화면 확인

`https://golf.aunova.ai`에서 아래 문구와 버튼이 보여야 한다.

- `회원과 프로가 직접 가입하고, 만든 계정으로 다시 로그인할 수 있습니다.`
- 빠른 테스트 계정, 관리자 계정, 샘플 계정명이 노출되지 않아야 한다.
- 이전에 로그인한 기기에서는 마지막 로그인 아이디만 자동 입력되고, 비밀번호는 다시 입력해야 한다.

관리자 로그인 후 확인할 것:

- 회원 화면 확인
- 프로 화면 확인
- 프로 화면의 피드백 대기/완료 목록
- `실제 영상 본 분석 테스트` 기록 진입
- 0.5x 배속
- 현재 장면 캡쳐
- 뼈각도 표시/숨김
- 지우개, 텍스트, 선, 화살표, 사각, 원 도구
- 피드백 저장 후 다시 보기

## Google Sheets 실저장 전환 전 확인

현재 Vercel은 서비스 계정 값이 없으면 로컬 프로토타입 모드로 동작한다. 실제 운영 데이터 저장을 켜려면 아래가 모두 필요하다.

- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_SHEETS_SPREADSHEET_ID`
- 서비스 계정 이메일에 스프레드시트 편집 권한
- 필요 시 Drive 폴더 편집 권한

## 현재 MVP 저장 정책

- 프로필 사진: MVP에서는 Google Drive 보관 예정
- 훈련 영상 원본: 서버 DB에 직접 저장하지 않고 사용자 기기/다운로드 기반으로 확장
- 앱 DB: 상용화 전까지 Google Sheets 우선, 이후 Supabase/Postgres 등으로 교체 가능
- 스냅샷/피드백: 썸네일 또는 캡쳐 이미지 URL, 주석 JSON, 뼈각도 분석 JSON 저장
