export type SheetDefinition = {
  name: string;
  columns: string[];
};

export const golfAlignSheets: SheetDefinition[] = [
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
      "status",
      "last_login_at",
      "profile_archive_candidate",
      "login_id",
      "password_hash",
      "password_salt",
      "auth_provider",
      "email_verified",
      "terms_agreed_at"
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
      "pro_badge_enabled",
      "created_at",
      "updated_at",
      "status"
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
      "created_at",
      "updated_at",
      "status"
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
      "max_uses",
      "used_count",
      "expires_at",
      "created_at",
      "updated_at",
      "status"
    ]
  },
  {
    name: "room_members",
    columns: [
      "id",
      "room_id",
      "member_user_id",
      "member_name",
      "joined_at",
      "status",
      "join_source",
      "invite_code"
    ]
  },
  {
    name: "connections",
    columns: [
      "id",
      "requester_user_id",
      "receiver_user_id",
      "requester_role",
      "receiver_role",
      "status",
      "created_at",
      "updated_at"
    ]
  },
  {
    name: "room_join_requests",
    columns: [
      "id",
      "member_user_id",
      "member_name",
      "pro_user_id",
      "pro_name",
      "requested_room_id",
      "message",
      "status",
      "created_at",
      "updated_at"
    ]
  },
  {
    name: "room_invitations",
    columns: [
      "id",
      "room_id",
      "room_name",
      "pro_user_id",
      "pro_name",
      "member_user_id",
      "member_name",
      "message",
      "status",
      "created_at",
      "updated_at"
    ]
  },
  {
    name: "messages",
    columns: [
      "id",
      "sender_user_id",
      "sender_name",
      "receiver_user_id",
      "receiver_name",
      "room_id",
      "message_type",
      "content",
      "related_id",
      "read_at",
      "created_at",
      "status"
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
      "created_at",
      "updated_at",
      "status"
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
      "focus_comment",
      "summary_comment",
      "next_action",
      "created_at",
      "updated_at",
      "status",
      "pro_name",
      "snapshot_url",
      "pose_angles_visible",
      "hidden_angle_mark_ids",
      "annotations",
      "pose_analysis_json",
      "pose_engine"
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
      "due_date",
      "require_media",
      "created_at",
      "updated_at",
      "status"
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
      "status",
      "title",
      "member_name",
      "pro_comment"
    ]
  }
];
