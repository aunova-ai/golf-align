import type {
  FeedbackSummary,
  RecordItem,
  RoomSummary,
  TrainingAssignment
} from "@/components/golfalign/types";

export const latestFeedback: FeedbackSummary = {
  id: "fb_mock_001",
  proName: "김프로",
  title: "김프로의 새로운 코멘트",
  comment: "백스윙 때 왼쪽 어깨 위치를 확인하세요.",
  timeLabel: "방금 전"
};

export const todayTrainings: TrainingAssignment[] = [
  {
    id: "assign_mock_001",
    title: "어프로치 100개",
    meta: "김프로방 · 공통 드릴",
    status: "진행 중",
    goal: "30m 거리감 안정",
    recordGuide: "반복 후 사진 또는 영상 선택 업로드"
  },
  {
    id: "assign_mock_002",
    title: "스윙 100개",
    meta: "개인 훈련 · 비공개",
    status: "대기",
    goal: "리듬 균형 유지",
    recordGuide: "반복 후 메모"
  }
];

export const recentRecords: RecordItem[] = [
  {
    id: "rec_mock_001",
    title: "24.05.21 연습",
    meta: "7번 아이언 · 측면",
    media: "video",
    badge: "피드백 완료"
  },
  {
    id: "rec_mock_002",
    title: "퍼팅 라인 체크",
    meta: "퍼터 · 이미지",
    media: "image",
    badge: "김프로방 공유됨"
  }
];

export const roomSummary: RoomSummary = {
  id: "room_mock_001",
  name: "김프로 · 드라이버 교정반",
  summary: "새 피드백 1개 · 공통 드릴 1개 · 개인 과제 1개",
  status: "참여 중",
  members: [
    { id: "member_self", label: "나" },
    { id: "member_park", label: "박" },
    { id: "member_lee", label: "이" },
    { id: "member_more", label: "+9", muted: true }
  ]
};
