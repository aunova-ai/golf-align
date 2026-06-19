# GolfAlign DB 구조 v0.5

작성일: 2026-05-09  
상태: MVP 개발 전 기준안  
목적: Google Sheets 임시 DB, Google Drive/NAS 저장, 추후 PostgreSQL/Supabase 전환까지 고려한 데이터 구조를 정리한다.

## 1. 설계 원칙

MVP에서는 Google Sheets를 임시 DB처럼 사용한다.  
영상/이미지는 Google Drive를 임시 저장/전달용으로 사용하고, NAS를 백업/장기 저장소로 사용한다.

정식 출시 전까지는 다음 원칙으로 간다.

1. 회원의 원본 영상/이미지는 가능하면 사용자 기기에 둔다.
2. 앱에는 5초 권장, 최대 7초 영상만 업로드한다.
3. 7초 초과 영상은 업로드 전 시작 지점을 선택하고, 선택 구간만 저장한다.
4. 영상 업로드 시 피드백용 스냅샷 3장(시작, 중간, 마무리)을 먼저 생성해 저장한다.
5. 업로드한 원본 영상은 앱에서 스트리밍하지 않고, 필요할 때 다운로드 후 기기에서 재생한다.
6. 영상/이미지는 Google Drive에 먼저 저장하고, NAS에 백업한다.
7. DB에는 파일 자체가 아니라 파일 위치와 메타데이터를 저장한다.
8. 나중에 Supabase, PostgreSQL, S3/R2로 교체하기 쉽도록 컬럼명을 일반화한다.
9. 프로는 회원이 공유한 기록만 볼 수 있다.
10. 프로방 회원 목록은 이름과 프로필 이미지만 공개한다.
11. 다른 회원의 기록, 피드백, 훈련 결과는 비공개다.

## 2. MVP 필수 시트/테이블

MVP 필수:

- `users`
- `pro_profiles`
- `lesson_rooms`
- `room_invites`
- `invite_logs`
- `room_members`
- `records`
- `shared_records`
- `feedback`
- `record_snapshots`
- `snapshot_feedback`
- `snapshot_annotations`
- `training_assignments`
- `training_results`
- `training_reviews`
- `feature_flags`
- `system_logs`

MVP 이후 추가:

- `lesson_programs`
- `lesson_categories`
- `lesson_items`
- `round_teaser`
- `payments`
- `center_profiles`
- `center_staff`
- `revenue_reports`

커리큘럼 관련 `lesson_programs`, `lesson_categories`, `lesson_items`는 프로와 상의 후 별도 확정한다.

## 3. 공통 컬럼 규칙

가능하면 모든 시트에 아래 필드를 둔다.

| 컬럼명 | 설명 | 예시 | 필수 |
|---|---|---|---|
| id | 고유 ID | usr_001 | 필수 |
| created_at | 생성일시 | 2026-05-09T10:30:00+09:00 | 필수 |
| updated_at | 수정일시 | 2026-05-09T11:00:00+09:00 | 필수 |
| status | 상태 | active, inactive, deleted | 필수 |

ID 접두어 예시:

| 대상 | 접두어 |
|---|---|
| 사용자 | usr_ |
| 프로필 | pro_ |
| 프로방 | room_ |
| 초대 | inv_ |
| 기록 | rec_ |
| 공유기록 | shr_ |
| 피드백 | fb_ |
| 스냅샷 | snap_ |
| 훈련 과제 | assign_ |
| 훈련 결과 | result_ |
| 리뷰 | review_ |

## 4. users

사용자 계정 기본 정보다.  
일반 회원, 프로, 관리자 모두 이 테이블에 들어간다.

| 컬럼명 | 설명 | 예시 | 필수 |
|---|---|---|---|
| id | 사용자 ID | usr_001 | 필수 |
| role | 역할 | member, pro, admin | 필수 |
| name | 실명 또는 표시명 | 김회원 | 필수 |
| nickname | 앱 표시 닉네임 | 김회원 | 선택 |
| email | 이메일 | user@example.com | 선택 |
| phone | 휴대폰 | 010-0000-0000 | 선택 |
| profile_image_provider | 프로필 이미지 저장소 | drive, nas, local, none | 선택 |
| profile_image_path | 프로필 이미지 경로 | /GolfAlign/Profile Images/active/usr_001.webp | 선택 |
| profile_image_file_id | 프로필 이미지 파일 ID | drive_file_001 | 선택 |
| profile_image_url | 프로필 이미지 접근 URL | https://... | 선택 |
| profile_image_updated_at | 프로필 이미지 수정일시 | 2026-05-09T11:00:00+09:00 | 선택 |
| public_profile_enabled | 프로방 내 이름/프로필 공개 여부 | true | 필수 |
| preferred_language | 선호 언어 | ko, en | 필수 |
| golf_experience | 골프 경력 | 6개월, 3년 | 선택 |
| average_score | 평균 스코어 | 105 | 선택 |
| main_goal | 목표 | 100타 깨기 | 선택 |
| injury_note | 부상/통증 메모 | 허리 통증 | 선택 |
| created_at | 생성일시 | 2026-05-09T10:30:00+09:00 | 필수 |
| updated_at | 수정일시 | 2026-05-09T11:00:00+09:00 | 필수 |
| status | 상태 | active | 필수 |

권한:

- 회원은 자기 정보만 수정한다.
- 프로는 프로방에 가입한 회원의 공개 프로필만 본다.
- 관리자만 전체 조회 가능하다.

프로필 이미지 정책:

- MVP에서는 Google Drive의 GolfAlign 폴더 안에 `Profile Images` 폴더를 만들고 보관한다.
- 업로드 원본은 앱에서 512x512 정사각형 이미지로 변환한 뒤 저장한다.
- 앱에서는 원본 대신 변환된 512x512 이미지만 사용한다.
- 정식 확장 전까지는 Google Drive 보관을 기본으로 하고, 장기 미접속 회원의 이미지만 NAS 이동 후보로 관리한다.

## 5. pro_profiles

프로 전용 프로필 정보다.

| 컬럼명 | 설명 | 예시 | 필수 |
|---|---|---|---|
| id | 프로필 ID | pro_001 | 필수 |
| user_id | users.id | usr_100 | 필수 |
| display_name | 프로 표시명 | 김프로 | 필수 |
| center_name | 소속 센터 | Golf Center A | 선택 |
| lesson_area | 활동 지역 | 서울 강남 | 선택 |
| lesson_type | 레슨 유형 | 실내, 필드, 온라인 | 선택 |
| career_text | 경력 요약 | KPGA 투어 경력 | 선택 |
| certificate_text | 자격/인증 | KPGA, KLPGA | 선택 |
| contact_phone | 공개 연락처 | 010-0000-0000 | 선택 |
| contact_url | 외부 링크 | https://... | 선택 |
| pro_badge_enabled | 인증 배지 사용 여부 | true | 필수 |
| created_at | 생성일시 | 2026-05-09T10:30:00+09:00 | 필수 |
| updated_at | 수정일시 | 2026-05-09T11:00:00+09:00 | 필수 |
| status | 상태 | active | 필수 |

권한:

- 프로 본인과 관리자만 수정한다.
- 회원은 프로방 또는 초대 화면에서 필요한 요약 정보만 본다.

## 6. lesson_rooms

프로가 회원을 초대하고 관리하는 방이다.

| 컬럼명 | 설명 | 예시 | 필수 |
|---|---|---|---|
| id | 프로방 ID | room_001 | 필수 |
| pro_id | pro_profiles.id | pro_001 | 필수 |
| owner_user_id | 프로 users.id | usr_100 | 필수 |
| name | 방 이름 | 김프로 1:1 레슨방 | 필수 |
| description | 방 설명 | 스윙 교정 전용 | 선택 |
| room_type | 방 유형 | private, group | 필수 |
| visibility | 검색 노출 여부 | invite_only | 필수 |
| member_profile_visibility | 회원 목록 공개 범위 | name_profile_only | 필수 |
| default_result_visibility | 훈련 결과 기본 공개 | pro_only | 필수 |
| created_at | 생성일시 | 2026-05-09T10:30:00+09:00 | 필수 |
| updated_at | 수정일시 | 2026-05-09T11:00:00+09:00 | 필수 |
| status | 상태 | active | 필수 |

권한:

- 프로는 자기 방을 관리한다.
- 회원은 가입한 방만 본다.
- 방 회원 목록은 이름/프로필 이미지만 표시한다.

## 7. room_invites

카카오톡, 문자, 메시지로 공유 가능한 초대 링크 정보다.

| 컬럼명 | 설명 | 예시 | 필수 |
|---|---|---|---|
| id | 초대 ID | inv_001 | 필수 |
| room_id | lesson_rooms.id | room_001 | 필수 |
| pro_id | pro_profiles.id | pro_001 | 필수 |
| invite_code | 초대 코드 | KIMPRO-7A2B | 필수 |
| invite_url | 초대 URL | https://golfalign.app/invite/KIMPRO-7A2B | 필수 |
| invite_title | 초대 제목 | 김프로 레슨방 초대 | 필수 |
| invite_message | 초대 메시지 | GolfAlign에서 훈련을 관리합니다. | 선택 |
| max_uses | 최대 사용 수 | 30 | 선택 |
| used_count | 사용 수 | 4 | 필수 |
| expires_at | 만료일시 | 2026-06-01T23:59:59+09:00 | 선택 |
| created_at | 생성일시 | 2026-05-09T10:30:00+09:00 | 필수 |
| updated_at | 수정일시 | 2026-05-09T11:00:00+09:00 | 필수 |
| status | 상태 | active, expired, disabled | 필수 |

동작:

- 미가입 사용자가 링크를 열면 가입 화면으로 이동한다.
- 가입 완료 후 초대된 프로방 참여 화면으로 돌아온다.
- 기존 기록은 자동 공유하지 않고 사용자가 선택하게 한다.

## 8. invite_logs

초대 링크 유입과 가입 전환을 기록한다.

| 컬럼명 | 설명 | 예시 | 필수 |
|---|---|---|---|
| id | 로그 ID | invlog_001 | 필수 |
| invite_id | room_invites.id | inv_001 | 필수 |
| room_id | lesson_rooms.id | room_001 | 필수 |
| user_id | 가입 후 users.id | usr_010 | 선택 |
| event_type | 이벤트 | opened, signed_up, joined_room | 필수 |
| device_hint | 기기 정보 | mobile_chrome | 선택 |
| referrer | 유입 경로 | kakao, sms, direct | 선택 |
| created_at | 생성일시 | 2026-05-09T10:30:00+09:00 | 필수 |
| status | 상태 | active | 필수 |

활용:

- 초대 링크 효과 확인
- 가입 전환율 확인
- 어느 채널에서 가입이 잘 되는지 확인

## 9. room_members

프로방에 가입한 회원 목록이다.

| 컬럼명 | 설명 | 예시 | 필수 |
|---|---|---|---|
| id | 방 회원 ID | rm_001 | 필수 |
| room_id | lesson_rooms.id | room_001 | 필수 |
| user_id | users.id | usr_001 | 필수 |
| member_role | 방 안 역할 | member, assistant, pro | 필수 |
| display_name | 방 안 표시명 | 김회원 | 필수 |
| profile_image_file_id | 프로필 이미지 파일 ID | drive_file_001 | 선택 |
| public_profile_enabled | 이름/프로필 공개 여부 | true | 필수 |
| joined_from_invite_id | room_invites.id | inv_001 | 선택 |
| joined_at | 가입일시 | 2026-05-09T10:30:00+09:00 | 필수 |
| last_activity_at | 최근 활동 | 2026-05-09T20:00:00+09:00 | 선택 |
| created_at | 생성일시 | 2026-05-09T10:30:00+09:00 | 필수 |
| updated_at | 수정일시 | 2026-05-09T11:00:00+09:00 | 필수 |
| status | 상태 | active, left, blocked | 필수 |

권한:

- 같은 방 회원은 이름/프로필 이미지만 볼 수 있다.
- 프로는 회원별 상세 기록을 볼 수 있다. 단, 공유된 기록만 가능하다.

## 10. records

회원이 업로드하거나 저장한 영상/이미지 기록이다.

| 컬럼명 | 설명 | 예시 | 필수 |
|---|---|---|---|
| id | 기록 ID | rec_001 | 필수 |
| user_id | users.id | usr_001 | 필수 |
| record_type | 기록 종류 | swing, putting, approach | 필수 |
| file_type | 파일 종류 | video, image | 필수 |
| title | 기록 제목 | 7번 아이언 측면 | 필수 |
| club_type | 클럽 | driver, iron7, wedge, putter | 선택 |
| camera_angle | 촬영 각도 | front, side, rear, putting_line | 선택 |
| duration_sec | 영상 길이 | 5.4 | 선택 |
| original_duration_sec | 원본 영상 길이 | 24.8 | 선택 |
| selected_start_sec | 선택 구간 시작 | 12.0 | 선택 |
| selected_end_sec | 선택 구간 종료 | 18.8 | 선택 |
| file_size_mb | 파일 크기 | 18.5 | 선택 |
| storage_provider | 주 저장소 | drive, nas, local, s3 | 필수 |
| storage_file_id | 저장소 파일 ID | drive_file_001 | 선택 |
| storage_url | 접근 URL | https://... | 선택 |
| playback_policy | 재생 방식 | download_only, in_app_preview | 필수 |
| thumbnail_provider | 썸네일 저장소 | drive, nas, local | 선택 |
| thumbnail_file_id | 썸네일 파일 ID | drive_thumb_001 | 선택 |
| thumbnail_url | 썸네일 접근 URL | https://... | 선택 |
| snapshot_count | 생성된 스냅샷 수 | 3 | 선택 |
| backup_provider | 백업 저장소 | nas, none | 선택 |
| backup_path | NAS 백업 경로 | /GolfAlign/records/usr_001/rec_001.mp4 | 선택 |
| sync_status | 동기화 상태 | local_only, uploaded, backed_up, failed | 필수 |
| visibility | 공개 범위 | private, shared_to_room | 필수 |
| memo | 회원 메모 | 오른쪽으로 밀림 | 선택 |
| recorded_at | 실제 촬영일시 | 2026-05-09T09:00:00+09:00 | 선택 |
| created_at | 생성일시 | 2026-05-09T10:30:00+09:00 | 필수 |
| updated_at | 수정일시 | 2026-05-09T11:00:00+09:00 | 필수 |
| status | 상태 | active, archived, deleted | 필수 |

영상 정책:

- 안내: 5초 권장
- 허용: 최대 7초
- 7초 초과 영상은 업로드 전에 시작 지점을 선택한다.
- 선택한 시작 지점부터 최대 7초 구간만 잘라 저장한다.
- 업로드 직후 시작, 중간, 마무리 스냅샷 3장을 생성한다.
- 앱에서는 스냅샷과 썸네일을 먼저 보여주고, 원본 영상은 다운로드 후 기기에서 재생한다.
- MVP 권장 최대 크기: 30MB
- 원본 장기 보관은 사용자 기기 또는 NAS 기준

권한:

- 기본은 회원 본인만 조회한다.
- 프로는 `shared_records`에 연결된 기록만 조회한다.

## 11. record_snapshots

영상 업로드 시 자동 생성되거나 사용자가 선택한 정지 이미지다.  
프로의 스티커 피드백은 이 스냅샷을 기준으로 작성한다.

| 컬럼명 | 설명 | 예시 | 필수 |
|---|---|---|---|
| id | 스냅샷 ID | rsnap_001 | 필수 |
| record_id | records.id | rec_001 | 필수 |
| user_id | users.id | usr_001 | 필수 |
| snapshot_type | 스냅샷 종류 | start, middle, finish, custom | 필수 |
| captured_at_sec | 선택 구간 기준 캡처 시간 | 2.4 | 선택 |
| image_provider | 이미지 저장소 | drive, nas, local | 필수 |
| image_file_id | 이미지 파일 ID | drive_snap_001 | 선택 |
| image_url | 이미지 접근 URL | https://... | 선택 |
| width | 이미지 너비 | 1280 | 선택 |
| height | 이미지 높이 | 720 | 선택 |
| created_at | 생성일시 | 2026-05-09T12:00:00+09:00 | 필수 |
| updated_at | 수정일시 | 2026-05-09T12:00:00+09:00 | 필수 |
| status | 상태 | active, deleted | 필수 |

생성 원칙:

- 영상이 7초 이하이면 전체 길이 기준으로 시작, 중간, 마무리 스냅샷을 만든다.
- 영상이 7초 초과이면 선택된 5~7초 구간 기준으로 스냅샷을 만든다.
- 이미지는 Google Drive에 먼저 저장하고, 추후 NAS 또는 전용 스토리지로 옮길 수 있게 경로만 DB에 남긴다.

## 12. shared_records

회원이 프로방에 선택적으로 공유한 기록이다.

| 컬럼명 | 설명 | 예시 | 필수 |
|---|---|---|---|
| id | 공유 ID | shr_001 | 필수 |
| room_id | lesson_rooms.id | room_001 | 필수 |
| user_id | users.id | usr_001 | 필수 |
| record_id | records.id | rec_001 | 필수 |
| shared_to_pro_id | pro_profiles.id | pro_001 | 필수 |
| permission | 권한 | view, comment | 필수 |
| shared_at | 공유일시 | 2026-05-09T12:00:00+09:00 | 필수 |
| revoked_at | 공유 해제일시 |  | 선택 |
| created_at | 생성일시 | 2026-05-09T12:00:00+09:00 | 필수 |
| updated_at | 수정일시 | 2026-05-09T12:00:00+09:00 | 필수 |
| status | 상태 | active, revoked | 필수 |

원칙:

- 프로방 가입만으로 기존 기록이 자동 공유되지 않는다.
- 회원이 선택한 기록만 공유된다.
- 공유 해제 가능 구조를 둔다.

## 13. feedback

프로가 기록 전체에 남기는 피드백이다.

| 컬럼명 | 설명 | 예시 | 필수 |
|---|---|---|---|
| id | 피드백 ID | fb_001 | 필수 |
| room_id | lesson_rooms.id | room_001 | 필수 |
| pro_id | pro_profiles.id | pro_001 | 필수 |
| user_id | 회원 users.id | usr_001 | 필수 |
| record_id | records.id | rec_001 | 필수 |
| goal_comment | 목표 코멘트 | 이번 주는 어드레스 정렬을 맞춥니다. | 선택 |
| good_comment | 잘한 점 | 피니시는 안정적입니다. | 선택 |
| focus_comment | 신경쓸 점 | 백스윙 때 왼쪽 어깨가 빨리 열립니다. | 선택 |
| summary_comment | 요약 | 하프스윙으로 방향성을 먼저 잡겠습니다. | 필수 |
| swing_phase | 관련 구간 | address, backswing, impact, finish | 선택 |
| problem_type | 문제 유형 | slice, topping, fat_shot | 선택 |
| priority | 우선순위 | high, medium, low | 선택 |
| next_action | 다음 과제 | 하프스윙 50개 후 측면 영상 업로드 | 선택 |
| created_at | 생성일시 | 2026-05-09T12:00:00+09:00 | 필수 |
| updated_at | 수정일시 | 2026-05-09T12:00:00+09:00 | 필수 |
| status | 상태 | active, hidden, deleted | 필수 |

피드백 원칙:

- 회원 화면에는 짧게 보인다.
- 상세 설명은 눌렀을 때 확인한다.
- 목표와 신경쓸 점 중심으로 작성한다.

## 14. snapshot_feedback

영상 정지 스냅샷 또는 이미지 위에 남기는 피드백이다.

| 컬럼명 | 설명 | 예시 | 필수 |
|---|---|---|---|
| id | 스냅샷 ID | snap_001 | 필수 |
| feedback_id | feedback.id | fb_001 | 필수 |
| record_id | records.id | rec_001 | 필수 |
| record_snapshot_id | record_snapshots.id | rsnap_001 | 선택 |
| pro_id | pro_profiles.id | pro_001 | 필수 |
| user_id | 회원 users.id | usr_001 | 필수 |
| timestamp_sec | 영상 기준 시간 | 2.4 | 선택 |
| snapshot_provider | 스냅샷 저장소 | drive, nas | 필수 |
| snapshot_file_id | 스냅샷 파일 ID | drive_snap_001 | 선택 |
| snapshot_url | 접근 URL | https://... | 선택 |
| backup_path | NAS 백업 경로 | /GolfAlign/snapshots/snap_001.png | 선택 |
| sticker_type | 스티커 종류 | note, angle, line, circle | 필수 |
| short_comment | 말풍선 짧은 문구 | 어깨 열림 주의 | 필수 |
| detail_comment | 상세 설명 | 다운스윙 시작 때 왼쪽 어깨가 먼저 열립니다. | 선택 |
| created_at | 생성일시 | 2026-05-09T12:00:00+09:00 | 필수 |
| updated_at | 수정일시 | 2026-05-09T12:00:00+09:00 | 필수 |
| status | 상태 | active, hidden, deleted | 필수 |

원칙:

- 영상 전체에 직접 쓰지 않고 정지 스냅샷 기준으로 작성한다.
- 기본은 짧은 말풍선으로 표시한다.
- 누르면 상세 설명을 보여준다.

## 15. snapshot_annotations

스냅샷 위의 선, 각도, 원형 표시 위치 정보다.

| 컬럼명 | 설명 | 예시 | 필수 |
|---|---|---|---|
| id | 주석 ID | ann_001 | 필수 |
| snapshot_feedback_id | snapshot_feedback.id | snap_001 | 필수 |
| annotation_type | 주석 종류 | line, angle, circle, arrow, text | 필수 |
| position_data | 위치 데이터 JSON | {"x":0.42,"y":0.31} | 필수 |
| color | 색상 | amber, green, red | 선택 |
| label | 짧은 라벨 | 어깨선 | 선택 |
| created_at | 생성일시 | 2026-05-09T12:00:00+09:00 | 필수 |
| updated_at | 수정일시 | 2026-05-09T12:00:00+09:00 | 필수 |
| status | 상태 | active, deleted | 필수 |

position_data 원칙:

- 픽셀값보다 비율값을 사용한다.
- 이미지 크기가 달라져도 같은 위치에 표시되게 한다.

## 16. training_assignments

프로가 보낸 과제 또는 회원이 만든 개인 훈련이다.

| 컬럼명 | 설명 | 예시 | 필수 |
|---|---|---|---|
| id | 과제 ID | assign_001 | 필수 |
| room_id | lesson_rooms.id | room_001 | 선택 |
| pro_id | pro_profiles.id | pro_001 | 선택 |
| user_id | 대상 회원 users.id | usr_001 | 필수 |
| assignment_scope | 과제 범위 | room_common, personal, self | 필수 |
| title | 과제명 | 하프스윙 50개 | 필수 |
| goal | 목표 | 방향성 안정 | 선택 |
| description | 설명 | 피니시 3초 유지 | 선택 |
| reps_target | 목표 반복 수 | 50 | 선택 |
| success_target | 목표 성공 수 | 30 | 선택 |
| duration_text | 소요 시간 | 15분 | 선택 |
| due_date | 마감일 | 2026-05-12 | 선택 |
| require_media | 미디어 요구 | required, optional, none | 필수 |
| result_visibility_default | 결과 공개 기본값 | private, pro_only, room_visible | 필수 |
| source_type | 생성 출처 | pro, member, template | 필수 |
| created_at | 생성일시 | 2026-05-09T12:00:00+09:00 | 필수 |
| updated_at | 수정일시 | 2026-05-09T12:00:00+09:00 | 필수 |
| status | 상태 | active, completed, archived, deleted | 필수 |

assignment_scope:

| 값 | 의미 |
|---|---|
| room_common | 프로방 공통 드릴 |
| personal | 프로가 특정 회원에게 보낸 개인 과제 |
| self | 회원이 직접 만든 개인 훈련 |

## 17. training_results

회원이 훈련을 수행한 결과다.

| 컬럼명 | 설명 | 예시 | 필수 |
|---|---|---|---|
| id | 결과 ID | result_001 | 필수 |
| assignment_id | training_assignments.id | assign_001 | 필수 |
| room_id | lesson_rooms.id | room_001 | 선택 |
| user_id | users.id | usr_001 | 필수 |
| actual_reps | 실제 반복 수 | 50 | 선택 |
| success_count | 성공 수 | 32 | 선택 |
| difficulty | 난이도 | easy, normal, hard | 선택 |
| member_note | 회원 메모 | 오른쪽으로 조금 밀림 | 선택 |
| result_record_id | 첨부 기록 records.id | rec_010 | 선택 |
| visibility | 공개 범위 | private, pro_only | 필수 |
| completed_at | 완료일시 | 2026-05-09T20:00:00+09:00 | 필수 |
| created_at | 생성일시 | 2026-05-09T20:00:00+09:00 | 필수 |
| updated_at | 수정일시 | 2026-05-09T20:00:00+09:00 | 필수 |
| status | 상태 | submitted, reviewed, deleted | 필수 |

원칙:

- 영상/이미지 첨부는 선택이다.
- 프로 과제 결과는 기본적으로 프로만 볼 수 있다.
- 공통 드릴이어도 개인 결과는 공개하지 않는다.

## 18. training_reviews

프로가 훈련 결과에 남기는 짧은 확인 코멘트다.

| 컬럼명 | 설명 | 예시 | 필수 |
|---|---|---|---|
| id | 리뷰 ID | review_001 | 필수 |
| training_result_id | training_results.id | result_001 | 필수 |
| assignment_id | training_assignments.id | assign_001 | 필수 |
| room_id | lesson_rooms.id | room_001 | 필수 |
| pro_id | pro_profiles.id | pro_001 | 필수 |
| user_id | 회원 users.id | usr_001 | 필수 |
| review_comment | 프로 코멘트 | 어프로치는 충분하니 다음 주는 퍼팅 과제로 넘어갑니다. | 필수 |
| decision | 다음 판단 | continue, complete, change_task | 선택 |
| next_assignment_id | 다음 과제 ID | assign_002 | 선택 |
| created_at | 생성일시 | 2026-05-09T20:30:00+09:00 | 필수 |
| updated_at | 수정일시 | 2026-05-09T20:30:00+09:00 | 필수 |
| status | 상태 | active, hidden, deleted | 필수 |

## 19. feature_flags

MVP에서 기능을 켜고 끄기 위한 설정이다.

| 컬럼명 | 설명 | 예시 | 필수 |
|---|---|---|---|
| id | 설정 ID | flag_001 | 필수 |
| key | 기능 키 | round_recruit_enabled | 필수 |
| value | 값 | false | 필수 |
| description | 설명 | 라운드 모집 기능 활성화 여부 | 선택 |
| created_at | 생성일시 | 2026-05-09T10:00:00+09:00 | 필수 |
| updated_at | 수정일시 | 2026-05-09T10:00:00+09:00 | 필수 |
| status | 상태 | active | 필수 |

초기 기능 플래그:

| key | 초기값 | 설명 |
|---|---|---|
| round_recruit_enabled | false | 라운드 모집 실제 기능 |
| ai_analysis_enabled | false | AI 분석 자동화 |
| pro_invite_enabled | true | 프로방 초대 링크 |
| language_switch_enabled | true | 언어 설정 |
| nas_backup_enabled | true | NAS 백업 |

## 20. system_logs

오류와 동기화 상태 확인용 로그다.

| 컬럼명 | 설명 | 예시 | 필수 |
|---|---|---|---|
| id | 로그 ID | log_001 | 필수 |
| user_id | 관련 사용자 | usr_001 | 선택 |
| event_type | 이벤트 종류 | upload_failed, nas_sync_failed | 필수 |
| target_type | 대상 종류 | record, snapshot, invite | 선택 |
| target_id | 대상 ID | rec_001 | 선택 |
| message | 로그 메시지 | NAS 백업 실패 | 필수 |
| metadata | 추가 정보 JSON | {"retry":1} | 선택 |
| created_at | 생성일시 | 2026-05-09T21:00:00+09:00 | 필수 |
| status | 상태 | active, resolved | 필수 |

## 21. 저장소 설계

### Google Drive

역할:

- MVP 미디어 임시 저장
- 웹앱에서 미디어 접근
- 프로 피드백용 스냅샷 저장

권장 폴더 구조:

```text
GolfAlign/
  records/
    {user_id}/
      {record_id}.mp4
      {record_id}.jpg
  thumbnails/
    {user_id}/
      {record_id}.jpg
  snapshots/
    {feedback_id}/
      {snapshot_id}.png
```

### NAS

MVP 기준 실제 장비:

- 모델: ipTIME NAS1 Dual
- 내부 IP: `192.168.0.102`
- 외부 접속 주소: `https://novart.ipdisk.co.kr`
- 역할: Google Drive 임시 저장 이후 장기 백업/아카이브
- 주의: NAS 연결 실패가 앱 사용을 막으면 안 되며, 백업은 비동기 후처리로 둔다.

역할:

- 장기 백업
- Google Drive 용량 절약
- 추후 자체 서버 전환 대비

권장 폴더 구조:

```text
/GolfAlign/
  users/
    {user_id}/
      records/
      thumbnails/
      snapshots/
  rooms/
    {room_id}/
      shared_records/
      feedback/
  backups/
    sheets/
```

### 사용자 기기

역할:

- 원본 영상 보관
- 앱 업로드 전 임시 저장
- 네트워크가 느릴 때 원본 재업로드용

주의:

- 기기 원본은 앱 DB에서 직접 접근할 수 없다.
- DB에는 `local_only` 상태와 메타정보만 저장한다.

## 22. 권한 규칙

### 회원

- 자기 `users` 정보 조회/수정
- 자기 `records` 조회/수정
- 자기 `training_results` 조회/작성
- 가입한 `lesson_rooms` 조회
- 자기 기록을 `shared_records`로 공유/해제
- 자기에게 온 `feedback`, `snapshot_feedback`, `training_reviews` 조회

### 프로

- 자기 `pro_profiles` 수정
- 자기 `lesson_rooms` 관리
- 자기 방의 `room_members` 조회
- 공유받은 `records` 조회
- 공유받은 기록에 `feedback`, `snapshot_feedback`, `snapshot_annotations` 작성
- 자기 방 회원에게 `training_assignments` 작성
- 자기 방 회원의 `training_results` 조회
- `training_reviews` 작성

### 같은 방 회원끼리

볼 수 있음:

- 이름
- 프로필 이미지
- 방 참여 여부

볼 수 없음:

- 다른 회원의 기록
- 다른 회원의 영상/이미지
- 다른 회원의 피드백
- 다른 회원의 훈련 결과
- 다른 회원의 프로 코멘트

### 관리자

- 전체 조회 가능
- 삭제는 논리 삭제 기준으로 처리

## 23. Google Sheets 적용 순서

초기에는 모든 테이블을 한 스프레드시트 안의 시트로 만든다.

추천 생성 순서:

1. `users`
2. `pro_profiles`
3. `lesson_rooms`
4. `room_invites`
5. `room_members`
6. `records`
7. `shared_records`
8. `feedback`
9. `snapshot_feedback`
10. `snapshot_annotations`
11. `training_assignments`
12. `training_results`
13. `training_reviews`
14. `feature_flags`
15. `system_logs`

컬럼명은 영문 snake_case로 유지한다.  
시트 설명 문서는 별도 한글 문서로 관리한다.

## 24. 추후 전환 기준

Google Sheets에서 PostgreSQL/Supabase로 전환할 시점:

- 동시 테스트 사용자가 30명 이상
- 기록 수가 1,000개 이상
- 영상/이미지 접근 속도 문제가 반복됨
- 권한 제어가 복잡해짐
- 프로방이 10개 이상 운영됨
- 결제 또는 센터 관리가 필요해짐

전환 시 유지할 컬럼:

- `id`
- `user_id`
- `room_id`
- `record_id`
- `storage_provider`
- `storage_file_id`
- `backup_path`
- `visibility`
- `created_at`
- `updated_at`
- `status`

## 25. 다음 작업

다음 단계는 HTML 샘플 v0.4 업데이트다.

반영할 것:

- 설정 화면에 언어 선택 추가
- 프로방 초대/가입 흐름 다듬기
- 훈련 화면은 커리큘럼 확정 전 구조만 유지
- DB 구조에 맞춰 화면 문구 일부 정리
- 공유용 HTML 파일을 v0.4로 복사 저장
