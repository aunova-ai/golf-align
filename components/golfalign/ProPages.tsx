import Image from "next/image";
import { PointerEvent, useEffect, useRef, useState } from "react";
import {
  proRepository
} from "@/lib/repositories/proRepository";
import { lessonDrillTemplates } from "@/lib/mock/lessonDrills";
import { poseAngleMarks } from "@/lib/mock/poseAngleMarks";
import { analyzePoseFromImage } from "@/lib/pose/poseAnalysis";
import { sampleProfileImages } from "@/lib/mock/profileImages";
import { ProfileEditor } from "./ProfileEditor";
import {
  Camera,
  Circle,
  Download,
  Eraser,
  Link2,
  Image as ImageIcon,
  MousePointer2,
  Pencil,
  Search,
  Send,
  Square,
  Type as TypeIcon,
  UserPlus
} from "lucide-react";
import type {
  FeedbackAnnotation,
  FeedbackItem,
  PoseAnalysisResult,
  PoseAngleResult,
  PoseSegment,
  DirectoryPerson,
  GoToPage,
  LessonDrillTemplate,
  Page,
  PrototypeAccount,
  PrototypeMessage,
  PrototypeRoom,
  RecordItem,
  RoomMembership,
  TrainingAssignment,
  TrainingResult
} from "./types";
import {
  Badge,
  Avatar,
  Card,
  Chip,
  Field,
  MemberListItem,
  Metric,
  PageHeader,
  ProfileTile,
  RecordListItem,
  Section,
  Sticker,
  TrainingRow
} from "./ui";

const proMetrics = proRepository.getDashboardMetrics();
const proRooms = proRepository.getRooms();
const proMembers = proRepository.getMembers();
const sharedRecordForReview = proRepository.getSharedRecordForReview();
const memberTrainingForReview = proRepository.getMemberTrainingForReview();

function isFeedbackCompleted(record: RecordItem) {
  return record.badge?.includes("피드백 완료") ?? false;
}

const memberDirectory: DirectoryPerson[] = [
  {
    id: "mem_dir_01",
    userId: "member_directory_01",
    name: "최지훈",
    profileImageUrl: sampleProfileImages.liam,
    meta: "서울 강남 · 초급 · 드라이버 슬라이스 교정 희망",
    badge: "신청 가능"
  },
  {
    id: "mem_dir_02",
    userId: "member_directory_02",
    name: "정하린",
    profileImageUrl: sampleProfileImages.chloe,
    meta: "분당 · 6개월차 · 어프로치 거리감 훈련",
    badge: "관심 회원"
  },
  {
    id: "mem_dir_03",
    userId: "member_directory_03",
    name: "오민석",
    profileImageUrl: sampleProfileImages.raj,
    meta: "인천 · 중급 · 필드 스코어 관리",
    badge: "최근 활동"
  }
];

const proMessageSamples = [
  {
    id: "msg_pro_01",
    title: "프로방 신청 · 최지훈",
    meta: "드라이버 교정방 가입을 신청했습니다. 기존 방 또는 새 방에 배정할 수 있습니다.",
    status: "처리 필요"
  },
  {
    id: "msg_pro_02",
    title: "김회원 훈련 결과",
    meta: "어프로치 100개, 스윙 100개 결과를 제출했습니다.",
    status: "확인"
  }
];

function formatMessageForList(message: PrototypeMessage, currentUserId?: string) {
  const isMine = message.senderId === currentUserId;
  const counterpart = isMine ? message.receiverName : message.senderName;
  const status =
    message.messageType === "invite"
      ? "초대"
      : message.messageType === "request"
        ? "신청"
        : message.readAt
          ? "읽음"
          : "새 메시지";

  return {
    id: message.id,
    title: `${isMine ? "보낸 메시지" : "받은 메시지"} · ${counterpart}`,
    meta: message.content,
    source: message,
    status
  };
}

export function ProPages({
  page,
  go,
  activeFeedback,
  activeRecord,
  currentPro,
  memberships,
  onCreateRoom,
  onCreateTrainingAssignment,
  onApproveJoinRequest,
  onRefreshConnections,
  onSelectRecord,
  onSaveFeedback,
  onSaveTrainingReview,
  onUpdateProfile,
  pendingTrainingResults,
  rooms,
  sharedRecords
  , trainingAssignments
}: {
  page: Page;
  go: GoToPage;
  activeFeedback?: FeedbackItem;
  activeRecord?: RecordItem;
  currentPro: PrototypeAccount | null;
  memberships: RoomMembership[];
  onCreateRoom: (data: { name: string; purpose: string }) => Promise<{ ok: true; room: PrototypeRoom } | { ok: false; message: string }>;
  onCreateTrainingAssignment: (assignment: Omit<TrainingAssignment, "id" | "createdAtLabel" | "status">) => void;
  onApproveJoinRequest: (membership: RoomMembership) => void;
  onRefreshConnections?: () => Promise<void> | void;
  onSelectRecord: (recordId: string) => void;
  onSaveFeedback: (feedback: Omit<FeedbackItem, "id" | "createdAtLabel">) => FeedbackItem | void;
  onSaveTrainingReview: (resultId: string, proComment: string) => void;
  onUpdateProfile: (profile: Partial<PrototypeAccount> & { id: string }) => Promise<{ ok: true; account: PrototypeAccount } | { ok: false; message: string }>;
  pendingTrainingResults: TrainingResult[];
  rooms: PrototypeRoom[];
  sharedRecords: RecordItem[];
  trainingAssignments: TrainingAssignment[];
}) {
  const [selectedMemberId, setSelectedMemberId] = useState<string>();
  const selectedMembership =
    memberships.find((membership) => membership.memberId === selectedMemberId) ?? memberships[0];

  function openMember(memberId: string) {
    setSelectedMemberId(memberId);
    go("pro-member");
  }

  switch (page) {
    case "pro-rooms":
      return <ProRoomsPage go={go} onCreateRoom={onCreateRoom} rooms={rooms} />;
    case "pro-room-detail":
      return (
        <ProRoomDetailPage
          go={go}
          memberships={memberships}
          onSelectMember={openMember}
          onCreateTrainingAssignment={onCreateTrainingAssignment}
          rooms={rooms}
          trainingAssignments={trainingAssignments}
        />
      );
    case "pro-member":
      return (
        <ProMemberPage
          go={go}
          onCreateTrainingAssignment={onCreateTrainingAssignment}
          onSelectRecord={onSelectRecord}
          selectedMember={selectedMembership}
          sharedRecords={sharedRecords}
          trainingAssignments={trainingAssignments}
        />
      );
    case "pro-feedback":
      return (
        <ProFeedbackPage
          activeFeedback={activeFeedback}
          activeRecord={activeRecord}
          currentPro={currentPro}
          go={go}
          onSaveFeedback={onSaveFeedback}
        />
      );
    case "pro-training-review":
      return <ProTrainingReviewPage onSaveTrainingReview={onSaveTrainingReview} pendingTrainingResults={pendingTrainingResults} />;
    case "pro-messages":
      return <ProMessagesPage currentPro={currentPro} memberships={memberships} onApproveJoinRequest={onApproveJoinRequest} onRefreshConnections={onRefreshConnections} rooms={rooms} />;
    default:
      return <ProHomePage currentPro={currentPro} go={go} onSelectRecord={onSelectRecord} onUpdateProfile={onUpdateProfile} rooms={rooms} sharedRecords={sharedRecords} />;
  }
}

function ProHomePage({
  currentPro,
  go,
  onSelectRecord,
  onUpdateProfile,
  rooms,
  sharedRecords
}: {
  currentPro: PrototypeAccount | null;
  go: GoToPage;
  onSelectRecord: (recordId: string) => void;
  onUpdateProfile: (profile: Partial<PrototypeAccount> & { id: string }) => Promise<{ ok: true; account: PrototypeAccount } | { ok: false; message: string }>;
  rooms: PrototypeRoom[];
  sharedRecords: RecordItem[];
}) {
  const primaryRoom = rooms[0];
  const pendingRecords = sharedRecords.filter((record) => !isFeedbackCompleted(record));
  const completedRecords = sharedRecords.filter(isFeedbackCompleted).slice(0, 2);
  const reviewRecords = pendingRecords.slice(0, 3);
  return (
    <>
      <PageHeader title="프로 홈" desc="오늘 처리할 피드백과 훈련 결과를 확인합니다." />
      <ProfileEditor account={currentPro} onSave={onUpdateProfile} />
      <Card tone="soft">
        <div className="row spread">
          <div>
            <h3>오늘 확인할 일</h3>
            <p>피드백 대기와 훈련 결과를 빠르게 처리하세요.</p>
          </div>
          <Image src="/assets/golfalign-pro-badge.png" alt="GolfAlign PRO 인증 배지" width={72} height={72} />
        </div>
        <div className="metric-grid">
          {proMetrics.map((metric) => (
            <Metric key={metric.id} value={metric.value} label={metric.label} />
          ))}
        </div>
        {pendingRecords.length > 0 ? (
          <p className="inline-alert">피드백 대기 기록 {pendingRecords.length}개가 있습니다.</p>
        ) : sharedRecords.length > 0 ? (
          <p className="inline-alert done">공유 기록 피드백이 모두 완료됐습니다.</p>
        ) : null}
      </Card>
      {reviewRecords.length > 0 ? (
        <Section title="피드백 대기" action="회원별 보기" onAction={() => go("pro-member")}>
          <div className="stack compact-stack">
            {reviewRecords.map((record) => (
              <RecordListItem
                key={record.id}
                title={record.title}
                meta={record.roomName ? `${record.meta} · ${record.roomName}` : record.meta}
                badge={record.badge ?? "피드백 대기"}
                cta="피드백 작성"
                thumbnailUrl={record.thumbnailUrl}
                onClick={() => onSelectRecord(record.id)}
              />
            ))}
          </div>
        </Section>
      ) : sharedRecords.length > 0 ? (
        <Section title="피드백 대기">
          <Card className="empty-state-card">
            <Badge tone="green">완료</Badge>
            <h3>대기 중인 피드백이 없습니다.</h3>
            <p>새 기록이 공유되면 이 영역에 바로 표시됩니다.</p>
          </Card>
        </Section>
      ) : null}
      {completedRecords.length > 0 ? (
        <Section title="최근 완료 피드백" action="회원별 보기" onAction={() => go("pro-member")}>
          <div className="stack compact-stack">
            {completedRecords.map((record) => (
              <RecordListItem
                key={record.id}
                title={record.title}
                meta={record.roomName ? `${record.meta} · ${record.roomName}` : record.meta}
                badge={record.badge ?? "피드백 완료"}
                cta="피드백 다시 보기"
                thumbnailUrl={record.thumbnailUrl}
                onClick={() => onSelectRecord(record.id)}
              />
            ))}
          </div>
        </Section>
      ) : null}
      <Section title="내 레슨방" action="전체 보기" onAction={() => go("pro-rooms")}>
        <Card>
          <h3>{primaryRoom?.name ?? "새 레슨방을 만들어보세요"}</h3>
          <p>{primaryRoom ? `${primaryRoom.purpose} · 초대코드 ${primaryRoom.inviteCode}` : "회원 초대를 위해 방을 먼저 생성합니다."}</p>
          <button className="primary wide" onClick={() => go("pro-room-detail")}>
            방 보기
          </button>
        </Card>
      </Section>
    </>
  );
}

function ProRoomsPage({
  go,
  onCreateRoom,
  rooms
}: {
  go: GoToPage;
  onCreateRoom: (data: { name: string; purpose: string }) => Promise<{ ok: true; room: PrototypeRoom } | { ok: false; message: string }>;
  rooms: PrototypeRoom[];
}) {
  const [roomName, setRoomName] = useState("드라이버 교정방");
  const [purpose, setPurpose] = useState("초급/중급 스윙 교정");
  const [notice, setNotice] = useState("");

  async function createRoom() {
    const result = await onCreateRoom({ name: roomName, purpose });
    setNotice(result.ok ? `${result.room.name} 생성됨 · 초대코드 ${result.room.inviteCode}` : result.message);
  }

  return (
    <>
      <PageHeader title="레슨방" desc="방별 회원과 진행 상태를 관리합니다." />
      <Card>
        <h3>레슨방 만들기</h3>
        <Field label="방 이름">
          <input className="input" value={roomName} onChange={(event) => setRoomName(event.target.value)} />
        </Field>
        <label className="field-label">레슨 목적</label>
        <textarea className="textarea" value={purpose} onChange={(event) => setPurpose(event.target.value)} />
        {notice ? <p className="save-notice">{notice}</p> : null}
        <button className="primary wide" onClick={createRoom}>레슨방 만들기</button>
      </Card>
      <Section title="운영 중">
        <div className="stack">
          {(rooms.length > 0 ? rooms : []).map((room) => (
            <Card key={room.id}>
              <div className="row spread">
                <div>
                  <h3>{room.name}</h3>
                  <p>{room.purpose} · 초대코드 {room.inviteCode}</p>
                </div>
                <Badge>운영중</Badge>
              </div>
              <button className="primary wide" onClick={() => go("pro-room-detail")}>
                회원 보기
              </button>
            </Card>
          ))}
        </div>
      </Section>
    </>
  );
}

function ProRoomDetailPage({
  go,
  memberships,
  onSelectMember,
  onCreateTrainingAssignment,
  rooms,
  trainingAssignments
}: {
  go: GoToPage;
  memberships: RoomMembership[];
  onSelectMember: (memberId: string) => void;
  onCreateTrainingAssignment: (assignment: Omit<TrainingAssignment, "id" | "createdAtLabel" | "status">) => void;
  rooms: PrototypeRoom[];
  trainingAssignments: TrainingAssignment[];
}) {
  const room = rooms[0];
  const commonDrills = trainingAssignments.filter((assignment) => assignment.roomId === room?.id && assignment.assignmentType === "room_common");
  const [drillTitle, setDrillTitle] = useState("입문 기본기 점검");
  const [drillGoal, setDrillGoal] = useState("그립, 어드레스, 정렬, 피니시 균형을 먼저 안정시킵니다.");
  const [drillGuide, setDrillGuide] = useState("정면/측면 스윙 영상 1개, 피니시 3초 유지 여부, 불편한 부위 메모");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [notice, setNotice] = useState("");

  function applyTemplate(template: LessonDrillTemplate) {
    setSelectedTemplateId(template.id);
    setDrillTitle(template.title);
    setDrillGoal(template.goal);
    setDrillGuide(template.recordGuide);
    setNotice("");
  }

  function createCommonDrill() {
    if (!room) {
      setNotice("레슨방을 먼저 만들어주세요.");
      return;
    }

    onCreateTrainingAssignment({
      assignmentType: "room_common",
      title: drillTitle,
      meta: `${room.name} · 방 공통 드릴`,
      goal: drillGoal,
      recordGuide: drillGuide,
      proName: room.proName,
      roomId: room.id,
      dueLabel: "진행 중",
      requireMedia: false
    });
    setNotice("방 공통 드릴이 회원 프로방과 훈련 탭에 추가됐습니다.");
  }

  return (
    <>
      <PageHeader title={room?.name ?? "레슨방"} desc={room ? `${room.proName} · ${room.purpose}` : "레슨방을 먼저 만들어주세요."} />
      <Card tone="soft">
        <h3>초대 링크</h3>
        <p>회원에게 링크나 코드를 보내 방에 초대합니다.</p>
        <p className="save-notice">초대 코드: {room?.inviteCode ?? "방 생성 필요"}</p>
        <button className="secondary wide">
          <Link2 size={18} />
          초대 링크 복사
        </button>
      </Card>
      <Section title="방 공통 드릴">
        <Card>
          <h3>공통 드릴 만들기</h3>
          <p>방에 가입한 모든 회원에게 보이는 과제입니다. 결과는 각 회원과 프로만 확인합니다.</p>
          <div className="preset-panel">
            <div className="row spread">
              <div>
                <h3>추천 드릴/훈련</h3>
                <p>커리큘럼 초안에서 선택하고 필요하면 수정하세요.</p>
              </div>
              <Badge tone="gray">공통</Badge>
            </div>
            <div className="preset-grid">
              {lessonDrillTemplates.map((template) => (
                <button
                  className={`preset-card ${selectedTemplateId === template.id ? "active" : ""}`}
                  key={template.id}
                  onClick={() => applyTemplate(template)}
                  type="button"
                >
                  <span>{template.courseType} · {template.category}</span>
                  <strong>{template.title}</strong>
                  <small>{template.duration}</small>
                </button>
              ))}
            </div>
          </div>
          <Field label="드릴명">
            <input className="input" value={drillTitle} onChange={(event) => setDrillTitle(event.target.value)} />
          </Field>
          <label className="field-label">목표</label>
          <textarea className="textarea" value={drillGoal} onChange={(event) => setDrillGoal(event.target.value)} />
          <label className="field-label">결과 기록 안내</label>
          <textarea className="textarea" value={drillGuide} onChange={(event) => setDrillGuide(event.target.value)} />
          {notice ? <p className="save-notice">{notice}</p> : null}
          <button className="primary wide" onClick={createCommonDrill}>
            방 공통 드릴 등록
          </button>
        </Card>
        {commonDrills.length > 0 ? (
          <div className="stack compact-stack">
            {commonDrills.map((assignment) => (
              <TrainingRow key={assignment.id} title={assignment.title} meta={assignment.meta} status={assignment.status} />
            ))}
          </div>
        ) : null}
      </Section>
      <Section title="회원 목록">
        <div className="stack">
          {memberships.length > 0 ? (
            memberships.map((member, index) => (
              <MemberListItem
                imageUrl={[sampleProfileImages.miSook, sampleProfileImages.liam, sampleProfileImages.chloe, sampleProfileImages.raj][index % 4]}
                key={member.id}
                name={member.memberName}
                meta={`${member.joinedAtLabel} 가입 · 공유 기록만 확인`}
                onClick={() => onSelectMember(member.memberId)}
              />
            ))
          ) : (
            <Card>
              <h3>아직 가입 회원이 없습니다.</h3>
              <p>초대 코드를 전달하면 회원이 직접 가입할 수 있습니다.</p>
            </Card>
          )}
        </div>
      </Section>
    </>
  );
}

function ProMemberPage({
  onCreateTrainingAssignment,
  onSelectRecord,
  selectedMember,
  sharedRecords,
  trainingAssignments
}: {
  go: GoToPage;
  onCreateTrainingAssignment: (assignment: Omit<TrainingAssignment, "id" | "createdAtLabel" | "status">) => void;
  onSelectRecord: (recordId: string) => void;
  selectedMember?: RoomMembership;
  sharedRecords: RecordItem[];
  trainingAssignments: TrainingAssignment[];
}) {
  const memberRecords = selectedMember
    ? sharedRecords.filter((record) => record.memberId === selectedMember.memberId)
    : sharedRecords;
  const pendingMemberRecords = memberRecords.filter((record) => !isFeedbackCompleted(record));
  const completedMemberRecords = memberRecords.filter(isFeedbackCompleted);
  const pendingRecords = memberRecords.length > 0 ? pendingMemberRecords : [sharedRecordForReview];
  const visibleAssignments = trainingAssignments.filter((assignment) => {
    if (!selectedMember) {
      return true;
    }

    return assignment.memberId === selectedMember.memberId || assignment.roomId === selectedMember.roomId;
  });
  const [trainingTitle, setTrainingTitle] = useState("하프스윙 균형 50개");
  const [trainingGoal, setTrainingGoal] = useState("피니시 자세를 3초 유지하며 균형을 확인합니다.");
  const [trainingGuide, setTrainingGuide] = useState("횟수, 체감 난이도, 선택 이미지/영상을 기록");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [savedNotice, setSavedNotice] = useState("");

  function applyTemplate(template: LessonDrillTemplate) {
    setSelectedTemplateId(template.id);
    setTrainingTitle(template.title);
    setTrainingGoal(template.goal);
    setTrainingGuide(template.recordGuide);
    setSavedNotice("");
  }

  function createTraining() {
    onCreateTrainingAssignment({
      assignmentType: "personal",
      title: trainingTitle,
      meta: `김프로 추천 · ${selectedMember?.memberName ?? "박회원"} · 반복 훈련`,
      memberId: selectedMember?.memberId,
      roomId: selectedMember?.roomId,
      goal: trainingGoal,
      recordGuide: trainingGuide,
      proName: "김프로",
      dueLabel: "마감 2일 전",
      requireMedia: false
    });
    setSavedNotice("훈련 과제가 회원 훈련 목록에 추가됐습니다.");
  }

  return (
    <>
      <PageHeader title={selectedMember?.memberName ?? "박회원"} desc="공유된 기록과 훈련 결과만 확인합니다." />
      {pendingRecords.length > 0 ? (
        <Card>
          <h3>피드백 대기 기록</h3>
          <div className="stack compact-stack">
            {pendingRecords.map((record) => (
              <RecordListItem
                key={record.id}
                title={record.title}
                meta={record.roomName ? `${record.meta} · ${record.roomName}` : record.meta}
                badge={record.badge ?? "확인 필요"}
                cta="피드백 작성"
                thumbnailUrl={record.thumbnailUrl}
                onClick={() => onSelectRecord(record.id)}
              />
            ))}
          </div>
        </Card>
      ) : (
        <Card className="empty-state-card">
          <Badge tone="green">완료</Badge>
          <h3>대기 중인 피드백이 없습니다.</h3>
          <p>이 회원이 새 기록을 공유하면 여기에 표시됩니다.</p>
        </Card>
      )}
      {completedMemberRecords.length > 0 ? (
        <Card>
          <h3>완료 기록</h3>
          <div className="stack compact-stack">
            {completedMemberRecords.map((record) => (
              <RecordListItem
                key={record.id}
                title={record.title}
                meta={record.roomName ? `${record.meta} · ${record.roomName}` : record.meta}
                badge={record.badge ?? "피드백 완료"}
                cta="피드백 다시 보기"
                thumbnailUrl={record.thumbnailUrl}
                onClick={() => onSelectRecord(record.id)}
              />
            ))}
          </div>
        </Card>
      ) : null}
      <Card>
        <h3>진행 중 과제</h3>
        <div className="stack compact-stack">
          {(visibleAssignments.length > 0 ? visibleAssignments : [memberTrainingForReview]).map((assignment) => (
            <TrainingRow
              key={assignment.id}
              title={assignment.title}
              meta={assignment.meta}
              status={assignment.status}
            />
          ))}
        </div>
      </Card>
      <Card>
        <h3>훈련 과제 보내기</h3>
        <p>{selectedMember ? `${selectedMember.memberName} 회원에게 전송됩니다.` : "가입 회원이 없으면 예시 회원 기준으로 표시됩니다."}</p>
        <div className="preset-panel">
          <div className="row spread">
            <div>
              <h3>추천 드릴/훈련</h3>
              <p>커리큘럼 초안에서 바로 선택하고 필요한 내용만 수정하세요.</p>
            </div>
            <Badge tone="gray">수정 가능</Badge>
          </div>
          <div className="preset-grid">
            {lessonDrillTemplates.map((template) => (
              <button
                className={`preset-card ${selectedTemplateId === template.id ? "active" : ""}`}
                key={template.id}
                onClick={() => applyTemplate(template)}
                type="button"
              >
                <span>{template.courseType} · {template.category}</span>
                <strong>{template.title}</strong>
                <small>{template.duration}</small>
              </button>
            ))}
          </div>
          {selectedTemplateId ? (
            <div className="preset-detail">
              {lessonDrillTemplates
                .find((template) => template.id === selectedTemplateId)
                ?.drills.map((drill) => (
                  <Badge key={drill} tone="gray">{drill}</Badge>
                ))}
            </div>
          ) : null}
        </div>
        <Field label="과제명">
          <input className="input" value={trainingTitle} onChange={(event) => setTrainingTitle(event.target.value)} />
        </Field>
        <label className="field-label">목표</label>
        <textarea className="textarea" value={trainingGoal} onChange={(event) => setTrainingGoal(event.target.value)} />
        <label className="field-label">결과 기록 안내</label>
        <textarea className="textarea" value={trainingGuide} onChange={(event) => setTrainingGuide(event.target.value)} />
        {savedNotice ? <p className="save-notice">{savedNotice}</p> : null}
        <button className="primary wide" onClick={createTraining}>
          회원에게 과제 전송
        </button>
      </Card>
    </>
  );
}

type FeedbackTool = "select" | "text" | "line" | "arrow" | "rect" | "circle" | "eraser";

const annotationColors = ["#fff4e0", "#ffd15d", "#e85d3f", "#2f6b4f", "#1f1f1f"];

const poseLayerElements = [
  { id: "pose_spine", className: "skeleton-segment spine" },
  { id: "pose_shoulder", className: "skeleton-segment shoulder" },
  { id: "pose_lead_arm", className: "skeleton-segment lead-arm" },
  { id: "pose_trail_arm", className: "skeleton-segment trail-arm" },
  { id: "pose_hip", className: "skeleton-segment hip" },
  { id: "pose_lead_leg", className: "skeleton-segment lead-leg" },
  { id: "pose_stance", className: "skeleton-segment stance" },
  { id: "pose_arc_hip", className: "angle-arc arc-hip" },
  { id: "pose_arc_arm", className: "angle-arc arc-arm" }
];

function getPointerPercent(event: PointerEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * 100,
    y: ((event.clientY - rect.top) / rect.height) * 100
  };
}

function ProFeedbackPage({
  activeFeedback,
  activeRecord,
  currentPro,
  go,
  onSaveFeedback
}: {
  activeFeedback?: FeedbackItem;
  activeRecord?: RecordItem;
  currentPro: PrototypeAccount | null;
  go: GoToPage;
  onSaveFeedback: (feedback: Omit<FeedbackItem, "id" | "createdAtLabel">) => FeedbackItem | void;
}) {
  const [goalComment, setGoalComment] = useState(
    activeFeedback?.goalComment ?? "이번 주는 어드레스 정렬을 먼저 맞춥니다."
  );
  const [focusComment, setFocusComment] = useState(
    activeFeedback?.focusComment ?? "백스윙 때 왼쪽 어깨가 너무 빨리 열리지 않게 해주세요."
  );
  const [stickerComment, setStickerComment] = useState(activeFeedback?.stickerComment ?? "어깨 열림");
  const [savedNotice, setSavedNotice] = useState("");
  const [lastSavedFeedback, setLastSavedFeedback] = useState<FeedbackItem | null>(null);
  const [isReturning, setIsReturning] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(0.5);
  const [capturedFrameUrl, setCapturedFrameUrl] = useState("");
  const [poseAnalysis, setPoseAnalysis] = useState<PoseAnalysisResult | undefined>(activeFeedback?.poseAnalysis);
  const [poseAnalysisStatus, setPoseAnalysisStatus] = useState("");
  const [showPoseAngles, setShowPoseAngles] = useState(true);
  const [eraserMode, setEraserMode] = useState(false);
  const [hiddenAngleMarks, setHiddenAngleMarks] = useState<string[]>([]);
  const [annotations, setAnnotations] = useState<FeedbackAnnotation[]>(activeFeedback?.annotations ?? []);
  const [activeTool, setActiveTool] = useState<FeedbackTool>("select");
  const [annotationColor, setAnnotationColor] = useState(annotationColors[1]);
  const [draftText, setDraftText] = useState(activeFeedback?.stickerComment ?? "자세 체크");
  const [draftShape, setDraftShape] = useState<FeedbackAnnotation | null>(null);
  const [dragTarget, setDragTarget] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const feedbackVideoRef = useRef<HTMLVideoElement | null>(null);
  const visibleFeedback = lastSavedFeedback ?? activeFeedback;
  const isFeedbackSaved = Boolean(visibleFeedback);
  const feedbackImageUrl = capturedFrameUrl || activeFeedback?.snapshotUrl || activeRecord?.thumbnailUrl;
  const canInspectVideo = activeRecord?.media === "video" && Boolean(activeRecord.mediaUrl);
  const isVideoWithoutSource = activeRecord?.media === "video" && !activeRecord.mediaUrl;
  const visibleAngleMarks = poseAngleMarks.filter((mark) => !hiddenAngleMarks.includes(mark.id));
  const visiblePoseElements = poseLayerElements.filter((element) => !hiddenAngleMarks.includes(element.id));
  const visiblePoseSegments = poseAnalysis?.segments.filter((segment) => !hiddenAngleMarks.includes(segment.id)) ?? [];
  const visiblePoseAngles = poseAnalysis?.angles.filter((angle) => !hiddenAngleMarks.includes(angle.id)) ?? [];
  const hasRealPoseAnalysis = Boolean(poseAnalysis?.segments.length || poseAnalysis?.angles.length);
  const hasCapturedFrame = Boolean(capturedFrameUrl);
  const hasSavedSnapshot = Boolean(activeFeedback?.snapshotUrl);
  const snapshotSourceLabel = hasCapturedFrame
    ? "현재 장면 캡쳐 저장"
    : hasSavedSnapshot
      ? "저장된 피드백 캡쳐"
      : "업로드 썸네일 기준";
  const angleLayerLabel = showPoseAngles
    ? hiddenAngleMarks.length > 0
      ? `뼈각도 표시 · ${hiddenAngleMarks.length}개 숨김`
      : "뼈각도 표시"
    : "뼈각도 숨김";

  useEffect(() => {
    setGoalComment(activeFeedback?.goalComment ?? "이번 주는 어드레스 정렬을 먼저 맞춥니다.");
    setFocusComment(activeFeedback?.focusComment ?? "백스윙 때 왼쪽 어깨가 너무 빨리 열리지 않게 해주세요.");
    setStickerComment(activeFeedback?.stickerComment ?? "어깨 열림");
    setSavedNotice("");
    setLastSavedFeedback(null);
    setIsReturning(false);
    setPlaybackRate(0.5);
    setShowPoseAngles(activeFeedback?.poseAnglesVisible ?? true);
    setEraserMode(false);
    setHiddenAngleMarks(activeFeedback?.hiddenAngleMarkIds ?? []);
    setAnnotations(activeFeedback?.annotations ?? []);
    setActiveTool("select");
    setDraftText(activeFeedback?.stickerComment ?? "자세 체크");
    setDraftShape(null);
    setDragTarget(null);
    setCapturedFrameUrl((current) => {
      if (current.startsWith("blob:")) {
        URL.revokeObjectURL(current);
      }
      return "";
    });
    setPoseAnalysis(activeFeedback?.poseAnalysis);
    setPoseAnalysisStatus(activeFeedback?.poseAnalysis ? "저장된 실제 뼈각도 분석을 불러왔습니다." : "");
  }, [activeRecord?.id, activeFeedback?.hiddenAngleMarkIds, activeFeedback?.poseAnglesVisible]);

  useEffect(() => {
    if (feedbackVideoRef.current) {
      feedbackVideoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, activeRecord?.mediaUrl]);

  useEffect(() => {
    return () => {
      if (capturedFrameUrl.startsWith("blob:")) {
        URL.revokeObjectURL(capturedFrameUrl);
      }
    };
  }, [capturedFrameUrl]);

  async function captureFeedbackFrame() {
    const video = feedbackVideoRef.current;
    if (!video) {
      return;
    }

    const canvas = document.createElement("canvas");
    const sourceWidth = video.videoWidth || 1280;
    const sourceHeight = video.videoHeight || 720;
    const scale = Math.min(1, 960 / Math.max(sourceWidth, sourceHeight));
    canvas.width = Math.round(sourceWidth * scale);
    canvas.height = Math.round(sourceHeight * scale);

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const nextUrl = canvas.toDataURL("image/webp", 0.82);
    setCapturedFrameUrl((current) => {
      if (current.startsWith("blob:")) {
        URL.revokeObjectURL(current);
      }
      return nextUrl;
    });
    setStickerComment("자세 각도 체크");
    setDraftText("자세 각도 체크");
    setAnnotations([]);
    setShowPoseAngles(true);
    setEraserMode(false);
    setHiddenAngleMarks([]);
    setPoseAnalysis(undefined);
    setPoseAnalysisStatus("캡쳐샷에서 사람의 본을 분석하는 중입니다...");

    try {
      const analysis = await analyzePoseFromImage(nextUrl);
      setPoseAnalysis(analysis);
      setPoseAnalysisStatus(`실제 뼈각도 분석 완료 · 포인트 ${analysis.landmarks.length}개 · 각도 ${analysis.angles.length}개`);
    } catch (error) {
      setPoseAnalysisStatus(error instanceof Error ? error.message : "뼈각도 분석에 실패했습니다. 기본 가이드 레이어를 사용합니다.");
    }
  }

  function removeAngleMark(markId: string) {
    if (!eraserMode) {
      return;
    }

    setHiddenAngleMarks((current) => (current.includes(markId) ? current : [...current, markId]));
  }

  function removeEditableItem(id: string) {
    if (activeTool !== "eraser") {
      return;
    }

    if (
      id.startsWith("pose_") ||
      id.startsWith("angle_") ||
      id === "feet" ||
      id === "arm" ||
      id === "head" ||
      id === "hip" ||
      id === "back"
    ) {
      setHiddenAngleMarks((current) => (current.includes(id) ? current : [...current, id]));
      return;
    }

    setAnnotations((current) => current.filter((annotation) => annotation.id !== id));
  }

  function addTextAnnotation(point: { x: number; y: number }) {
    const text = draftText.trim() || stickerComment.trim() || "피드백";
    setAnnotations((current) => [
      ...current,
      {
        id: `ann_text_${Date.now()}`,
        kind: "text",
        color: annotationColor,
        text,
        x: point.x,
        y: point.y
      }
    ]);
  }

  function startAnnotationDrag(annotation: FeedbackAnnotation, event: PointerEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (activeTool === "eraser") {
      removeEditableItem(annotation.id);
      return;
    }

    if (activeTool !== "select" && activeTool !== "text") {
      return;
    }

    const point = getPointerPercent(event);
    setDragTarget({
      id: annotation.id,
      offsetX: point.x - annotation.x,
      offsetY: point.y - annotation.y
    });
  }

  function handleAnnotationPointerDown(event: PointerEvent<HTMLDivElement>) {
    const point = getPointerPercent(event);
    if (activeTool === "text") {
      addTextAnnotation(point);
      return;
    }

    if (activeTool === "line" || activeTool === "arrow" || activeTool === "rect" || activeTool === "circle") {
      setDraftShape({
        id: `ann_${activeTool}_${Date.now()}`,
        kind: activeTool,
        color: annotationColor,
        x: point.x,
        y: point.y,
        x2: point.x,
        y2: point.y,
        width: 0,
        height: 0
      });
    }
  }

  function handleAnnotationPointerMove(event: PointerEvent<HTMLDivElement>) {
    const point = getPointerPercent(event);
    if (dragTarget) {
      setAnnotations((current) =>
        current.map((annotation) =>
          annotation.id === dragTarget.id
            ? {
                ...annotation,
                x: Math.min(98, Math.max(2, point.x - dragTarget.offsetX)),
                y: Math.min(98, Math.max(2, point.y - dragTarget.offsetY))
              }
            : annotation
        )
      );
      return;
    }

    if (!draftShape) {
      return;
    }

    setDraftShape({
      ...draftShape,
      x2: point.x,
      y2: point.y,
      width: point.x - draftShape.x,
      height: point.y - draftShape.y
    });
  }

  function handleAnnotationPointerUp() {
    if (draftShape) {
      const width = Math.abs(draftShape.width ?? 0);
      const height = Math.abs(draftShape.height ?? 0);
      if (width > 1 || height > 1 || draftShape.kind === "line" || draftShape.kind === "arrow") {
        setAnnotations((current) => [...current, draftShape]);
      }
    }
    setDraftShape(null);
    setDragTarget(null);
  }

  function saveFeedback() {
    if (!activeRecord) {
      return;
    }

    const savedFeedback = onSaveFeedback({
      recordId: activeRecord.id,
      proName: currentPro?.displayName ?? "김프로",
      goalComment,
      focusComment,
      stickerComment,
      snapshotUrl: feedbackImageUrl,
      poseAnglesVisible: showPoseAngles,
      hiddenAngleMarkIds: hiddenAngleMarks,
      annotations,
      poseAnalysis,
      poseEngine: poseAnalysis?.engine
    });
    setLastSavedFeedback(savedFeedback ?? {
      id: `fb_preview_${Date.now()}`,
      recordId: activeRecord.id,
      proName: currentPro?.displayName ?? "김프로",
      goalComment,
      focusComment,
      stickerComment,
      snapshotUrl: feedbackImageUrl,
      poseAnglesVisible: showPoseAngles,
      hiddenAngleMarkIds: hiddenAngleMarks,
      annotations,
      createdAtLabel: "방금 저장"
    });
    setSavedNotice("피드백이 저장됐습니다. 회원 상세로 돌아가 완료 목록에서 확인합니다.");
    setIsReturning(true);
    window.setTimeout(() => {
      go("pro-member");
    }, 900);
  }

  if (!activeRecord) {
    return (
      <>
        <PageHeader title="스냅샷 피드백 작성" desc="회원이 공유한 기록을 선택하면 영상 확인과 캡쳐 피드백을 시작할 수 있습니다." />
        <Card className="empty-state-card">
          <Badge tone="amber">기록 선택 필요</Badge>
          <h3>피드백할 회원 기록을 먼저 선택해 주세요.</h3>
          <p>프로 홈의 피드백 대기 목록이나 회원 상세의 공유 기록에서 바로 작성할 수 있습니다.</p>
          <div className="empty-action-grid">
            <button className="primary" onClick={() => go("pro-home")} type="button">
              피드백 대기 보기
            </button>
            <button className="secondary" onClick={() => go("pro-member")} type="button">
              회원별 기록 보기
            </button>
          </div>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="스냅샷 피드백 작성" desc="회원 영상을 천천히 확인하고, 몸의 자세 각도 기준으로 필요한 장면을 캡쳐해 피드백합니다." />
      <Card className="analysis-shell pro-analysis-shell">
        <div className="analysis-head">
          <div>
            <div className="record-badges">
              <Badge tone={isFeedbackSaved ? "green" : "amber"}>
                {isFeedbackSaved ? "피드백 완료" : activeRecord ? "피드백 작성 중" : "공유 기록 선택 필요"}
              </Badge>
              {activeRecord ? <Badge tone="gray">{activeRecord.title}</Badge> : null}
            </div>
            <h3>{activeRecord?.memberName ?? "회원 기록"}</h3>
            <p>{activeRecord?.meta ?? "공유된 기록을 선택하면 스냅샷 피드백을 작성할 수 있습니다."}</p>
          </div>
          <button className="secondary">
            <Download size={18} />
            원본
          </button>
        </div>
        {canInspectVideo ? (
          <div className="pro-video-review">
            <video
              ref={feedbackVideoRef}
              src={activeRecord?.mediaUrl}
              controls
              playsInline
              preload="metadata"
            />
            <div className="speed-controls">
              {[0.5, 1].map((rate) => (
                <button
                  className={`chip ${playbackRate === rate ? "active" : ""}`}
                  key={rate}
                  onClick={() => setPlaybackRate(rate)}
                  type="button"
                >
                  {rate}x
                </button>
              ))}
              <button className="secondary" onClick={captureFeedbackFrame} type="button">
                <Camera size={18} />
                현재 장면 캡쳐
              </button>
            </div>
            <p className="feedback-step-note">
              0.5배속으로 확인한 뒤 피드백할 순간에서 멈추고 캡쳐하면, 그 장면이 회원에게 저장됩니다.
            </p>
          </div>
        ) : null}
        <div className="snapshot-tabs compact">
          <Chip active>발 정렬</Chip>
          <Chip>팔/손목</Chip>
          <Chip>고개/허리</Chip>
        </div>
        <div className="angle-layer-toolbar">
          <button
            className={`chip ${showPoseAngles ? "active" : ""}`}
            onClick={() => setShowPoseAngles((current) => !current)}
            type="button"
          >
            뼈각도 {showPoseAngles ? "켜짐" : "꺼짐"}
          </button>
          <button
            className={`chip ${eraserMode ? "active" : ""}`}
            disabled={!showPoseAngles}
            onClick={() => {
              setEraserMode((current) => !current);
              setActiveTool((current) => (current === "eraser" ? "select" : "eraser"));
            }}
            type="button"
          >
            지우개
          </button>
          <button
            className="chip"
            disabled={hiddenAngleMarks.length === 0}
            onClick={() => setHiddenAngleMarks([])}
            type="button"
          >
            복원
          </button>
        </div>
        <div className="feedback-draw-toolbar" aria-label="피드백 편집 도구">
          {[
            { id: "select" as const, label: "이동", icon: <MousePointer2 size={16} /> },
            { id: "text" as const, label: "텍스트", icon: <TypeIcon size={16} /> },
            { id: "line" as const, label: "선", icon: <Pencil size={16} /> },
            { id: "arrow" as const, label: "화살표", icon: <Pencil size={16} /> },
            { id: "rect" as const, label: "사각", icon: <Square size={16} /> },
            { id: "circle" as const, label: "원", icon: <Circle size={16} /> },
            { id: "eraser" as const, label: "삭제", icon: <Eraser size={16} /> }
          ].map((tool) => (
            <button
              className={`chip icon-chip ${activeTool === tool.id ? "active" : ""}`}
              key={tool.id}
              onClick={() => {
                setActiveTool(tool.id);
                setEraserMode(tool.id === "eraser");
              }}
              type="button"
            >
              {tool.icon}
              {tool.label}
            </button>
          ))}
        </div>
        <div className="annotation-options">
          <input
            className="input compact-input"
            value={draftText}
            onChange={(event) => setDraftText(event.target.value)}
            placeholder="캡쳐 위에 넣을 텍스트"
          />
          <div className="color-dots" aria-label="텍스트와 도형 색상">
            {annotationColors.map((color) => (
              <button
                aria-label={`${color} 색상`}
                className={`color-dot ${annotationColor === color ? "active" : ""}`}
                key={color}
                onClick={() => setAnnotationColor(color)}
                style={{ background: color }}
                type="button"
              />
            ))}
          </div>
        </div>
        <div className="snapshot-source-bar">
          <span>{snapshotSourceLabel}</span>
          <strong>{angleLayerLabel}</strong>
        </div>
        {poseAnalysisStatus ? <p className="pose-analysis-status">{poseAnalysisStatus}</p> : null}
        <p className="feedback-step-note">
          {canInspectVideo
            ? "영상은 느린 재생으로 확인하고, 필요한 순간을 캡쳐한 뒤 각도 레이어와 메모를 저장합니다."
            : isVideoWithoutSource
              ? "원본 영상은 회원 기기에 있고, 프로토타입에서는 업로드 썸네일 위에 각도 레이어와 메모를 저장합니다."
            : "이미지 기록은 업로드된 스냅샷 위에 각도 레이어와 메모를 바로 저장합니다."}
        </p>
        <div className="viewer snapshot-viewer">
          {feedbackImageUrl ? <img className="viewer-image" src={feedbackImageUrl} alt={`${activeRecord?.title ?? "피드백"} 스냅샷`} /> : null}
          {showPoseAngles ? (
            <div className={`pose-angle-layer ${eraserMode ? "eraser-active" : ""}`}>
              {visiblePoseSegments.map((segment) => (
                <PoseSegmentButton key={segment.id} segment={segment} onRemove={removeEditableItem} />
              ))}
              {visiblePoseAngles.map((angle) => (
                <PoseAngleButton angle={angle} key={angle.id} onRemove={removeEditableItem} />
              ))}
              {!hasRealPoseAnalysis && visiblePoseElements.map((element) => (
                <button
                  aria-label={`${element.id} 지우기`}
                  className={`${element.className} editable-pose-element`}
                  key={element.id}
                  onClick={() => removeEditableItem(element.id)}
                  type="button"
                />
              ))}
              {!hasRealPoseAnalysis && visibleAngleMarks.map((mark) => (
                <button
                  className="angle-marker"
                  key={mark.id}
                  onClick={() => removeEditableItem(mark.id)}
                  style={mark.style}
                  type="button"
                >
                  {mark.label}
                </button>
              ))}
            </div>
          ) : null}
          <div
            className={`annotation-layer tool-${activeTool}`}
            onPointerDown={handleAnnotationPointerDown}
            onPointerMove={handleAnnotationPointerMove}
            onPointerUp={handleAnnotationPointerUp}
            onPointerLeave={handleAnnotationPointerUp}
          >
            {[...annotations, ...(draftShape ? [draftShape] : [])].map((annotation) => (
              <AnnotationElement
                annotation={annotation}
                isDraft={annotation.id === draftShape?.id}
                key={annotation.id}
                onPointerDown={startAnnotationDrag}
              />
            ))}
          </div>
          <Sticker style={{ top: "18%", left: "54%" }}>{stickerComment}</Sticker>
          <Sticker style={{ top: "56%", left: "30%" }}>허리/골반</Sticker>
          <ImageIcon className="viewer-play" size={30} />
        </div>
        <div className="snapshot-strip">
          <button className="snapshot-chip active">{hasCapturedFrame || hasSavedSnapshot ? "캡쳐 장면" : "썸네일"}</button>
          <button className="snapshot-chip">팔/허리 각도</button>
          <button className="snapshot-chip">{hiddenAngleMarks.length > 0 ? "수정됨" : "원본 레이어"}</button>
        </div>
      </Card>
      <Card className="coach-feedback-form">
        <Field label="목표">
          <input className="input" value={goalComment} onChange={(event) => setGoalComment(event.target.value)} />
        </Field>
        <label className="field-label">신경쓸 것</label>
        <textarea className="textarea" value={focusComment} onChange={(event) => setFocusComment(event.target.value)} />
        <Field label="스냅샷 말풍선">
          <input className="input" value={stickerComment} onChange={(event) => setStickerComment(event.target.value)} />
        </Field>
        <div className="feedback-summary-grid compact-summary">
          <div>
            <span>다음 추천</span>
            <strong>하프스윙 30회 · 피니시 3초 유지</strong>
          </div>
          <div>
            <span>회원에게 보임</span>
            <strong>스냅샷, 말풍선, 목표, 신경쓸 것</strong>
          </div>
        </div>
        {savedNotice ? <p className="save-notice">{savedNotice}</p> : null}
        <button className="primary wide" onClick={saveFeedback} disabled={!activeRecord || isReturning}>
          {isReturning ? "회원 상세로 돌아가는 중" : isFeedbackSaved ? "피드백 다시 저장" : "피드백 저장"}
        </button>
      </Card>
    </>
  );
}

function PoseSegmentButton({
  segment,
  onRemove
}: {
  segment: PoseSegment;
  onRemove: (id: string) => void;
}) {
  const dx = segment.to.x - segment.from.x;
  const dy = segment.to.y - segment.from.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return (
    <button
      aria-label={`${segment.label} 지우기`}
      className="pose-analysis-segment editable-pose-element"
      onClick={() => onRemove(segment.id)}
      style={{
        left: `${segment.from.x}%`,
        top: `${segment.from.y}%`,
        transform: `rotate(${angle}deg)`,
        width: `${length}%`
      }}
      type="button"
    >
      <span className="pose-analysis-dot start" />
      <span className="pose-analysis-dot end" />
    </button>
  );
}

function PoseAngleButton({
  angle,
  onRemove
}: {
  angle: PoseAngleResult;
  onRemove: (id: string) => void;
}) {
  return (
    <button
      className="angle-marker real-angle-marker"
      onClick={() => onRemove(angle.id)}
      style={{ left: `${angle.x}%`, top: `${angle.y}%` }}
      type="button"
    >
      {angle.label} {angle.value}°
    </button>
  );
}

function AnnotationElement({
  annotation,
  isDraft,
  onPointerDown
}: {
  annotation: FeedbackAnnotation;
  isDraft?: boolean;
  onPointerDown: (annotation: FeedbackAnnotation, event: PointerEvent<HTMLButtonElement>) => void;
}) {
  if (annotation.kind === "text") {
    return (
      <button
        className={`feedback-annotation text-annotation ${isDraft ? "draft" : ""}`}
        onPointerDown={(event) => onPointerDown(annotation, event)}
        style={{
          color: annotation.color,
          left: `${annotation.x}%`,
          top: `${annotation.y}%`
        }}
        type="button"
      >
        {annotation.text}
      </button>
    );
  }

  const x2 = annotation.x2 ?? annotation.x;
  const y2 = annotation.y2 ?? annotation.y;
  const left = Math.min(annotation.x, x2);
  const top = Math.min(annotation.y, y2);
  const width = Math.max(1, Math.abs(x2 - annotation.x));
  const height = Math.max(1, Math.abs(y2 - annotation.y));
  const lineLength = Math.max(1, Math.hypot(x2 - annotation.x, y2 - annotation.y));
  const angle = Math.atan2(y2 - annotation.y, x2 - annotation.x) * (180 / Math.PI);

  if (annotation.kind === "line" || annotation.kind === "arrow") {
    return (
      <button
        className={`feedback-annotation line-annotation ${annotation.kind === "arrow" ? "arrow" : ""} ${isDraft ? "draft" : ""}`}
        onPointerDown={(event) => onPointerDown(annotation, event)}
        style={{
          background: annotation.color,
          color: annotation.color,
          left: `${annotation.x}%`,
          top: `${annotation.y}%`,
          transform: `rotate(${angle}deg)`,
          width: `${lineLength}%`
        }}
        type="button"
      />
    );
  }

  return (
    <button
      className={`feedback-annotation shape-annotation ${annotation.kind} ${isDraft ? "draft" : ""}`}
      onPointerDown={(event) => onPointerDown(annotation, event)}
      style={{
        borderColor: annotation.color,
        height: `${height}%`,
        left: `${left}%`,
        top: `${top}%`,
        width: `${width}%`
      }}
      type="button"
    />
  );
}

function ProTrainingReviewPage({
  onSaveTrainingReview,
  pendingTrainingResults
}: {
  onSaveTrainingReview: (resultId: string, proComment: string) => void;
  pendingTrainingResults: TrainingResult[];
}) {
  const [commentByResultId, setCommentByResultId] = useState<Record<string, string>>({});
  const visibleResults = pendingTrainingResults.length > 0
    ? pendingTrainingResults
    : [
        {
          id: "mock_training_result",
          assignmentId: memberTrainingForReview.id,
          title: "어프로치 연습 100개",
          memberName: "박회원",
          count: "72개 성공",
          difficulty: "보통",
          memo: "거리감은 안정됐지만 방향이 조금 흔들립니다.",
          shareToRoom: true,
          attachmentLabel: "이미지 첨부",
          status: "제출됨" as const,
          createdAtLabel: "예시"
        }
      ];

  return (
    <>
      <PageHeader title="훈련 결과 확인" desc="회원의 훈련 결과에 짧은 코멘트를 남깁니다." />
      <div className="stack">
        {visibleResults.map((result) => {
          const comment = commentByResultId[result.id] ?? "훈련 기록이 충분합니다. 다음 주에는 거리감보다 방향 안정 과제로 넘어가겠습니다.";

          return (
            <Card key={result.id}>
              <Badge>{result.status}</Badge>
              <h3>{result.title}</h3>
              <p>
                {result.memberName} · {result.count} · 난이도 {result.difficulty} · {result.attachmentLabel ?? "첨부 없음"}
              </p>
              <p>{result.memo}</p>
              <label className="field-label">프로 코멘트</label>
              <textarea
                className="textarea"
                value={comment}
                onChange={(event) =>
                  setCommentByResultId((current) => ({
                    ...current,
                    [result.id]: event.target.value
                  }))
                }
              />
              <button className="primary wide" onClick={() => onSaveTrainingReview(result.id, comment)}>
                확인 완료
              </button>
            </Card>
          );
        })}
      </div>
    </>
  );
}

function ProMessagesPage({
  currentPro,
  memberships,
  onApproveJoinRequest,
  onRefreshConnections,
  rooms
}: {
  currentPro: PrototypeAccount | null;
  memberships: RoomMembership[];
  onApproveJoinRequest: (membership: RoomMembership) => void;
  onRefreshConnections?: () => Promise<void> | void;
  rooms: PrototypeRoom[];
}) {
  const [query, setQuery] = useState("");
  const [directoryPeople, setDirectoryPeople] = useState<DirectoryPerson[]>([]);
  const [messages, setMessages] = useState<PrototypeMessage[]>([]);
  const [notice, setNotice] = useState("");
  const [selectedMember, setSelectedMember] = useState<DirectoryPerson | null>(null);
  const [messageDraft, setMessageDraft] = useState("");
  const targetRoom = rooms[0];
  const directorySource = directoryPeople.length > 0 ? directoryPeople : memberDirectory;
  const filteredMembers = directorySource.filter((member) =>
    `${member.name} ${member.meta} ${member.badge}`.toLowerCase().includes(query.trim().toLowerCase())
  );
  const messageCards: Array<{
    id: string;
    meta: string;
    source?: PrototypeMessage;
    status: string;
    title: string;
  }> =
    messages.length > 0 ? messages.map((message) => formatMessageForList(message, currentPro?.id)) : proMessageSamples;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetch(`/api/directory?role=member&q=${encodeURIComponent(query)}`)
        .then((response) => response.json())
        .then((result: { ok?: boolean; people?: DirectoryPerson[] }) => {
          if (result.ok && result.people) {
            setDirectoryPeople(result.people);
          }
        })
        .catch(() => undefined);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    if (!currentPro) {
      return;
    }

    const loadMessages = () => {
      fetch(`/api/messages?userId=${encodeURIComponent(currentPro.id)}`)
        .then((response) => response.json())
        .then((result: { messages?: PrototypeMessage[]; ok?: boolean }) => {
          if (result.ok && result.messages) {
            setMessages(result.messages);
          }
        })
        .catch(() => undefined);
    };

    loadMessages();
    const intervalId = window.setInterval(loadMessages, 7000);
    return () => window.clearInterval(intervalId);
  }, [currentPro?.id]);

  async function inviteMember(member: DirectoryPerson) {
    if (!currentPro) {
      setNotice("로그인이 필요합니다.");
      return;
    }

    if (!targetRoom) {
      setNotice("레슨방을 먼저 만든 뒤 회원을 초대할 수 있습니다.");
      return;
    }

    const response = await fetch("/api/room-invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId: member.userId,
        memberName: member.name,
        message: `${currentPro.displayName}님이 ${targetRoom.name}에 초대했습니다.`,
        proId: currentPro.id,
        proName: currentPro.displayName,
        roomId: targetRoom.id,
        roomName: targetRoom.name
      })
    }).catch(() => undefined);
    const saved = response ? ((await response.json().catch(() => ({}))) as { ok?: boolean }) : undefined;
    if (saved?.ok) {
      setMessages((current) => [
        {
          id: `local_invite_${Date.now()}`,
          senderId: currentPro.id,
          senderName: currentPro.displayName,
          receiverId: member.userId,
          receiverName: member.name,
          roomId: targetRoom.id,
          messageType: "invite",
          content: `${currentPro.displayName}님이 ${targetRoom.name}에 초대했습니다.`,
          status: "active"
        },
        ...current
      ]);
    }
    setNotice(
      `${member.name}님에게 ${targetRoom.name} 초대를 보냈습니다. 회원이 수락하면 방 회원으로 등록됩니다.${
        saved?.ok ? " DB에 초대 내역이 저장됐습니다." : " Google Sheets 설정 전에는 화면 확인용으로만 표시됩니다."
      }`
    );
  }

  function openMessage(member: DirectoryPerson) {
    setSelectedMember(member);
    setMessageDraft("");
    setNotice(`${member.name}님에게 보낼 메시지를 입력해 주세요.`);
  }

  function replyToMessage(message: PrototypeMessage) {
    const member = {
      id: `reply_${message.senderId}`,
      userId: message.senderId,
      name: message.senderName,
      profileImageUrl: "",
      meta: "받은 메시지에서 선택",
      badge: "답장"
    };
    setSelectedMember(member);
    setMessageDraft("");
    setNotice(`${message.senderName}님에게 답장할 수 있습니다.`);
  }

  async function sendMessage() {
    if (!currentPro) {
      setNotice("로그인이 필요합니다.");
      return;
    }

    if (!selectedMember) {
      setNotice("먼저 메시지를 보낼 회원을 선택해 주세요.");
      return;
    }

    const content = messageDraft.trim();
    if (!content) {
      setNotice("보낼 메시지를 입력해 주세요.");
      return;
    }

    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        receiverId: selectedMember.userId,
        receiverName: selectedMember.name,
        senderId: currentPro.id,
        senderName: currentPro.displayName
      })
    }).catch(() => undefined);
    const saved = response
      ? ((await response.json().catch(() => ({}))) as { message?: PrototypeMessage; ok?: boolean })
      : undefined;
    if (saved?.ok) {
      setMessages((current) => [
        saved.message ?? {
          id: `local_message_${Date.now()}`,
          senderId: currentPro.id,
          senderName: currentPro.displayName,
          receiverId: selectedMember.userId,
          receiverName: selectedMember.name,
          messageType: "text",
          content,
          createdAt: new Date().toISOString(),
          status: "active"
        },
        ...current
      ]);
      setMessageDraft("");
    }
    setNotice(`${selectedMember.name}님에게 메시지를 보냈습니다.${saved?.ok ? " DB에 메시지가 저장됐습니다." : " Google Sheets 설정 전에는 화면 확인용으로만 표시됩니다."}`);
  }

  async function approveJoinRequest(message: PrototypeMessage) {
    if (!currentPro) {
      setNotice("로그인이 필요합니다.");
      return;
    }

    if (!targetRoom) {
      setNotice("레슨방을 먼저 만든 뒤 신청을 승인할 수 있습니다.");
      return;
    }

    const response = await fetch("/api/room-join-requests/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId: message.senderId,
        memberName: message.senderName,
        proId: currentPro.id,
        proName: currentPro.displayName,
        relatedId: message.relatedId,
        roomId: targetRoom.id,
        roomName: targetRoom.name
      })
    }).catch(() => undefined);
    const result = response
      ? ((await response.json().catch(() => ({}))) as {
          membership?: RoomMembership;
          ok?: boolean;
        })
      : undefined;

    if (result?.ok && result.membership) {
      onApproveJoinRequest(result.membership);
      await onRefreshConnections?.();
      setMessages((current) => current.map((item) => (item.id === message.id ? { ...item, readAt: new Date().toISOString() } : item)));
      setNotice(`${message.senderName}님을 ${targetRoom.name}에 배정했습니다.`);
      return;
    }

    setNotice("Google Sheets 설정 전에는 신청 승인을 저장할 수 없습니다.");
  }

  return (
    <>
      <PageHeader title="메시지" desc="회원 찾기, 프로방 초대, 신청 처리를 관리합니다." />
      <Card>
        <div className="search-box">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="회원 이름, 지역, 훈련 목표 검색" />
        </div>
        <div className="directory-list scroll-list directory-scroll">
          {filteredMembers.map((member) => (
            <div className="directory-item" key={member.id}>
              <ProfileTile imageUrl={member.profileImageUrl} name={member.name} />
              <div>
                <Badge tone="green">{member.badge}</Badge>
                <p>{member.meta}</p>
              </div>
              <div className="directory-actions">
                <button aria-label={`${member.name} 초대`} className="secondary" onClick={() => inviteMember(member)}>
                  <UserPlus size={16} />
                  초대
                </button>
                <button className="icon-button small" aria-label={`${member.name}에게 메시지`} onClick={() => openMessage(member)}>
                  <Send size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
        {notice ? <p className="save-notice">{notice}</p> : null}
      </Card>
      <Card className="message-compose">
        <div className="row spread">
          <div>
            <Badge tone="gray">개인 메시지</Badge>
            <h3>{selectedMember ? selectedMember.name : "메시지 받을 회원 선택"}</h3>
            <p>{selectedMember ? "선택한 회원에게 1:1 메시지를 보냅니다." : "검색 목록에서 종이비행기 버튼을 눌러 상대를 선택하세요."}</p>
          </div>
          {selectedMember ? (
            <button className="secondary" onClick={() => setSelectedMember(null)}>
              선택 해제
            </button>
          ) : null}
        </div>
        <textarea
          className="message-input"
          disabled={!selectedMember}
          onChange={(event) => setMessageDraft(event.target.value)}
          placeholder="예) 오늘 훈련 기록 확인했습니다. 다음 과제는 어프로치로 바꿔볼게요."
          value={messageDraft}
        />
        <button className="primary wide" disabled={!selectedMember || !messageDraft.trim()} onClick={sendMessage}>
          메시지 보내기
        </button>
      </Card>
      <Section title="내 회원">
        <div className="stack compact-stack scroll-list relation-scroll">
          {memberships.length > 0 ? (
            memberships.map((membership) => (
              <Card key={membership.id}>
                <div className="row spread">
                  <div>
                    <h3>{membership.memberName}</h3>
                    <p>{membership.joinedAtLabel} · 연결된 회원</p>
                  </div>
                  <Badge>관리중</Badge>
                </div>
              </Card>
            ))
          ) : (
            <Card>
              <h3>아직 연결된 회원이 없습니다.</h3>
              <p>회원을 검색해 초대하거나 신청 대기 메시지를 승인해 방에 배정할 수 있습니다.</p>
            </Card>
          )}
        </div>
      </Section>
      <Section title="메시지함">
        <div className="stack compact-stack scroll-list message-scroll">
          {messageCards.map((message) => (
            <Card key={message.id}>
              <div className="row spread">
                <div>
                  <h3>{message.title}</h3>
                  <p>{message.meta}</p>
                </div>
                <div className="message-actions">
                  <Badge tone={message.status === "처리 필요" || message.status === "신청" ? "amber" : "gray"}>{message.status}</Badge>
                  {message.source?.messageType === "request" && message.source.receiverId === currentPro?.id ? (
                    <button aria-label={`${message.title} 승인`} className="secondary" onClick={() => (message.source ? approveJoinRequest(message.source) : undefined)}>
                      승인
                    </button>
                  ) : null}
                  {message.source?.messageType === "text" && message.source.senderId !== currentPro?.id ? (
                    <button aria-label={`${message.title} 답장`} className="secondary" onClick={() => (message.source ? replyToMessage(message.source) : undefined)}>
                      답장
                    </button>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>
    </>
  );
}
