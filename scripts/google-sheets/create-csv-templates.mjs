import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..", "..");
const outDir = resolve(root, "data", "google-sheets", "templates");

const sheets = [
  {
    name: "users",
    columns: [
      "id",
      "role",
      "name",
      "nickname",
      "email",
      "phone",
      "profile_image_provider",
      "profile_image_path",
      "profile_image_file_id",
      "profile_image_url",
      "profile_image_updated_at",
      "public_profile_enabled",
      "preferred_language",
      "golf_experience",
      "average_score",
      "main_goal",
      "injury_note",
      "created_at",
      "updated_at",
      "status"
    ],
    sample: [
      "usr_001",
      "member",
      "김회원",
      "김회원",
      "member@example.com",
      "010-0000-0000",
      "drive",
      "/GolfAlign/Profile Images/active/usr_001.webp",
      "",
      "",
      "",
      "true",
      "ko",
      "6개월",
      "105",
      "100타 깨기",
      "",
      "2026-05-14T10:00:00+09:00",
      "2026-05-14T10:00:00+09:00",
      "active"
    ]
  },
  {
    name: "pro_profiles",
    columns: [
      "id",
      "user_id",
      "display_name",
      "center_name",
      "lesson_area",
      "lesson_type",
      "career_text",
      "certificate_text",
      "contact_phone",
      "contact_url",
      "pro_badge_enabled",
      "created_at",
      "updated_at",
      "status"
    ],
    sample: [
      "pro_001",
      "usr_100",
      "김프로",
      "Golf Center A",
      "서울 강남",
      "실내, 온라인",
      "10년 레슨 경력",
      "프로 인증 예정",
      "",
      "",
      "true",
      "2026-05-14T10:00:00+09:00",
      "2026-05-14T10:00:00+09:00",
      "active"
    ]
  },
  {
    name: "lesson_rooms",
    columns: [
      "id",
      "pro_id",
      "owner_user_id",
      "name",
      "description",
      "room_type",
      "visibility",
      "member_profile_visibility",
      "default_result_visibility",
      "created_at",
      "updated_at",
      "status"
    ],
    sample: [
      "room_001",
      "pro_001",
      "usr_100",
      "김프로 드라이버 교정방",
      "초급/중급 스윙 교정",
      "private",
      "invite_only",
      "name_profile_only",
      "pro_only",
      "2026-05-14T10:00:00+09:00",
      "2026-05-14T10:00:00+09:00",
      "active"
    ]
  },
  {
    name: "room_invites",
    columns: [
      "id",
      "room_id",
      "pro_id",
      "invite_code",
      "invite_url",
      "invite_title",
      "invite_message",
      "max_uses",
      "used_count",
      "expires_at",
      "created_at",
      "updated_at",
      "status"
    ],
    sample: [
      "inv_001",
      "room_001",
      "pro_001",
      "GA-2026",
      "https://golfalign.app/invite/GA-2026",
      "김프로 레슨방 초대",
      "GolfAlign에서 훈련을 관리합니다.",
      "30",
      "0",
      "",
      "2026-05-14T10:00:00+09:00",
      "2026-05-14T10:00:00+09:00",
      "active"
    ]
  },
  {
    name: "room_members",
    columns: [
      "id",
      "room_id",
      "user_id",
      "member_role",
      "display_name",
      "profile_image_file_id",
      "public_profile_enabled",
      "joined_from_invite_id",
      "joined_at",
      "last_activity_at",
      "created_at",
      "updated_at",
      "status"
    ],
    sample: [
      "rm_001",
      "room_001",
      "usr_001",
      "member",
      "김회원",
      "",
      "true",
      "inv_001",
      "2026-05-14T10:00:00+09:00",
      "2026-05-14T10:00:00+09:00",
      "2026-05-14T10:00:00+09:00",
      "2026-05-14T10:00:00+09:00",
      "active"
    ]
  },
  {
    name: "records",
    columns: [
      "id",
      "user_id",
      "record_type",
      "file_type",
      "title",
      "club_type",
      "camera_angle",
      "duration_sec",
      "original_duration_sec",
      "selected_start_sec",
      "selected_end_sec",
      "file_size_mb",
      "storage_provider",
      "storage_file_id",
      "storage_url",
      "playback_policy",
      "thumbnail_provider",
      "thumbnail_file_id",
      "thumbnail_url",
      "snapshot_count",
      "backup_provider",
      "backup_path",
      "sync_status",
      "visibility",
      "memo",
      "recorded_at",
      "created_at",
      "updated_at",
      "status"
    ],
    sample: [
      "rec_001",
      "usr_001",
      "swing",
      "video",
      "7번 아이언 측면 스윙",
      "iron7",
      "side",
      "5.4",
      "24.8",
      "12.0",
      "17.4",
      "18.5",
      "drive",
      "",
      "",
      "download_only",
      "drive",
      "",
      "",
      "3",
      "nas",
      "",
      "uploaded",
      "private",
      "백스윙이 빠른 것 같아요.",
      "2026-05-14T09:00:00+09:00",
      "2026-05-14T10:00:00+09:00",
      "2026-05-14T10:00:00+09:00",
      "active"
    ]
  },
  {
    name: "record_snapshots",
    columns: [
      "id",
      "record_id",
      "user_id",
      "snapshot_type",
      "captured_at_sec",
      "image_provider",
      "image_file_id",
      "image_url",
      "width",
      "height",
      "created_at",
      "updated_at",
      "status"
    ],
    sample: [
      "rsnap_001",
      "rec_001",
      "usr_001",
      "middle",
      "2.7",
      "drive",
      "",
      "",
      "1280",
      "720",
      "2026-05-14T10:00:00+09:00",
      "2026-05-14T10:00:00+09:00",
      "active"
    ]
  },
  {
    name: "shared_records",
    columns: [
      "id",
      "room_id",
      "user_id",
      "record_id",
      "shared_to_pro_id",
      "permission",
      "shared_at",
      "revoked_at",
      "created_at",
      "updated_at",
      "status"
    ],
    sample: [
      "shr_001",
      "room_001",
      "usr_001",
      "rec_001",
      "pro_001",
      "comment",
      "2026-05-14T10:00:00+09:00",
      "",
      "2026-05-14T10:00:00+09:00",
      "2026-05-14T10:00:00+09:00",
      "active"
    ]
  },
  {
    name: "feedback",
    columns: [
      "id",
      "room_id",
      "pro_id",
      "user_id",
      "record_id",
      "goal_comment",
      "good_comment",
      "focus_comment",
      "summary_comment",
      "swing_phase",
      "problem_type",
      "priority",
      "next_action",
      "created_at",
      "updated_at",
      "status"
    ],
    sample: [
      "fb_001",
      "room_001",
      "pro_001",
      "usr_001",
      "rec_001",
      "이번 주는 어드레스 정렬을 먼저 맞춥니다.",
      "피니시는 안정적입니다.",
      "백스윙 때 왼쪽 어깨가 빨리 열립니다.",
      "하프스윙으로 방향성을 먼저 잡겠습니다.",
      "backswing",
      "alignment",
      "high",
      "하프스윙 50개 후 측면 영상 업로드",
      "2026-05-14T10:00:00+09:00",
      "2026-05-14T10:00:00+09:00",
      "active"
    ]
  },
  {
    name: "snapshot_feedback",
    columns: [
      "id",
      "feedback_id",
      "record_id",
      "record_snapshot_id",
      "pro_id",
      "user_id",
      "timestamp_sec",
      "snapshot_provider",
      "snapshot_file_id",
      "snapshot_url",
      "backup_path",
      "sticker_type",
      "short_comment",
      "detail_comment",
      "created_at",
      "updated_at",
      "status"
    ],
    sample: [
      "snap_001",
      "fb_001",
      "rec_001",
      "rsnap_001",
      "pro_001",
      "usr_001",
      "2.4",
      "drive",
      "",
      "",
      "",
      "note",
      "어깨 열림",
      "다운스윙 시작 때 왼쪽 어깨가 먼저 열립니다.",
      "2026-05-14T10:00:00+09:00",
      "2026-05-14T10:00:00+09:00",
      "active"
    ]
  },
  {
    name: "training_assignments",
    columns: [
      "id",
      "room_id",
      "pro_id",
      "user_id",
      "assignment_scope",
      "title",
      "goal",
      "description",
      "reps_target",
      "success_target",
      "duration_text",
      "due_date",
      "require_media",
      "result_visibility_default",
      "source_type",
      "created_at",
      "updated_at",
      "status"
    ],
    sample: [
      "assign_001",
      "room_001",
      "pro_001",
      "usr_001",
      "personal",
      "어프로치 100개",
      "30m 거리감 안정",
      "피니시를 2초 유지하세요.",
      "100",
      "70",
      "20분",
      "2026-05-21",
      "optional",
      "pro_only",
      "pro",
      "2026-05-14T10:00:00+09:00",
      "2026-05-14T10:00:00+09:00",
      "active"
    ]
  },
  {
    name: "training_results",
    columns: [
      "id",
      "assignment_id",
      "room_id",
      "user_id",
      "actual_reps",
      "success_count",
      "difficulty",
      "member_note",
      "result_record_id",
      "visibility",
      "completed_at",
      "created_at",
      "updated_at",
      "status"
    ],
    sample: [
      "result_001",
      "assign_001",
      "room_001",
      "usr_001",
      "100",
      "72",
      "normal",
      "30m 거리감은 좋아졌지만 방향이 흔들립니다.",
      "",
      "pro_only",
      "2026-05-14T20:00:00+09:00",
      "2026-05-14T20:00:00+09:00",
      "2026-05-14T20:00:00+09:00",
      "submitted"
    ]
  },
  {
    name: "training_reviews",
    columns: [
      "id",
      "training_result_id",
      "assignment_id",
      "room_id",
      "pro_id",
      "user_id",
      "review_comment",
      "decision",
      "next_assignment_id",
      "created_at",
      "updated_at",
      "status"
    ],
    sample: [
      "review_001",
      "result_001",
      "assign_001",
      "room_001",
      "pro_001",
      "usr_001",
      "어프로치는 충분합니다. 다음 주에는 퍼팅 거리감 과제로 넘어갑니다.",
      "complete",
      "",
      "2026-05-14T21:00:00+09:00",
      "2026-05-14T21:00:00+09:00",
      "active"
    ]
  }
];

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

await mkdir(outDir, { recursive: true });

for (const sheet of sheets) {
  const rows = [
    sheet.columns.map(csvEscape).join(","),
    sheet.sample.map(csvEscape).join(",")
  ];
  await writeFile(resolve(outDir, `${sheet.name}.csv`), `${rows.join("\n")}\n`, "utf8");
}

const index = [
  "# GolfAlign Google Sheets CSV Templates",
  "",
  "각 CSV 파일은 Google Sheets의 같은 이름 시트에 가져오기 위한 초기 템플릿입니다.",
  "첫 번째 행은 컬럼명, 두 번째 행은 예시 데이터입니다.",
  "",
  ...sheets.map((sheet) => `- ${sheet.name}.csv`)
];

await writeFile(resolve(outDir, "README.md"), `${index.join("\n")}\n`, "utf8");

console.log(`Created ${sheets.length} CSV templates in ${outDir}`);
