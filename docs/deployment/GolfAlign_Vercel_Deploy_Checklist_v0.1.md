# GolfAlign Vercel 배포 체크리스트 v0.1

목적: 실제 영상 캡쳐 기반 MediaPipe 본 분석 기능을 포함한 GolfAlign MVP를 Vercel에 올릴 때 필요한 설정과 확인 항목을 정리한다.

## 1. 현재 배포 가능 상태

- Next.js 프로덕션 빌드 통과: `npm.cmd run build`
- 실제 영상 테스트 파일 연결 확인: `/test-assets/test-swing-short.mp4`
- MediaPipe Pose Landmarker 설치 완료: `@mediapipe/tasks-vision`
- 캡쳐샷 기반 실제 본 분석 확인 완료
  - 33개 랜드마크
  - 어깨, 골반, 팔, 무릎, 척추 각도 라벨
  - 분석 결과 저장: `poseAnalysis`, `poseEngine`
- 피드백 저장 후 다시 열었을 때 저장된 실제 본 분석 레이어 재표시 확인

## 2. Vercel 배포 전 필수 결정

### DB 저장 방식

Vercel 배포 후에는 `data/local-db/prototype-db.json`을 영구 DB로 쓰면 안 된다.

이유:
- Vercel 서버리스 파일 시스템은 요청/배포마다 유지가 보장되지 않는다.
- 로컬 JSON DB는 개발 확인용으로만 사용한다.

MVP 배포 기준:
- 가입, 로그인, 기록, 프로방, 메시지, 피드백 저장은 Google Sheets를 우선 DB로 사용한다.
- 영상 원본은 MVP에서는 사용자 기기 또는 별도 저장소 기준으로 두고, 앱에는 썸네일/스냅샷/분석 JSON만 저장한다.

## 3. Vercel 환경변수

Vercel Project Settings > Environment Variables에 아래 값을 등록한다.

```env
NEXT_PUBLIC_APP_URL=https://보유도메인

GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=https://보유도메인/api/auth/google/callback

GOOGLE_DRIVE_ROOT_FOLDER_ID=1yn75-KuQ1GRR6GqnRZ2n8t5u2t83AEZO
GOOGLE_DRIVE_SHEET_FOLDER_ID=1ixM9gVRDFSYkNIuqhbbuPdxJ0UTodPUP
GOOGLE_SHEETS_SPREADSHEET_ID=1Y1dAKoggA1Ae-DSZQZf2FilxZE7VOJod-n-lechyJ0M

GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=

NAS_BACKUP_ENABLED=false
NAS_BACKUP_BASE_PATH=
```

주의:
- `GOOGLE_PRIVATE_KEY`는 줄바꿈을 `\n`으로 바꿔 입력한다.
- Google OAuth 콘솔에도 동일한 배포 콜백 URL을 등록해야 한다.

## 4. Google Sheets 컬럼 확인

`feedback` 시트에는 아래 컬럼이 추가되어 있어야 한다.

```csv
annotations,pose_analysis_json,pose_engine
```

현재 앱 코드는 `feedback!A:S` 범위를 사용한다.

## 5. MediaPipe 배포 방식

현재 MVP 방식:
- npm 패키지: `@mediapipe/tasks-vision`
- wasm/model 파일: CDN 로드
  - `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm`
  - `https://storage.googleapis.com/mediapipe-models/pose_landmarker/...`

장점:
- Vercel 배포 파일 크기를 줄일 수 있다.
- 초기 MVP 검증이 빠르다.

나중에 바꿀 수 있는 방식:
- 모델과 wasm을 `public/models`에 저장해 자체 호스팅
- CDN 장애나 외부 네트워크 의존성을 줄일 수 있다.

## 6. 배포 순서

1. Google Sheets `feedback` 컬럼 확장 확인
2. Google Cloud OAuth redirect URI 등록
3. Vercel 프로젝트 생성 또는 GitHub 연결
4. Vercel 환경변수 입력
5. Vercel 빌드 실행
6. 배포 URL에서 아래 흐름 확인
   - 로그인
   - 프로 화면
   - 실제 영상 기록 열기
   - 현재 장면 캡쳐
   - 실제 본 분석 표시
   - 피드백 저장
   - 저장된 피드백 다시 열기

## 7. 배포 후 테스트 기준

통과 기준:
- 페이지 첫 로딩 오류 없음
- `@mediapipe/tasks-vision` 로드 오류 없음
- 캡쳐 후 "실제 뼈각도 분석 완료" 표시
- 분석 결과가 `poseAnalysis`로 저장됨
- 저장된 피드백 재진입 시 "저장된 실제 뼈각도 분석을 불러왔습니다." 표시
- Google Sheets에 피드백 row가 추가됨

## 8. 남은 리스크

- 실제 사용자 업로드 영상은 Vercel에 저장하지 않는다.
- 모바일 웹에서는 파일 선택/카메라 접근 브라우저 권한 차이를 추가 테스트해야 한다.
- 골프 스윙 프레임에 몸 일부가 잘리면 MediaPipe 검출률이 낮아질 수 있다.
- 각도값은 자동 판정이 아니라 프로가 참고하는 보조 정보로 표시해야 한다.
