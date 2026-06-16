export type Mode = "member" | "pro";
export type AccountRole = Mode | "admin";

export type Page =
  | "home"
  | "records"
  | "upload"
  | "detail"
  | "training"
  | "training-result"
  | "room"
  | "invite"
  | "signup"
  | "join-room"
  | "member-messages"
  | "more"
  | "pro-home"
  | "pro-rooms"
  | "pro-room-detail"
  | "pro-member"
  | "pro-messages"
  | "pro-feedback"
  | "pro-training-review";

export type GoToPage = (page: Page) => void;

export type MediaType = "video" | "image";

export type TrainingAssignment = {
  id: string;
  assignmentType?: "room_common" | "personal" | "self";
  memberId?: string;
  title: string;
  meta: string;
  roomId?: string;
  status?: string;
  goal?: string;
  recordGuide?: string;
  proName?: string;
  dueLabel?: string;
  requireMedia?: boolean;
  createdAtLabel?: string;
};

export type LessonDrillTemplate = {
  id: string;
  courseType: "단기" | "장기";
  category: string;
  title: string;
  duration: string;
  goal: string;
  recordGuide: string;
  drills: string[];
};

export type TrainingResult = {
  id: string;
  assignmentId: string;
  title: string;
  memberName: string;
  count: string;
  difficulty: string;
  memo: string;
  shareToRoom: boolean;
  attachmentLabel?: string;
  proComment?: string;
  status: "제출됨" | "확인 완료";
  createdAtLabel: string;
};

export type PrototypeAccount = {
  id: string;
  username: string;
  password?: string;
  loginId?: string;
  passwordHash?: string;
  passwordSalt?: string;
  authProvider?: "local" | "google" | "kakao" | "apple";
  emailVerified?: boolean;
  termsAgreedAt?: string;
  role: AccountRole;
  displayName: string;
  phone?: string;
  organization?: string;
  profileImageUrl?: string;
  golfExperience?: string;
  mainGoal?: string;
  bio?: string;
};

export type RecordItem = {
  id: string;
  memberId?: string;
  memberName?: string;
  title: string;
  meta: string;
  media: MediaType;
  badge?: string;
  thumbnailUrl?: string;
  mediaUrl?: string;
  bodyAngle?: string;
  recordType?: string;
  cameraAngle?: string;
  memo?: string;
  roomId?: string;
  roomName?: string;
  sharedAt?: string;
};

export type PrototypeRoom = {
  id: string;
  name: string;
  purpose: string;
  inviteCode: string;
  proId: string;
  proName: string;
  createdAtLabel: string;
};

export type RoomMembership = {
  id: string;
  roomId: string;
  memberId: string;
  memberName: string;
  joinedAtLabel: string;
};

export type PrototypeMessage = {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  roomId?: string;
  messageType: "text" | "invite" | "request" | "system";
  content: string;
  relatedId?: string;
  readAt?: string;
  createdAt?: string;
  status?: string;
};

export type DirectoryPerson = {
  id: string;
  userId: string;
  name: string;
  profileImageUrl?: string;
  meta: string;
  badge: string;
};

export type UploadDraft = {
  media: MediaType;
  fileName: string;
  durationLabel: string;
  thumbnailUrl?: string;
  mediaUrl?: string;
};

export type FeedbackAnnotation = {
  id: string;
  kind: "text" | "line" | "arrow" | "rect" | "circle";
  color: string;
  text?: string;
  x: number;
  y: number;
  x2?: number;
  y2?: number;
  width?: number;
  height?: number;
};

export type PoseLandmarkPoint = {
  id: number;
  name: string;
  x: number;
  y: number;
  z?: number;
  visibility?: number;
};

export type PoseSegment = {
  id: string;
  label: string;
  from: PoseLandmarkPoint;
  to: PoseLandmarkPoint;
};

export type PoseAngleResult = {
  id: string;
  label: string;
  value: number;
  x: number;
  y: number;
};

export type PoseAnalysisResult = {
  engine: "mediapipe_pose_landmarker";
  analyzedAt: string;
  landmarks: PoseLandmarkPoint[];
  segments: PoseSegment[];
  angles: PoseAngleResult[];
};

export type FeedbackItem = {
  id: string;
  recordId: string;
  proName: string;
  goalComment: string;
  focusComment: string;
  stickerComment: string;
  snapshotUrl?: string;
  poseAnglesVisible?: boolean;
  hiddenAngleMarkIds?: string[];
  annotations?: FeedbackAnnotation[];
  poseAnalysis?: PoseAnalysisResult;
  poseEngine?: string;
  createdAtLabel: string;
};

export type RoomSummary = {
  id: string;
  name: string;
  summary: string;
  status: string;
  members: Array<{
    id: string;
    label: string;
    muted?: boolean;
  }>;
};

export type FeedbackSummary = {
  id: string;
  proName: string;
  title: string;
  comment: string;
  timeLabel: string;
};

export type ProDashboardMetric = {
  id: string;
  value: string;
  label: string;
};

export type ProRoomSummary = {
  id: string;
  name: string;
  meta: string;
  status: string;
};

export type ProMemberSummary = {
  id: string;
  name: string;
  meta: string;
};
