import type {
  ProDashboardMetric,
  ProMemberSummary,
  ProRoomSummary,
  RecordItem,
  TrainingAssignment
} from "@/components/golfalign/types";

export const proMetrics: ProDashboardMetric[] = [
  { id: "metric_feedback", value: "3", label: "피드백" },
  { id: "metric_training", value: "2", label: "훈련 확인" },
  { id: "metric_reshoot", value: "1", label: "재촬영" }
];

export const proRooms: ProRoomSummary[] = [
  {
    id: "pro_room_001",
    name: "드라이버 교정반",
    meta: "회원 12명 · 공통 드릴 1개 · 피드백 대기 2건",
    status: "운영 중"
  },
  {
    id: "pro_room_002",
    name: "초급 어프로치반",
    meta: "회원 7명 · 훈련 확인 2건",
    status: "확인 필요"
  }
];

export const proMembers: ProMemberSummary[] = [
  {
    id: "pro_member_001",
    name: "박회원",
    meta: "피드백 대기 · 최근 업로드 1개"
  },
  {
    id: "pro_member_002",
    name: "이회원",
    meta: "훈련 결과 확인 필요"
  }
];

export const sharedRecordForReview: RecordItem = {
  id: "shared_rec_001",
  title: "드라이버 정면 스윙",
  meta: "오늘 업로드 · 피드백 대기",
  media: "video",
  badge: "확인 필요"
};

export const memberTrainingForReview: TrainingAssignment = {
  id: "assign_review_001",
  title: "릴리즈 타이밍 연습",
  meta: "100개 · 영상 선택 첨부",
  status: "진행 중"
};
