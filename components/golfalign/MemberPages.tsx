import {
  memberRepository
} from "@/lib/repositories/memberRepository";
import { poseAngleMarks } from "@/lib/mock/poseAngleMarks";
import { sampleProfileImages } from "@/lib/mock/profileImages";
import { ProfileEditor } from "./ProfileEditor";
import {
  Clock,
  Download,
  Image as ImageIcon,
  Languages,
  Scissors,
  Search,
  Send
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type {
  FeedbackItem,
  PoseAngleResult,
  PoseSegment,
  DirectoryPerson,
  GoToPage,
  Page,
  PrototypeAccount,
  PrototypeMessage,
  PrototypeRoom,
  RecordItem,
  RoomMembership,
  TrainingAssignment,
  TrainingResult,
  UploadDraft
} from "./types";
import {
  Avatar,
  Badge,
  Card,
  Chip,
  Field,
  PageHeader,
  Person,
  ProfileTile,
  RecordCard,
  RecordListItem,
  RoundTeaser,
  Section,
  Sticker,
  Toggle,
  TrainingRow
} from "./ui";
import { UploadMediaPicker } from "./UploadMediaPicker";

const latestFeedback = memberRepository.getLatestFeedback();
const todayTrainings = memberRepository.getTodayTrainings();
const recentRecords = memberRepository.getRecentRecords();
const roomSummary = memberRepository.getRoomSummary();

function uniqueRecords(records: RecordItem[]) {
  const seen = new Set<string>();
  return records.filter((record) => {
    if (seen.has(record.id)) {
      return false;
    }
    seen.add(record.id);
    return true;
  });
}

function isRecordFeedbackCompleted(record: RecordItem) {
  return record.badge?.includes("피드백 완료") ?? false;
}

function isRecordShared(record: RecordItem) {
  return Boolean(record.roomId || record.badge?.includes("공유"));
}

function sortMemberRecords(records: RecordItem[]) {
  return [...records].sort((a, b) => {
    const getRank = (record: RecordItem) => {
      if (isRecordFeedbackCompleted(record)) {
        return 0;
      }

      if (isRecordShared(record)) {
        return 1;
      }

      return 2;
    };

    return getRank(a) - getRank(b);
  });
}

function getMemberRecordMeta(record: RecordItem) {
  const meta = isRecordFeedbackCompleted(record)
    ? record.meta.replace("피드백 대기", "피드백 완료")
    : record.meta;

  return record.roomName && !meta.includes(record.roomName) ? `${meta} · ${record.roomName}` : meta;
}

const recordTypeOptions = [
  { label: "스윙", value: "swing" },
  { label: "퍼팅", value: "putting" },
  { label: "어프로치", value: "approach" }
];

const bodyAngleOptions = [
  { label: "발 정렬", value: "feet_alignment" },
  { label: "팔/손목", value: "arm_wrist" },
  { label: "고개/시선", value: "head_eye" },
  { label: "허리/골반", value: "waist_hip" },
  { label: "등/상체", value: "back_upper" },
  { label: "무릎/체중", value: "knee_weight" }
];

const proDirectory: DirectoryPerson[] = [
  {
    id: "pro_dir_01",
    userId: "pro_directory_01",
    name: "김민준 프로",
    profileImageUrl: sampleProfileImages.david,
    meta: "서울 강남 · 스윙 교정 · 초급/중급",
    badge: "레슨 가능"
  },
  {
    id: "pro_dir_02",
    userId: "pro_directory_02",
    name: "박서연 프로",
    profileImageUrl: sampleProfileImages.elena,
    meta: "분당 · 숏게임/퍼팅 · 여성/시니어",
    badge: "인기"
  },
  {
    id: "pro_dir_03",
    userId: "pro_directory_03",
    name: "이도윤 프로",
    profileImageUrl: sampleProfileImages.kenji,
    meta: "인천 송도 · 필드 운영 · 라운드 코칭",
    badge: "신규"
  }
];

const memberMessageSamples = [
  {
    id: "msg_member_01",
    title: "김민준 프로 · 드라이버 교정방",
    meta: "이번 주 과제는 측면 스윙 5초 영상 2개입니다.",
    status: "새 메시지"
  },
  {
    id: "msg_member_02",
    title: "프로방 신청",
    meta: "박서연 프로에게 보낸 신청이 대기 중입니다.",
    status: "대기"
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

export function MemberPages({
  page,
  go,
  uploadedRecords,
  activeRecord,
  activeFeedback,
  activeTraining,
  joinedRooms,
  currentMember,
  latestSavedFeedback,
  onAcceptInvitation,
  onRefreshConnections,
  trainingAssignments,
  onCreateRecord,
  onJoinRoom,
  onSelectRecord
  , onSelectTraining,
  onUpdateProfile,
  onSaveTrainingResult
}: {
  page: Page;
  go: GoToPage;
  uploadedRecords: RecordItem[];
  activeRecord?: RecordItem;
  activeFeedback?: FeedbackItem;
  activeTraining?: TrainingAssignment;
  joinedRooms: PrototypeRoom[];
  currentMember: PrototypeAccount | null;
  latestSavedFeedback?: FeedbackItem;
  onAcceptInvitation: (data: {
    membership: RoomMembership;
    room: PrototypeRoom;
  }) => void;
  onRefreshConnections?: () => Promise<void> | void;
  trainingAssignments: TrainingAssignment[];
  onCreateRecord: (record: RecordItem) => void | Promise<void>;
  onJoinRoom: (code: string) => Promise<{ ok: true; room: PrototypeRoom } | { ok: false; message: string }>;
  onSelectRecord: (recordId: string, page?: Page) => void;
  onSelectTraining: (assignmentId: string) => void;
  onUpdateProfile: (profile: Partial<PrototypeAccount> & { id: string }) => Promise<{ ok: true; account: PrototypeAccount } | { ok: false; message: string }>;
  onSaveTrainingResult: (result: Omit<TrainingResult, "id" | "createdAtLabel" | "status">) => void;
}) {
  const useDemoRecords = currentMember?.id === "acc_member_demo";

  switch (page) {
    case "records":
      return <RecordsPage go={go} uploadedRecords={uploadedRecords} onSelectRecord={onSelectRecord} useDemoRecords={useDemoRecords} />;
    case "upload":
      return <UploadPage go={go} joinedRooms={joinedRooms} onCreateRecord={onCreateRecord} />;
    case "detail":
      return <DetailPage activeFeedback={activeFeedback} activeRecord={activeRecord} />;
    case "training":
      return <TrainingPage go={go} onSelectTraining={onSelectTraining} trainingAssignments={trainingAssignments} />;
    case "training-result":
      return <TrainingResultPage activeTraining={activeTraining} go={go} onSaveTrainingResult={onSaveTrainingResult} />;
    case "room":
      return <RoomPage go={go} joinedRooms={joinedRooms} onJoinRoom={onJoinRoom} trainingAssignments={trainingAssignments} uploadedRecords={uploadedRecords} onSelectRecord={onSelectRecord} onSelectTraining={onSelectTraining} />;
    case "invite":
      return <InvitePage go={go} />;
    case "signup":
      return <SignupPage go={go} />;
    case "join-room":
      return <JoinRoomPage go={go} uploadedRecords={uploadedRecords} useDemoRecords={useDemoRecords} />;
    case "member-messages":
      return <MemberMessagesPage currentMember={currentMember} joinedRooms={joinedRooms} onAcceptInvitation={onAcceptInvitation} onRefreshConnections={onRefreshConnections} />;
    case "more":
      return <MorePage currentMember={currentMember} onUpdateProfile={onUpdateProfile} />;
    default:
      return <HomePage go={go} latestSavedFeedback={latestSavedFeedback} trainingAssignments={trainingAssignments} uploadedRecords={uploadedRecords} onSelectRecord={onSelectRecord} useDemoRecords={useDemoRecords} />;
  }
}

function HomePage({
  go,
  latestSavedFeedback,
  trainingAssignments,
  uploadedRecords,
  onSelectRecord,
  useDemoRecords
}: {
  go: GoToPage;
  latestSavedFeedback?: FeedbackItem;
  trainingAssignments: TrainingAssignment[];
  uploadedRecords: RecordItem[];
  onSelectRecord: (recordId: string) => void;
  useDemoRecords: boolean;
}) {
  const visibleRecords = sortMemberRecords(uniqueRecords([...uploadedRecords, ...(useDemoRecords ? recentRecords : [])])).slice(0, 4);
  const feedbackRecord = visibleRecords[0];
  const primaryTraining = trainingAssignments[0] ?? todayTrainings[0];

  return (
    <>
      <section className="hero">
        <h1>
          스윙을 기록하고,
          <br />
          성장을 정렬하다.
        </h1>
        <p>오늘도 당신의 완성도 높은 스윙을 위해.</p>
        <button className="primary" onClick={() => go("upload")}>
          영상/이미지 업로드
        </button>
        <span>스윙 영상은 5초 권장, 최대 7초까지 가능해요.</span>
      </section>

      {latestSavedFeedback || useDemoRecords ? (
        <Section title="새 피드백">
          <button className="feedback-snapshot-card" onClick={() => (feedbackRecord ? onSelectRecord(feedbackRecord.id) : go("records"))}>
            <div className="feedback-thumb">
              {feedbackRecord?.thumbnailUrl ? <img src={feedbackRecord.thumbnailUrl} alt={`${feedbackRecord.title} 썸네일`} /> : <Avatar label={(latestSavedFeedback?.proName ?? latestFeedback.proName).slice(0, 1)} />}
            </div>
            <div className="feedback-copy">
              <div className="record-badges">
                <Badge tone="green">피드백 도착</Badge>
                <Badge tone="gray">{latestSavedFeedback?.createdAtLabel ?? latestFeedback.timeLabel}</Badge>
              </div>
              <h3>{latestSavedFeedback ? `${latestSavedFeedback.proName}님의 피드백` : latestFeedback.title}</h3>
              <p>{latestSavedFeedback?.focusComment ?? latestFeedback.comment}</p>
              <span className="record-cta">스냅샷에서 확인</span>
            </div>
          </button>
        </Section>
      ) : null}

      <Section title="오늘 할 훈련" action="전체 보기" onAction={() => go("training")}>
        <TrainingRow title={primaryTraining.title} meta={primaryTraining.meta} status={primaryTraining.status} />
      </Section>

      <Section title="최근 기록" action="전체 보기" onAction={() => go("records")}>
        <div className="record-grid">
          {visibleRecords.map((record) => (
            <RecordCard
              key={record.id}
              title={record.title}
              meta={getMemberRecordMeta(record)}
              media={record.media}
              badge={record.badge ?? "개인 기록"}
              thumbnailUrl={record.thumbnailUrl}
              onClick={() => onSelectRecord(record.id)}
            />
          ))}
        </div>
      </Section>

      <RoundTeaser />
    </>
  );
}

function RecordsPage({
  go,
  uploadedRecords,
  onSelectRecord,
  useDemoRecords
}: {
  go: GoToPage;
  uploadedRecords: RecordItem[];
  onSelectRecord: (recordId: string) => void;
  useDemoRecords: boolean;
}) {
  const records = sortMemberRecords(uniqueRecords([...uploadedRecords, ...(useDemoRecords ? recentRecords : [])]));
  const completedRecords = records.filter(isRecordFeedbackCompleted);
  const pendingSharedRecords = records.filter((record) => isRecordShared(record) && !isRecordFeedbackCompleted(record));
  const personalRecords = records.filter((record) => !isRecordShared(record) && !isRecordFeedbackCompleted(record));

  return (
    <>
      <PageHeader title="내 기록" desc="스윙, 어프로치, 퍼팅 기록을 모아보세요." />
      <button className="primary wide" onClick={() => go("upload")}>
        새 기록 업로드
      </button>
      {completedRecords.length > 0 ? (
        <Section title="프로 피드백 완료">
          <div className="stack">
            {completedRecords.map((record) => (
              <RecordListItem
                key={record.id}
                title={record.title}
                meta={getMemberRecordMeta(record)}
                badge={record.badge ?? "피드백 완료"}
                cta="피드백 보기"
                thumbnailUrl={record.thumbnailUrl}
                onClick={() => onSelectRecord(record.id)}
              />
            ))}
          </div>
        </Section>
      ) : null}
      {pendingSharedRecords.length > 0 ? (
        <Section title="프로 확인 대기">
          <div className="stack">
            {pendingSharedRecords.map((record) => (
              <RecordListItem
                key={record.id}
                title={record.title}
                meta={getMemberRecordMeta(record)}
                badge={record.badge ?? "프로 확인 대기"}
                cta="공유 기록 보기"
                thumbnailUrl={record.thumbnailUrl}
                onClick={() => onSelectRecord(record.id)}
              />
            ))}
          </div>
        </Section>
      ) : null}
      <Section title="개인 기록">
        {personalRecords.length > 0 ? (
          <div className="stack">
            {personalRecords.map((record) => (
            <RecordListItem
              key={record.id}
              title={record.title}
              meta={getMemberRecordMeta(record)}
              badge={record.badge ?? "개인 기록"}
              cta="스냅샷 보기"
              thumbnailUrl={record.thumbnailUrl}
              onClick={() => onSelectRecord(record.id)}
            />
            ))}
          </div>
        ) : (
          <Card className="empty-state-card">
            <Badge tone="gray">개인</Badge>
            <h3>아직 개인 기록이 없습니다.</h3>
            <p>업로드할 때 프로방 공유를 끄면 개인 기록으로 저장됩니다.</p>
          </Card>
        )}
      </Section>
    </>
  );
}

function UploadPage({
  go,
  joinedRooms,
  onCreateRecord
}: {
  go: GoToPage;
  joinedRooms: PrototypeRoom[];
  onCreateRecord: (record: RecordItem) => void | Promise<void>;
}) {
  const [draft, setDraft] = useState<UploadDraft | null>(null);
  const [recordType, setRecordType] = useState(recordTypeOptions[0]);
  const [bodyAngle, setBodyAngle] = useState(bodyAngleOptions[0]);
  const [memo, setMemo] = useState("백스윙이 조금 빠른 것 같아요.");
  const [shareToRoom, setShareToRoom] = useState(true);
  const [selectedRoomId, setSelectedRoomId] = useState(joinedRooms[0]?.id ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState("");
  const selectedRoom = joinedRooms.find((room) => room.id === selectedRoomId) ?? joinedRooms[0];

  useEffect(() => {
    if (!selectedRoomId && joinedRooms[0]) {
      setSelectedRoomId(joinedRooms[0].id);
    }
  }, [joinedRooms, selectedRoomId]);

  useEffect(() => {
    function handleDraft(event: Event) {
      const customEvent = event as CustomEvent<UploadDraft | null>;
      setDraft(customEvent.detail);
    }

    window.addEventListener("golfalign:upload-draft", handleDraft);
    return () => window.removeEventListener("golfalign:upload-draft", handleDraft);
  }, []);

  const saveLabel = useMemo(() => {
    if (!draft) {
      return "파일 선택 후 저장";
    }

    return shareToRoom && selectedRoom ? "개인 기록 저장 + 프로방 공유" : "개인 기록으로 저장";
  }, [draft, selectedRoom, shareToRoom]);

  async function saveRecord() {
    if (!draft || isSaving) {
      return;
    }

    setIsSaving(true);
    const now = new Date();
    const shared = shareToRoom && selectedRoom;
    await onCreateRecord({
      id: `rec_local_${now.getTime()}`,
      title: `방금 올린 ${recordType.label} ${draft.media === "video" ? "영상" : "이미지"}`,
      meta: `${recordType.label} · ${bodyAngle.label} · ${draft.durationLabel} · 스냅샷 저장됨`,
      media: draft.media,
      thumbnailUrl: draft.thumbnailUrl,
      mediaUrl: draft.mediaUrl,
      recordType: recordType.value,
      cameraAngle: bodyAngle.value,
      bodyAngle: bodyAngle.value,
      memo,
      badge: shared ? "개인 기록 + 프로방 공유" : "개인 기록",
      roomId: shared ? selectedRoom.id : undefined,
      roomName: shared ? selectedRoom.name : undefined,
      sharedAt: shared ? "방금 전" : undefined
    });
    setSaveNotice(
      shared
        ? `${selectedRoom.name} 피드백 대기 목록에 공유했습니다. 프로가 캡쳐 피드백을 작성할 수 있습니다.`
        : "개인 기록으로 저장했습니다. 필요하면 기록 목록에서 다시 확인할 수 있습니다."
    );
    window.setTimeout(() => {
      go("records");
      setIsSaving(false);
    }, 900);
  }

  return (
    <>
      <PageHeader title="기록 업로드" desc="영상은 기기에 두고, 피드백용 썸네일과 캡쳐 이미지를 중심으로 기록합니다." />
      <Card>
        <UploadMediaPicker />
        <div className="upload-policy-grid">
          <div className="policy-card">
            <Clock size={20} />
            <strong>5초 권장</strong>
            <span>최대 7초까지 저장</span>
          </div>
          <div className="policy-card">
            <Scissors size={20} />
            <strong>느린 재생</strong>
            <span>프로가 0.5배속으로 확인</span>
          </div>
          <div className="policy-card">
            <ImageIcon size={20} />
            <strong>캡쳐 피드백</strong>
            <span>멈춘 장면에 메모</span>
          </div>
        </div>
        <div className="nested-note">
          <h3>업로드 처리 방식</h3>
          <ol className="compact-steps">
            <li>원본 영상은 사용자 기기에 보관하는 방향으로 갑니다.</li>
            <li>앱에는 썸네일, 캡쳐 이미지, 피드백 데이터만 가볍게 저장합니다.</li>
            <li>프로는 영상을 느리게 보다가 필요한 장면을 캡쳐해 피드백합니다.</li>
          </ol>
        </div>
        <Field label="기록 종류">
          {recordTypeOptions.map((option) => (
            <Chip key={option.value} active={recordType.value === option.value} onClick={() => setRecordType(option)}>
              {option.label}
            </Chip>
          ))}
        </Field>
        <Field label="자세 분석 포인트">
          {bodyAngleOptions.map((option) => (
            <Chip key={option.value} active={bodyAngle.value === option.value} onClick={() => setBodyAngle(option)}>
              {option.label}
            </Chip>
          ))}
        </Field>
        <label className="field-label">메모</label>
        <textarea className="textarea" value={memo} onChange={(event) => setMemo(event.target.value)} />
        <div className="share-panel">
          <div>
            <strong>공유할 프로방</strong>
            <p>
              {selectedRoom
                ? `개인 기록에 저장하고, 체크하면 ${selectedRoom.name}에도 썸네일과 스냅샷을 공유합니다.`
                : "가입한 프로방이 있으면 공유할 수 있습니다."}
            </p>
          </div>
          <div className="chips">
            <Chip active={!shareToRoom} onClick={() => setShareToRoom(false)}>
              개인 기록
            </Chip>
            {joinedRooms.map((room) => (
              <Chip
                active={shareToRoom && selectedRoom?.id === room.id}
                key={room.id}
                onClick={() => {
                  setSelectedRoomId(room.id);
                  setShareToRoom(true);
                }}
              >
                {room.name}
              </Chip>
            ))}
          </div>
          <label className="check-line">
            <input
              type="checkbox"
              checked={shareToRoom}
              disabled={!selectedRoom}
              onChange={(event) => setShareToRoom(event.target.checked)}
            />
            <span>업로드 저장 시 가입한 프로방에 공유</span>
          </label>
        </div>
        {saveNotice ? <p className="save-notice">{saveNotice}</p> : null}
        <button className="primary wide" onClick={saveRecord} disabled={!draft || isSaving}>
          {isSaving ? "저장 중..." : saveLabel}
        </button>
      </Card>
    </>
  );
}

const memberPoseLayerElements = [
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

function DetailPage({ activeFeedback, activeRecord }: { activeFeedback?: FeedbackItem; activeRecord?: RecordItem }) {
  const title = activeRecord?.title ?? "최근 스윙 기록";
  const recordMeta = activeRecord?.meta ?? "7번 아이언 · 측면";
  const feedbackImageUrl = activeFeedback?.snapshotUrl || activeRecord?.thumbnailUrl;
  const hiddenAngleMarkIds = activeFeedback?.hiddenAngleMarkIds ?? [];
  const showSavedPoseAngles = Boolean(activeFeedback && activeFeedback.poseAnglesVisible !== false);
  const visibleAngleMarks = poseAngleMarks.filter((mark) => !hiddenAngleMarkIds.includes(mark.id));
  const visiblePoseElements = memberPoseLayerElements.filter((element) => !hiddenAngleMarkIds.includes(element.id));
  const visiblePoseSegments = activeFeedback?.poseAnalysis?.segments.filter((segment) => !hiddenAngleMarkIds.includes(segment.id)) ?? [];
  const visiblePoseAngles = activeFeedback?.poseAnalysis?.angles.filter((angle) => !hiddenAngleMarkIds.includes(angle.id)) ?? [];
  const hasRealPoseAnalysis = Boolean(activeFeedback?.poseAnalysis?.segments.length || activeFeedback?.poseAnalysis?.angles.length);
  const annotations = activeFeedback?.annotations ?? [];
  const snapshotSourceLabel = activeFeedback?.snapshotUrl ? "프로 저장 캡쳐" : "기록 썸네일";
  const angleLayerLabel = activeFeedback
    ? showSavedPoseAngles
      ? hiddenAngleMarkIds.length > 0
        ? `뼈각도 표시 · ${hiddenAngleMarkIds.length}개 숨김`
        : "뼈각도 표시"
      : "뼈각도 숨김"
    : "기본 분석 가이드";
  const focusComment =
    activeFeedback?.focusComment ??
    activeRecord?.memo ??
    "다운스윙 시작 전에 왼쪽 어깨가 먼저 열립니다. 하프스윙으로 피니시를 3초 유지해보세요.";

  return (
    <>
      <PageHeader title="스냅샷 피드백" desc="멈춘 장면 위에서 자세, 메모, 다음 훈련을 한 번에 확인합니다." />
      <Card className="analysis-shell">
        <div className="analysis-head">
          <div>
            <Badge>{activeFeedback ? "프로 피드백" : activeRecord?.roomId ? "프로방 공유됨" : "개인 기록"}</Badge>
            <h3>{title}</h3>
            <p>{recordMeta}</p>
          </div>
          <button className="secondary">
            <Download size={18} />
            원본
          </button>
        </div>
        <div className="snapshot-tabs compact">
          <Chip active>{activeFeedback ? "저장 피드백" : "시작"}</Chip>
          <Chip>{activeFeedback ? "뼈각도" : "임팩트"}</Chip>
          <Chip>{activeFeedback ? "코멘트" : "마무리"}</Chip>
        </div>
        <div className="snapshot-source-bar member-view">
          <span>{snapshotSourceLabel}</span>
          <strong>{angleLayerLabel}</strong>
        </div>
        <div className="viewer snapshot-viewer">
          {feedbackImageUrl ? <img className="viewer-image" src={feedbackImageUrl} alt={`${activeRecord?.title ?? "피드백"} 스냅샷`} /> : null}
          {showSavedPoseAngles ? (
            <div className="pose-angle-layer">
              {visiblePoseSegments.map((segment) => (
                <ReadOnlyPoseSegment key={segment.id} segment={segment} />
              ))}
              {visiblePoseAngles.map((angle) => (
                <ReadOnlyPoseAngle angle={angle} key={angle.id} />
              ))}
              {!hasRealPoseAnalysis && visiblePoseElements.map((element) => (
                <span className={element.className} key={element.id} />
              ))}
              {!hasRealPoseAnalysis && visibleAngleMarks.map((mark) => (
                <span className="angle-marker read-only" key={mark.id} style={mark.style}>
                  {mark.label}
                </span>
              ))}
            </div>
          ) : (
            <>
              <div className="pose-line shoulder-line" />
              <div className="angle-guide" />
            </>
          )}
          <div className="annotation-layer read-only">
            {annotations.map((annotation) => (
              <ReadOnlyAnnotationElement annotation={annotation} key={annotation.id} />
            ))}
          </div>
          <Sticker style={{ top: "18%", left: "56%" }}>{activeFeedback?.stickerComment ?? "어깨 열림"}</Sticker>
          <Sticker style={{ top: "58%", left: "28%" }}>체중 이동</Sticker>
          <ImageIcon className="viewer-play" size={30} />
        </div>
        <div className="snapshot-strip">
          <button className="snapshot-chip active">{activeFeedback?.snapshotUrl ? "저장 캡쳐" : "00:01 시작"}</button>
          <button className="snapshot-chip">{showSavedPoseAngles ? "뼈각도 표시" : "각도 숨김"}</button>
          <button className="snapshot-chip">{hiddenAngleMarkIds.length > 0 ? "레이어 수정됨" : "메모 확인"}</button>
        </div>
      </Card>
      <Card className="feedback-summary-card">
        <div className="feedback-summary-grid">
          <div>
            <span>목표</span>
            <strong>{activeFeedback?.goalComment ?? "백스윙 균형 유지"}</strong>
          </div>
          <div>
            <span>신경쓸 것</span>
            <strong>{focusComment}</strong>
          </div>
          <div>
            <span>다음 훈련</span>
            <strong>하프스윙 30회 · 피니시 3초 멈춤</strong>
          </div>
        </div>
      </Card>
    </>
  );
}

function ReadOnlyPoseSegment({ segment }: { segment: PoseSegment }) {
  const dx = segment.to.x - segment.from.x;
  const dy = segment.to.y - segment.from.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return (
    <span
      className="pose-analysis-segment read-only"
      style={{
        left: `${segment.from.x}%`,
        top: `${segment.from.y}%`,
        transform: `rotate(${angle}deg)`,
        width: `${length}%`
      }}
    >
      <span className="pose-analysis-dot start" />
      <span className="pose-analysis-dot end" />
    </span>
  );
}

function ReadOnlyPoseAngle({ angle }: { angle: PoseAngleResult }) {
  return (
    <span className="angle-marker real-angle-marker read-only" style={{ left: `${angle.x}%`, top: `${angle.y}%` }}>
      {angle.label} {angle.value}°
    </span>
  );
}

function ReadOnlyAnnotationElement({ annotation }: { annotation: NonNullable<FeedbackItem["annotations"]>[number] }) {
  if (annotation.kind === "text") {
    return (
      <span
        className="feedback-annotation text-annotation read-only"
        style={{
          color: annotation.color,
          left: `${annotation.x}%`,
          top: `${annotation.y}%`
        }}
      >
        {annotation.text}
      </span>
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
      <span
        className={`feedback-annotation line-annotation ${annotation.kind === "arrow" ? "arrow" : ""} read-only`}
        style={{
          background: annotation.color,
          color: annotation.color,
          left: `${annotation.x}%`,
          top: `${annotation.y}%`,
          transform: `rotate(${angle}deg)`,
          width: `${lineLength}%`
        }}
      />
    );
  }

  return (
    <span
      className={`feedback-annotation shape-annotation ${annotation.kind} read-only`}
      style={{
        borderColor: annotation.color,
        height: `${height}%`,
        left: `${left}%`,
        top: `${top}%`,
        width: `${width}%`
      }}
    />
  );
}

function TrainingPage({
  go,
  onSelectTraining,
  trainingAssignments
}: {
  go: GoToPage;
  onSelectTraining: (assignmentId: string) => void;
  trainingAssignments: TrainingAssignment[];
}) {
  const commonAssignments = trainingAssignments.filter((assignment) => assignment.assignmentType === "room_common");
  const personalAssignments = trainingAssignments.filter((assignment) => assignment.assignmentType !== "room_common");
  const fallbackAssignments = trainingAssignments.length > 0 ? trainingAssignments : todayTrainings.slice(0, 1);

  return (
    <>
      <PageHeader title="훈련" desc="오늘 할 훈련을 체크리스트처럼 관리하세요." />
      <div className="chips">
        <Chip active>전체</Chip>
        <Chip>프로 추천</Chip>
        <Chip>개인 훈련</Chip>
        <Chip>완료</Chip>
      </div>
      <Section title="방 공통 드릴">
        <div className="stack">
          {(commonAssignments.length > 0 ? commonAssignments : fallbackAssignments.filter((_, index) => index === 0)).map((assignment) => (
            <Card className="highlight" key={assignment.id}>
              <TrainingRow title={assignment.title} meta={assignment.meta} status={assignment.status ?? "진행 중"} />
              <div className="detail-grid">
                <span>목표</span>
                <strong>{assignment.goal}</strong>
                <span>기록</span>
                <strong>{assignment.recordGuide}</strong>
              </div>
              <button className="primary wide" onClick={() => "id" in assignment ? onSelectTraining(assignment.id) : go("training-result")}>
                결과 기록
              </button>
            </Card>
          ))}
        </div>
      </Section>
      {personalAssignments.length > 0 ? (
        <Section title="개인 과제">
          <div className="stack">
            {personalAssignments.map((assignment) => (
              <Card key={assignment.id}>
                <TrainingRow title={assignment.title} meta={assignment.meta} status={assignment.status ?? "진행 중"} />
                <div className="detail-grid">
                  <span>목표</span>
                  <strong>{assignment.goal}</strong>
                  <span>기록</span>
                  <strong>{assignment.recordGuide}</strong>
                </div>
                <button className="primary wide" onClick={() => onSelectTraining(assignment.id)}>
                  결과 기록
                </button>
              </Card>
            ))}
          </div>
        </Section>
      ) : null}
      <Section title="개인 훈련">
        <TrainingRow title={todayTrainings[1].title} meta={todayTrainings[1].meta} status={todayTrainings[1].status} />
      </Section>
    </>
  );
}

function TrainingResultPage({
  activeTraining,
  go,
  onSaveTrainingResult
}: {
  activeTraining?: TrainingAssignment;
  go: GoToPage;
  onSaveTrainingResult: (result: Omit<TrainingResult, "id" | "createdAtLabel" | "status">) => void;
}) {
  const assignment = activeTraining ?? todayTrainings[0];
  const [count, setCount] = useState("100개");
  const [difficulty, setDifficulty] = useState("보통");
  const [memo, setMemo] = useState("30m 거리감이 조금 안정됐지만 방향은 아직 흔들립니다.");
  const [shareToRoom, setShareToRoom] = useState(true);

  function saveResult() {
    onSaveTrainingResult({
      assignmentId: assignment.id,
      title: assignment.title,
      memberName: "박회원",
      count,
      difficulty,
      memo,
      shareToRoom,
      attachmentLabel: "첨부 없음"
    });
    go("training");
  }

  return (
    <>
      <PageHeader title="훈련 결과 기록" desc="영상이나 이미지는 선택으로 첨부할 수 있습니다." />
      <Card>
        <Badge>{assignment.title}</Badge>
        <Field label="실제 수행 횟수">
          <input className="input" value={count} onChange={(event) => setCount(event.target.value)} />
        </Field>
        <Field label="체감 난이도">
          {["쉬움", "보통", "어려움"].map((option) => (
            <Chip key={option} active={difficulty === option} onClick={() => setDifficulty(option)}>
              {option}
            </Chip>
          ))}
        </Field>
        <label className="field-label">결과 메모</label>
        <textarea className="textarea" value={memo} onChange={(event) => setMemo(event.target.value)} />
        <button className="secondary wide">영상/이미지 선택 첨부</button>
        <label className="check-line">
          <input type="checkbox" checked={shareToRoom} onChange={(event) => setShareToRoom(event.target.checked)} />
          <span>김프로방에 결과 공유</span>
        </label>
        <button className="primary wide" onClick={saveResult}>
          결과 저장
        </button>
      </Card>
    </>
  );
}

function RoomPage({
  go,
  joinedRooms,
  onJoinRoom,
  trainingAssignments,
  uploadedRecords,
  onSelectRecord,
  onSelectTraining
}: {
  go: GoToPage;
  joinedRooms: PrototypeRoom[];
  onJoinRoom: (code: string) => Promise<{ ok: true; room: PrototypeRoom } | { ok: false; message: string }>;
  trainingAssignments: TrainingAssignment[];
  uploadedRecords: RecordItem[];
  onSelectRecord: (recordId: string) => void;
  onSelectTraining: (assignmentId: string) => void;
}) {
  const [inviteCode, setInviteCode] = useState("GA-2026");
  const [joinMessage, setJoinMessage] = useState("");
  const joinedRoomIds = new Set(joinedRooms.map((room) => room.id));
  const sharedRecords = uploadedRecords.filter((record) => record.roomId && joinedRoomIds.has(record.roomId));
  const commonDrills = trainingAssignments.filter((assignment) => assignment.assignmentType === "room_common");

  async function joinRoom() {
    const result = await onJoinRoom(inviteCode);
    setJoinMessage(result.ok ? `${result.room.name}에 가입했습니다.` : result.message);
  }

  return (
    <>
      <PageHeader title="프로방" desc="프로와 연결된 기록과 훈련을 확인하세요." />
      {joinedRooms.length > 0 ? (
        joinedRooms.map((room) => (
          <Card key={room.id}>
            <div className="row spread">
              <div>
                <h3>{room.name}</h3>
                <p>{room.proName} · {room.purpose}</p>
              </div>
              <Badge>가입중</Badge>
            </div>
            <div className="people-row">
              <Person label={room.proName.slice(0, 1)} />
              <Person label="나" />
              <Person label="+" muted />
            </div>
            <p>회원 이름과 프로필만 보이고, 영상과 피드백은 본인이 공유한 것만 보입니다.</p>
            <button className="primary wide" onClick={() => go("detail")}>
              피드백 보기
            </button>
          </Card>
        ))
      ) : (
        <Card>
          <h3>가입한 프로방이 없습니다.</h3>
          <p>프로에게 받은 초대 코드를 입력하면 기록 공유와 훈련 과제를 받을 수 있습니다.</p>
        </Card>
      )}
      <Card>
        <h3>방 공통 드릴</h3>
        {commonDrills.length > 0 ? (
          <div className="stack compact-stack">
            {commonDrills.map((assignment) => (
              <button className="training-row" key={assignment.id} onClick={() => onSelectTraining(assignment.id)}>
                <div className="check-dot" />
                <div>
                  <h3>{assignment.title}</h3>
                  <p>{assignment.meta}</p>
                </div>
                <Badge>{assignment.status ?? "진행 중"}</Badge>
              </button>
            ))}
          </div>
        ) : (
          <p>아직 프로가 올린 공통 드릴이 없습니다.</p>
        )}
      </Card>
      <Card>
        <h3>내가 공유한 기록</h3>
        {sharedRecords.length > 0 ? (
          <div className="stack compact-stack">
            {sharedRecords.map((record) => (
              <RecordListItem
                key={record.id}
                title={record.title}
                meta={`${getMemberRecordMeta(record)} · ${record.sharedAt ?? "공유됨"}`}
                badge={isRecordFeedbackCompleted(record) ? "피드백 완료" : "프로 확인 대기"}
                cta={isRecordFeedbackCompleted(record) ? "피드백 보기" : "공유 기록 보기"}
                thumbnailUrl={record.thumbnailUrl}
                onClick={() => onSelectRecord(record.id)}
              />
            ))}
          </div>
        ) : (
          <p>아직 공유한 기록이 없습니다. 기록 업로드에서 김프로방 공유를 켜면 여기에 표시됩니다.</p>
        )}
      </Card>
      <Card>
        <h3>초대 코드 입력</h3>
        <p>프로가 보낸 코드를 입력해 새 방에 참여할 수 있습니다.</p>
        <input className="input" value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} />
        {joinMessage ? <p className="save-notice">{joinMessage}</p> : null}
        <button className="primary wide" onClick={joinRoom}>
          프로방 가입
        </button>
      </Card>
    </>
  );
}

function MemberMessagesPage({
  currentMember,
  joinedRooms,
  onAcceptInvitation,
  onRefreshConnections
}: {
  currentMember: PrototypeAccount | null;
  joinedRooms: PrototypeRoom[];
  onAcceptInvitation: (data: { membership: RoomMembership; room: PrototypeRoom }) => void;
  onRefreshConnections?: () => Promise<void> | void;
}) {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<PrototypeMessage[]>([]);
  const [notice, setNotice] = useState("");
  const [directoryPeople, setDirectoryPeople] = useState<DirectoryPerson[]>([]);
  const [selectedPro, setSelectedPro] = useState<DirectoryPerson | null>(null);
  const [messageDraft, setMessageDraft] = useState("");
  const directorySource = directoryPeople.length > 0 ? directoryPeople : proDirectory;
  const filteredPros = directorySource.filter((pro) =>
    `${pro.name} ${pro.meta} ${pro.badge}`.toLowerCase().includes(query.trim().toLowerCase())
  );
  const messageCards: Array<{
    id: string;
    meta: string;
    source?: PrototypeMessage;
    status: string;
    title: string;
  }> =
    messages.length > 0 ? messages.map((message) => formatMessageForList(message, currentMember?.id)) : memberMessageSamples;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetch(`/api/directory?role=pro&q=${encodeURIComponent(query)}`)
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
    if (!currentMember) {
      return;
    }

    const loadMessages = () => {
      fetch(`/api/messages?userId=${encodeURIComponent(currentMember.id)}`)
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
  }, [currentMember?.id]);

  async function requestRoom(pro: DirectoryPerson) {
    if (!currentMember) {
      setNotice("로그인이 필요합니다.");
      return;
    }

    const response = await fetch("/api/room-join-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId: currentMember.id,
        memberName: currentMember.displayName,
        message: `${currentMember.displayName}님이 프로방 가입을 신청했습니다.`,
        proId: pro.userId,
        proName: pro.name
      })
    }).catch(() => undefined);
    const saved = response ? ((await response.json().catch(() => ({}))) as { ok?: boolean }) : undefined;
    const suffix = saved?.ok ? " DB에 신청 내역이 저장됐습니다." : " Google Sheets 설정 전에는 화면 확인용으로만 표시됩니다.";
    if (saved?.ok) {
      setMessages((current) => [
        {
          id: `local_request_${Date.now()}`,
          senderId: currentMember.id,
          senderName: currentMember.displayName,
          receiverId: pro.userId,
          receiverName: pro.name,
          messageType: "request",
          content: `${currentMember.displayName}님이 프로방 가입을 신청했습니다.`,
          status: "active"
        },
        ...current
      ]);
    }
    setNotice(`${pro.name}에게 프로방 신청을 보냈습니다. 프로가 방을 선택해 승인하면 연결됩니다.${suffix}`);
  }

  function openMessage(pro: DirectoryPerson) {
    setSelectedPro(pro);
    setMessageDraft("");
    setNotice(`${pro.name}님에게 보낼 메시지를 입력해 주세요.`);
  }

  function replyToMessage(message: PrototypeMessage) {
    const pro = {
      id: `reply_${message.senderId}`,
      userId: message.senderId,
      name: message.senderName,
      profileImageUrl: "",
      meta: "받은 메시지에서 선택",
      badge: "답장"
    };
    setSelectedPro(pro);
    setMessageDraft("");
    setNotice(`${message.senderName}님에게 답장할 수 있습니다.`);
  }

  async function sendMessage() {
    if (!currentMember) {
      setNotice("로그인이 필요합니다.");
      return;
    }

    if (!selectedPro) {
      setNotice("먼저 메시지를 보낼 프로를 선택해 주세요.");
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
        receiverId: selectedPro.userId,
        receiverName: selectedPro.name,
        senderId: currentMember.id,
        senderName: currentMember.displayName
      })
    }).catch(() => undefined);
    const saved = response
      ? ((await response.json().catch(() => ({}))) as { message?: PrototypeMessage; ok?: boolean })
      : undefined;
    if (saved?.ok) {
      setMessages((current) => [
        saved.message ?? {
          id: `local_message_${Date.now()}`,
          senderId: currentMember.id,
          senderName: currentMember.displayName,
          receiverId: selectedPro.userId,
          receiverName: selectedPro.name,
          messageType: "text",
          content,
          createdAt: new Date().toISOString(),
          status: "active"
        },
        ...current
      ]);
      setMessageDraft("");
    }
    setNotice(`${selectedPro.name}님에게 메시지를 보냈습니다.${saved?.ok ? " DB에 메시지가 저장됐습니다." : " Google Sheets 설정 전에는 화면 확인용으로만 표시됩니다."}`);
  }

  async function acceptInvitation(message: PrototypeMessage) {
    if (!currentMember) {
      setNotice("로그인이 필요합니다.");
      return;
    }

    const response = await fetch("/api/room-invitations/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId: currentMember.id,
        memberName: currentMember.displayName,
        proId: message.senderId,
        proName: message.senderName,
        relatedId: message.relatedId,
        roomId: message.roomId,
        roomName: message.content.replace(/ 초대가 도착했습니다\.?$/, "").replace(/^.+님이 /, "").replace(/에 초대했습니다\.?$/, "")
      })
    }).catch(() => undefined);
    const result = response
      ? ((await response.json().catch(() => ({}))) as {
          membership?: RoomMembership;
          ok?: boolean;
          room?: PrototypeRoom;
        })
      : undefined;

    if (result?.ok && result.membership && result.room) {
      onAcceptInvitation({ membership: result.membership, room: result.room });
      await onRefreshConnections?.();
      setMessages((current) => current.map((item) => (item.id === message.id ? { ...item, readAt: new Date().toISOString() } : item)));
      setNotice(`${result.room.name} 초대를 수락했습니다. 프로방에 추가됐습니다.`);
      return;
    }

    setNotice("Google Sheets 설정 전에는 초대 수락을 저장할 수 없습니다.");
  }

  return (
    <>
      <PageHeader title="메시지" desc="프로 찾기, 프로방 신청, 개인 메시지를 확인합니다." />
      <Card>
        <div className="search-box">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="프로 이름, 지역, 레슨 분야 검색" />
        </div>
        <div className="directory-list scroll-list directory-scroll">
          {filteredPros.map((pro) => (
            <div className="directory-item" key={pro.id}>
              <ProfileTile imageUrl={pro.profileImageUrl} name={pro.name} />
              <div>
                <Badge tone="green">{pro.badge}</Badge>
                <p>{pro.meta}</p>
              </div>
              <div className="directory-actions">
                <button className="secondary" onClick={() => requestRoom(pro)}>
                  신청
                </button>
                <button className="icon-button small" aria-label={`${pro.name}에게 메시지`} onClick={() => openMessage(pro)}>
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
            <h3>{selectedPro ? selectedPro.name : "메시지 받을 프로 선택"}</h3>
            <p>{selectedPro ? "선택한 프로에게 1:1 메시지를 보냅니다." : "검색 목록에서 종이비행기 버튼을 눌러 상대를 선택하세요."}</p>
          </div>
          {selectedPro ? (
            <button className="secondary" onClick={() => setSelectedPro(null)}>
              선택 해제
            </button>
          ) : null}
        </div>
        <textarea
          className="message-input"
          disabled={!selectedPro}
          onChange={(event) => setMessageDraft(event.target.value)}
          placeholder="예) 오늘 올린 스윙 영상 확인 부탁드립니다."
          value={messageDraft}
        />
        <button className="primary wide" disabled={!selectedPro || !messageDraft.trim()} onClick={sendMessage}>
          메시지 보내기
        </button>
      </Card>
      <Section title="내 연결">
        <div className="stack compact-stack scroll-list relation-scroll">
          {joinedRooms.length > 0 ? (
            joinedRooms.map((room) => (
              <Card key={room.id}>
                <div className="row spread">
                  <div>
                    <h3>{room.proName}</h3>
                    <p>{room.name} · {room.purpose}</p>
                  </div>
                  <Badge>연결됨</Badge>
                </div>
              </Card>
            ))
          ) : (
            <Card>
              <h3>아직 연결된 프로가 없습니다.</h3>
              <p>프로를 검색해 신청하거나 초대코드로 프로방에 가입할 수 있습니다.</p>
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
                  <Badge tone={message.status === "새 메시지" ? "amber" : "gray"}>{message.status}</Badge>
                  {message.source?.messageType === "invite" && message.source.receiverId === currentMember?.id ? (
                    <button className="secondary" onClick={() => (message.source ? acceptInvitation(message.source) : undefined)}>
                      수락
                    </button>
                  ) : null}
                  {message.source?.messageType === "text" && message.source.senderId !== currentMember?.id ? (
                    <button className="secondary" onClick={() => (message.source ? replyToMessage(message.source) : undefined)}>
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

function InvitePage({ go }: { go: GoToPage }) {
  return (
    <>
      <PageHeader title="프로방 초대" desc="카카오톡이나 문자로 받은 링크에서 들어온 화면입니다." />
      <Card tone="soft">
        <Badge>초대됨</Badge>
        <h3>김프로 · 드라이버 교정방</h3>
        <p>공통 드릴 확인, 내 기록 공유, 개인 피드백과 훈련 과제를 확인할 수 있습니다.</p>
        <button className="primary wide" onClick={() => go("signup")}>
          가입하고 참여하기
        </button>
        <button className="secondary wide" onClick={() => go("room")}>
          이미 계정이 있어요
        </button>
      </Card>
    </>
  );
}

function SignupPage({ go }: { go: GoToPage }) {
  return (
    <>
      <PageHeader title="간편 가입" desc="프로토타입에서는 아이디와 비밀번호만 가볍게 만듭니다." />
      <Card>
        <Field label="아이디">
          <input className="input" defaultValue="golfalign_user" />
        </Field>
        <Field label="비밀번호">
          <input className="input" type="password" defaultValue="password123" />
        </Field>
        <Field label="가입 유형">
          <Chip active>일반 회원</Chip>
          <Chip>프로</Chip>
        </Field>
        <p>정식 가입에서는 이름, 연락처, 골프 경력, 프로 인증 정보를 단계별로 받습니다.</p>
        <button className="primary wide" onClick={() => go("join-room")}>
          가입 완료
        </button>
      </Card>
    </>
  );
}

function JoinRoomPage({ go, uploadedRecords, useDemoRecords }: { go: GoToPage; uploadedRecords: RecordItem[]; useDemoRecords: boolean }) {
  const records = uploadedRecords.length > 0 ? uploadedRecords : useDemoRecords ? recentRecords : [];

  return (
    <>
      <PageHeader title="방 참여 완료" desc="이제 기록을 선택해 프로에게 공유할 수 있습니다." />
      <Card>
        <h3>공유할 기록 선택</h3>
        <p>선택한 기록만 김프로가 볼 수 있습니다. 공유하지 않고 시작해도 됩니다.</p>
        {records.map((record) => (
          <TrainingRow key={record.id} title={record.title} meta={record.meta} />
        ))}
        <button className="primary wide" onClick={() => go("room")}>
          선택 기록 공유
        </button>
        <button className="secondary wide" onClick={() => go("room")}>
          공유하지 않고 시작
        </button>
      </Card>
    </>
  );
}

function MorePage({
  currentMember,
  onUpdateProfile
}: {
  currentMember: PrototypeAccount | null;
  onUpdateProfile: (profile: Partial<PrototypeAccount> & { id: string }) => Promise<{ ok: true; account: PrototypeAccount } | { ok: false; message: string }>;
}) {
  return (
    <>
      <PageHeader title="더보기" desc="부가 기능과 설정을 확인합니다." />
      <RoundTeaser />
      <ProfileEditor account={currentMember} onSave={onUpdateProfile} />
      <Card>
        <div className="row">
          <Languages size={22} />
          <div>
            <h3>언어 설정</h3>
            <p>앱 표시 언어를 선택합니다. 기본값은 기기 언어를 우선 확인합니다.</p>
          </div>
        </div>
        <div className="chips">
          <Chip active>한국어</Chip>
          <Chip>English</Chip>
        </div>
      </Card>
      <Card>
        <h3>저장 공간</h3>
        <p>프로필 사진은 512x512로 변환해 Google Drive에 보관합니다. 영상은 스냅샷을 먼저 보여주고, 원본은 필요할 때 다운로드합니다.</p>
      </Card>
    </>
  );
}
