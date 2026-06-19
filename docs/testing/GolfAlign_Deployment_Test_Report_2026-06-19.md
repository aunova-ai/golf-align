# GolfAlign Deployment Test Report - 2026-06-19

## 배포 결과

- Target: production
- Status: Ready
- Production URL: https://golf-align-b5vac0nut-nielfarm3-9181s-projects.vercel.app
- Custom domain: https://golf.aunova.ai
- Vercel deployment id: dpl_7Q4LwzR2PSo6tD6qWqJc1E6GESzJ
- Commit: 919688f9

## 통과 항목

- 홈 페이지 로드: 통과
- 페이지 타이틀 `GolfAlign`: 통과
- 브라우저 콘솔 오류: 없음
- 관리자 로그인 `aunova / aunova3123`: 통과
- 커스텀 도메인 alias `golf.aunova.ai`: 통과
- Vercel production build: 통과

## 차단 항목

회원가입, 프로가입, 프로방 생성, 메시지, 훈련 과제, 기록 저장 테스트는 현재 배포 환경에서 차단됐다.

원인:

- Vercel Production 환경변수에 Google Sheets 서비스 계정 값이 등록되어 있지 않다.
- 앱이 Google Sheets DB로 쓰지 못해 로컬 프로토타입 DB로 fallback한다.
- Vercel 서버리스 런타임의 `/var/task`는 읽기 전용이라 로컬 JSON DB 쓰기가 실패한다.

Vercel error log:

```text
POST /api/users 500 Error: EROFS: read-only file system, open '/var/task/...'
```

## Vercel에 필요한 환경변수

비밀값:

- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`

일반 설정값:

- `NEXT_PUBLIC_APP_URL=https://golf.aunova.ai`
- `GOOGLE_OAUTH_REDIRECT_URI=https://golf.aunova.ai/api/auth/google/callback`
- `GOOGLE_DRIVE_ROOT_FOLDER_ID=1yn75-KuQ1GRR6GqnRZ2n8t5u2t83AEZO`
- `GOOGLE_DRIVE_SHEET_FOLDER_ID=1ixM9gVRDFSYkNIuqhbbuPdxJ0UTodPUP`
- `GOOGLE_SHEETS_SPREADSHEET_ID=1Y1dAKoggA1Ae-DSZQZf2FilxZE7VOJod-n-lechyJ0M`
- `NAS_BACKUP_MODEL=ipTIME NAS1 Dual`
- `NAS_BACKUP_LAN_IP=192.168.0.102`
- `NAS_BACKUP_HOST=https://novart.ipdisk.co.kr`
- `MEDIA_ARCHIVE_AFTER_DAYS=7`
- `MEDIA_ARCHIVE_MAX_DAYS=14`
- `MEDIA_ARCHIVE_POLICY=feedback_done_plus_7_or_upload_plus_14`

## 환경변수 등록 후 재테스트 순서

1. Vercel Production 환경변수를 등록한다.
2. Production 재배포를 실행한다.
3. 회원가입/member 생성 테스트를 실행한다.
4. 프로가입/pro 생성 테스트를 실행한다.
5. 로그인 테스트를 실행한다.
6. 프로방 생성 테스트를 실행한다.
7. 회원의 프로방 신청 테스트를 실행한다.
8. 프로의 신청 승인 테스트를 실행한다.
9. 개인 메시지 송수신 테스트를 실행한다.
10. 훈련 과제 생성/조회 테스트를 실행한다.
11. 영상 기록 저장 테스트를 실행한다.
12. 이미지 기록 저장 테스트를 실행한다.
13. `records` 시트에서 영상 아카이브 컬럼을 확인한다.
14. NAS 이동 후보 정책 값을 확인한다.

