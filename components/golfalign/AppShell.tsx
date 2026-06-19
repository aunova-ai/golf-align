"use client";

import Image from "next/image";
import {
  Camera,
  ClipboardCheck,
  Dumbbell,
  Home,
  LogOut,
  MessageSquareText,
  MoreHorizontal,
  ShieldCheck,
  UserRound,
  UsersRound
} from "lucide-react";
import { useEffect, useState } from "react";
import { MemberPages } from "./MemberPages";
import { ProPages } from "./ProPages";
import type {
  AccountRole,
  FeedbackItem,
  Mode,
  Page,
  PrototypeAccount,
  PrototypeRoom,
  RecordItem,
  RoomMembership,
  TrainingAssignment,
  TrainingResult
} from "./types";
import { Card, Chip, NavButton } from "./ui";
import { usePrototypeStore } from "./usePrototypeStore";

const pageNav: Record<Page, Page> = {
  home: "home",
  records: "records",
  upload: "records",
  detail: "records",
  training: "training",
  "training-result": "training",
  room: "room",
  invite: "room",
  signup: "room",
  "join-room": "room",
  "member-messages": "member-messages",
  more: "more",
  "pro-home": "pro-home",
  "pro-rooms": "pro-rooms",
  "pro-room-detail": "pro-rooms",
  "pro-member": "pro-rooms",
  "pro-messages": "pro-messages",
  "pro-feedback": "pro-feedback",
  "pro-training-review": "pro-training-review"
};

const lastLoginIdStorageKey = "golfalign:last-login-id";

export function AppShell() {
  const [accountRole, setAccountRole] = useState<AccountRole | null>(null);
  const [currentAccount, setCurrentAccount] = useState<PrototypeAccount | null>(null);
  const [mode, setMode] = useState<Mode>("member");
  const [page, setPage] = useState<Page>("home");
  const [sessionMessage, setSessionMessage] = useState("");
  const [adminNotice, setAdminNotice] = useState("");
  const prototypeStore = usePrototypeStore();

  useEffect(() => {
    const authError = new URLSearchParams(window.location.search).get("auth_error");
    if (authError) {
      const messages: Record<string, string> = {
        google_login_failed: "Google 로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
        google_not_configured: "Google 로그인을 사용하려면 OAuth 클라이언트 설정이 필요합니다.",
        google_role_invalid: "Google 로그인 계정 유형을 확인할 수 없습니다.",
        google_state_invalid: "Google 로그인 보안 확인이 만료되었습니다. 다시 시도해 주세요."
      };
      setSessionMessage(messages[authError] ?? "로그인 처리 중 오류가 발생했습니다.");
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    fetch("/api/auth/session")
      .then((response) => response.json())
      .then((session: { ok?: boolean; account?: PrototypeAccount; sheetSynced?: boolean }) => {
        if (session.ok && session.account) {
          enterApp(session.account);
          if (session.account.authProvider === "google" && !session.sheetSynced) {
            setSessionMessage("Google 계정으로 로그인했습니다. Google Sheets 반영은 서비스 계정 설정 후 활성화됩니다.");
          }
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!currentAccount || currentAccount.role === "admin") {
      return;
    }

    if (currentAccount.role === "pro") {
      fetch(`/api/lesson-rooms?proId=${encodeURIComponent(currentAccount.id)}`)
        .then((response) => response.json())
        .then((result: { ok?: boolean; rooms?: PrototypeRoom[] }) => {
          if (result.ok && result.rooms) {
            result.rooms.forEach((room) => prototypeStore.upsertRoom(room));
          }
        })
        .catch(() => undefined);

      fetch(`/api/room-members?proId=${encodeURIComponent(currentAccount.id)}`)
        .then((response) => response.json())
        .then((result: { memberships?: RoomMembership[]; ok?: boolean; rooms?: PrototypeRoom[] }) => {
          if (result.ok) {
            result.rooms?.forEach((room) => prototypeStore.upsertRoom(room));
            result.memberships?.forEach((membership) => prototypeStore.upsertRoomMembership(membership));

            const roomIds = result.rooms?.map((room) => room.id).join(",") ?? "";
            if (roomIds) {
              fetch(`/api/records?roomIds=${encodeURIComponent(roomIds)}`)
                .then((response) => response.json())
                .then((recordsResult: { ok?: boolean; records?: RecordItem[] }) => {
                  if (recordsResult.ok && recordsResult.records) {
                    recordsResult.records.forEach((record) => prototypeStore.upsertRecord(record));
                  }
                })
                .catch(() => undefined);
            }
          }
        })
        .catch(() => undefined);

      fetch(`/api/training-assignments?proId=${encodeURIComponent(currentAccount.id)}`)
        .then((response) => response.json())
        .then((result: { assignments?: TrainingAssignment[]; ok?: boolean }) => {
          if (result.ok && result.assignments) {
            result.assignments.forEach((assignment) => prototypeStore.upsertTrainingAssignment(assignment));
          }
        })
        .catch(() => undefined);

      const proRoomIds = prototypeStore.getRoomsForPro(currentAccount.id).map((room) => room.id).join(",");
      fetch(`/api/training-results?roomIds=${encodeURIComponent(proRoomIds)}`)
        .then((response) => response.json())
        .then((result: { ok?: boolean; results?: TrainingResult[] }) => {
          if (result.ok && result.results) {
            result.results.forEach((trainingResult) => prototypeStore.upsertTrainingResult(trainingResult));
          }
        })
        .catch(() => undefined);

      fetch(`/api/feedback?proId=${encodeURIComponent(currentAccount.id)}`)
        .then((response) => response.json())
        .then((result: { feedback?: FeedbackItem[]; ok?: boolean }) => {
          if (result.ok && result.feedback) {
            result.feedback.forEach((feedback) => prototypeStore.upsertFeedback(feedback));
          }
        })
        .catch(() => undefined);
      return;
    }

    fetch(`/api/room-members?memberId=${encodeURIComponent(currentAccount.id)}`)
      .then((response) => response.json())
      .then((result: { memberships?: RoomMembership[]; ok?: boolean; rooms?: PrototypeRoom[] }) => {
        if (result.ok) {
          result.rooms?.forEach((room) => prototypeStore.upsertRoom(room));
          result.memberships?.forEach((membership) => prototypeStore.upsertRoomMembership(membership));
        }
      })
      .catch(() => undefined);

    fetch(`/api/records?memberId=${encodeURIComponent(currentAccount.id)}`)
      .then((response) => response.json())
      .then((result: { ok?: boolean; records?: RecordItem[] }) => {
        if (result.ok && result.records) {
          result.records.forEach((record) => prototypeStore.upsertRecord(record));
        }
      })
      .catch(() => undefined);

    fetch(`/api/feedback?memberId=${encodeURIComponent(currentAccount.id)}`)
      .then((response) => response.json())
      .then((result: { feedback?: FeedbackItem[]; ok?: boolean }) => {
        if (result.ok && result.feedback) {
          result.feedback.forEach((feedback) => prototypeStore.upsertFeedback(feedback));
        }
      })
      .catch(() => undefined);

    const joinedRoomIds = prototypeStore.getRoomsForMember(currentAccount.id).map((room) => room.id).join(",");
    fetch(`/api/training-assignments?memberId=${encodeURIComponent(currentAccount.id)}&roomIds=${encodeURIComponent(joinedRoomIds)}`)
      .then((response) => response.json())
      .then((result: { assignments?: TrainingAssignment[]; ok?: boolean }) => {
        if (result.ok && result.assignments) {
          result.assignments.forEach((assignment) => prototypeStore.upsertTrainingAssignment(assignment));
        }
      })
      .catch(() => undefined);

    fetch(`/api/training-results?userId=${encodeURIComponent(currentAccount.id)}`)
      .then((response) => response.json())
      .then((result: { ok?: boolean; results?: TrainingResult[] }) => {
        if (result.ok && result.results) {
          result.results.forEach((trainingResult) => prototypeStore.upsertTrainingResult(trainingResult));
        }
      })
      .catch(() => undefined);
  }, [currentAccount?.id, currentAccount?.role]);

  useEffect(() => {
    if (!currentAccount || currentAccount.role === "admin") {
      return;
    }

    const intervalId = window.setInterval(() => {
      refreshRoomConnections(currentAccount).catch(() => undefined);
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [currentAccount?.id, currentAccount?.role]);

  function go(nextPage: Page) {
    setPage(nextPage);
  }

  function openRecord(recordId: string, nextPage: Page = "detail") {
    prototypeStore.selectRecord(recordId);
    setPage(nextPage);
  }

  async function refreshRoomConnections(account = currentAccount) {
    if (!account || account.role === "admin") {
      return;
    }

    const query =
      account.role === "pro"
        ? `proId=${encodeURIComponent(account.id)}`
        : `memberId=${encodeURIComponent(account.id)}`;

    const response = await fetch(`/api/room-members?${query}`).catch(() => undefined);
    const result = response
      ? ((await response.json().catch(() => ({}))) as {
          memberships?: RoomMembership[];
          ok?: boolean;
          rooms?: PrototypeRoom[];
        })
      : undefined;

    if (!result?.ok) {
      return;
    }

    result.rooms?.forEach((room) => prototypeStore.upsertRoom(room));
    result.memberships?.forEach((membership) => prototypeStore.upsertRoomMembership(membership));
  }

  function enterApp(account: PrototypeAccount) {
    const nextMode = account.role === "admin" ? "member" : account.role;
    setAccountRole(account.role);
    setCurrentAccount(account);
    setMode(nextMode);
    setPage(nextMode === "member" ? "home" : "pro-home");
  }

  function changeAdminPreview(nextMode: Mode) {
    setMode(nextMode);
    setPage(nextMode === "member" ? "home" : "pro-home");
  }

  async function clearTestData() {
    prototypeStore.clearPrototypeTestData();
    const response = await fetch("/api/dev/clear-test-data", { method: "POST" }).catch(() => undefined);
    const result = response
      ? ((await response.json().catch(() => ({}))) as {
          ok?: boolean;
          removedFeedbackCount?: number;
          removedRecordCount?: number;
        })
      : undefined;

    if (result?.ok) {
      setAdminNotice(`테스트 기록 ${result.removedRecordCount ?? 0}개, 피드백 ${result.removedFeedbackCount ?? 0}개를 정리했습니다.`);
      return;
    }

    setAdminNotice("브라우저 테스트 데이터는 정리했습니다. 서버 정리는 다시 시도해 주세요.");
  }

  async function updateProfile(profile: Partial<PrototypeAccount> & { id: string }) {
    const localAccount = prototypeStore.updateAccountProfile(profile);
    if (localAccount && currentAccount?.id === localAccount.id) {
      setCurrentAccount(localAccount);
    }

    const response = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile)
    }).catch(() => undefined);
    const result = response
      ? ((await response.json().catch(() => ({}))) as {
          account?: PrototypeAccount;
          message?: string;
          ok?: boolean;
        })
      : undefined;

    if (result?.ok && result.account) {
      prototypeStore.updateAccountProfile(result.account);
      if (currentAccount?.id === result.account.id) {
        setCurrentAccount(result.account);
      }
      return { ok: true as const, account: result.account };
    }

    if (localAccount) {
      return { ok: true as const, account: localAccount };
    }

    return { ok: false as const, message: result?.message ?? "프로필 저장에 실패했습니다." };
  }

  function logout() {
    fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    setAccountRole(null);
    setCurrentAccount(null);
    setMode("member");
    setPage("home");
  }

  if (!accountRole) {
    return (
      <div className="app-shell auth-shell">
        <AuthScreen
          onCreateAccount={prototypeStore.createAccount}
          onFindAccount={prototypeStore.findAccount}
          onEnter={enterApp}
          sessionMessage={sessionMessage}
        />
      </div>
    );
  }

  const previewMemberAccount =
    accountRole === "admin"
      ? prototypeStore.accounts.find((account) => account.id === "acc_member_demo") ?? currentAccount
      : currentAccount;
  const previewProAccount =
    accountRole === "admin"
      ? prototypeStore.accounts.find((account) => account.id === "acc_pro_demo") ?? currentAccount
      : currentAccount;
  const memberRooms = prototypeStore.getRoomsForMember(previewMemberAccount?.id);
  const proRooms = prototypeStore.getRoomsForPro(previewProAccount?.id);
  const memberRoomIds = new Set(memberRooms.map((room) => room.id));
  const memberVisibleRecords = prototypeStore.records.filter((record) => {
    if (!previewMemberAccount) {
      return false;
    }

    if (record.memberId) {
      return record.memberId === previewMemberAccount.id;
    }

    return previewMemberAccount.id === "acc_member_demo" && (!record.roomId || memberRoomIds.has(record.roomId));
  });
  const memberVisibleRecordIds = new Set(memberVisibleRecords.map((record) => record.id));
  const latestMemberFeedback = prototypeStore.feedback.find((feedback) => memberVisibleRecordIds.has(feedback.recordId));

  return (
    <div className="app-shell">
      <header className="topbar">
        <Image
          className="wordmark"
          src="/assets/golfalign-wordmark.png"
          alt="GolfAlign"
          width={156}
          height={40}
          priority
        />
        <button className="icon-button" aria-label="로그아웃" onClick={logout}>
          <LogOut size={20} />
        </button>
      </header>

      <div className="role-strip">
        {currentAccount?.profileImageUrl ? (
          <img className="role-profile-image" src={currentAccount.profileImageUrl} alt={`${currentAccount.displayName} 프로필`} />
        ) : (
          <UserRound size={18} />
        )}
        <span>
          {accountRole === "admin" ? "관리자 계정" : mode === "member" ? "일반 회원 계정" : "프로 계정"}으로 로그인됨
          {currentAccount ? ` · ${currentAccount.displayName}` : ""}
        </span>
      </div>

      {accountRole === "admin" ? (
        <>
          <div className="mode-switch admin-switch" aria-label="관리자 화면 전환">
            <button className={mode === "member" ? "active" : ""} onClick={() => changeAdminPreview("member")}>
              회원 화면 확인
            </button>
            <button className={mode === "pro" ? "active" : ""} onClick={() => changeAdminPreview("pro")}>
              프로 화면 확인
            </button>
          </div>
          <div className="admin-tools">
            <button className="secondary" onClick={clearTestData} type="button">
              테스트 기록 정리
            </button>
            {adminNotice ? <span>{adminNotice}</span> : null}
          </div>
        </>
      ) : null}

      <main className="screen">
        {mode === "member" ? (
          <MemberPages
            page={page}
            go={go}
            activeRecord={prototypeStore.activeRecord}
            activeFeedback={prototypeStore.activeFeedback}
            latestSavedFeedback={latestMemberFeedback}
            activeTraining={prototypeStore.activeTraining}
            currentMember={previewMemberAccount}
            joinedRooms={memberRooms}
            onUpdateProfile={updateProfile}
            onAcceptInvitation={({ membership, room }) => {
              prototypeStore.upsertRoom(room);
              prototypeStore.upsertRoomMembership(membership);
            }}
            onRefreshConnections={refreshRoomConnections}
            trainingAssignments={prototypeStore.trainingAssignments.filter((assignment) => {
              const joinedRoomIds = new Set(memberRooms.map((room) => room.id));
              return assignment.memberId === previewMemberAccount?.id || Boolean(assignment.roomId && joinedRoomIds.has(assignment.roomId) && assignment.assignmentType === "room_common");
            })}
            uploadedRecords={memberVisibleRecords}
            onCreateRecord={async (record) => {
              prototypeStore.addRecord({
                ...record,
                memberId: previewMemberAccount?.id,
                memberName: previewMemberAccount?.displayName
              });

              if (!previewMemberAccount) {
                return;
              }

              const room = record.roomId ? prototypeStore.rooms.find((item) => item.id === record.roomId) : undefined;
              await fetch("/api/records", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  bodyAngle: record.bodyAngle,
                  cameraAngle: record.cameraAngle,
                  media: record.media,
                  mediaUrl: record.mediaUrl,
                  memberId: previewMemberAccount.id,
                  memberName: previewMemberAccount.displayName,
                  memo: record.memo,
                  meta: record.meta,
                  recordId: record.id,
                  recordType: record.recordType,
                  roomId: record.roomId,
                  roomName: record.roomName,
                  roomProId: room?.proId,
                  thumbnailUrl: record.thumbnailUrl,
                  title: record.title
                })
              }).catch(() => undefined);
            }}
            onJoinRoom={async (code) => {
              if (!previewMemberAccount) {
                return { ok: false, message: "로그인이 필요합니다." };
              }

              const localResult = prototypeStore.joinRoomByCode({
                code,
                memberId: previewMemberAccount.id,
                memberName: previewMemberAccount.displayName
              });

              if (localResult.ok) {
                fetch("/api/room-members", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    code,
                    memberId: previewMemberAccount.id,
                    memberName: previewMemberAccount.displayName
                  })
                }).catch(() => undefined);
                return localResult;
              }

              try {
                const response = await fetch("/api/room-members", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    code,
                    memberId: previewMemberAccount.id,
                    memberName: previewMemberAccount.displayName
                  })
                });
                const result = (await response.json()) as {
                  membership?: RoomMembership;
                  message?: string;
                  ok?: boolean;
                  room?: PrototypeRoom;
                };

                if (result.ok && result.room && result.membership) {
                  prototypeStore.upsertRoom(result.room);
                  prototypeStore.upsertRoomMembership(result.membership);
                  return { ok: true, room: result.room };
                }

                return { ok: false, message: result.message ?? localResult.message };
              } catch {
                return localResult;
              }
            }}
            onSelectRecord={openRecord}
            onSelectTraining={(assignmentId) => {
              prototypeStore.selectTraining(assignmentId);
              setPage("training-result");
            }}
            onSaveTrainingResult={(result) => {
              const savedResult = prototypeStore.saveTrainingResult(result);
              fetch("/api/training-results", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  actualReps: result.count,
                  assignmentId: result.assignmentId,
                  attachmentLabel: result.attachmentLabel,
                  difficulty: result.difficulty,
                  memberName: result.memberName,
                  memberNote: result.memo,
                  resultId: savedResult.id,
                  roomId: prototypeStore.activeTraining?.roomId,
                  title: result.title,
                  userId: previewMemberAccount?.id,
                  visibility: result.shareToRoom ? "room" : "private"
                })
              }).catch(() => undefined);
            }}
          />
        ) : (
          <ProPages
            page={page}
            go={go}
            activeFeedback={prototypeStore.activeFeedback}
            activeRecord={prototypeStore.activeRecord}
            currentPro={previewProAccount}
            memberships={prototypeStore.getMembersForPro(previewProAccount?.id)}
            onCreateRoom={async (data) => {
              if (!previewProAccount) {
                return { ok: false, message: "로그인이 필요합니다." };
              }

              const localResult = prototypeStore.createRoom({
                ...data,
                proId: previewProAccount.id,
                proName: previewProAccount.displayName
              });
              if (!localResult.ok) {
                return localResult;
              }

              fetch("/api/lesson-rooms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  inviteCode: localResult.room.inviteCode,
                  name: localResult.room.name,
                  proId: previewProAccount.id,
                  proName: previewProAccount.displayName,
                  purpose: localResult.room.purpose,
                  roomId: localResult.room.id
                })
              }).catch(() => undefined);

              return localResult;
            }}
            onCreateTrainingAssignment={(assignment) => {
              const targetMemberId =
                assignment.assignmentType === "room_common"
                  ? undefined
                  : assignment.memberId ?? prototypeStore.getMembersForPro(previewProAccount?.id)[0]?.memberId;
              const targetRoomId = assignment.roomId ?? proRooms[0]?.id;
              const savedAssignment = prototypeStore.addTrainingAssignment({
                ...assignment,
                memberId: targetMemberId,
                roomId: targetRoomId
              });
              fetch("/api/training-assignments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  assignmentId: savedAssignment.id,
                  assignmentScope: savedAssignment.assignmentType,
                  dueDate: savedAssignment.dueLabel,
                  goal: savedAssignment.goal,
                  memberId: savedAssignment.memberId,
                  proId: previewProAccount?.id,
                  recordGuide: savedAssignment.recordGuide,
                  requireMedia: savedAssignment.requireMedia,
                  roomId: savedAssignment.roomId,
                  title: savedAssignment.title
                })
              }).catch(() => undefined);
            }}
            onApproveJoinRequest={(membership) => prototypeStore.upsertRoomMembership(membership)}
            onRefreshConnections={refreshRoomConnections}
            onSelectRecord={(recordId) => openRecord(recordId, "pro-feedback")}
            onSaveFeedback={(feedback) => {
              const savedFeedback = prototypeStore.saveFeedback(feedback);
              const record = prototypeStore.records.find((item) => item.id === feedback.recordId);
              fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  annotations: feedback.annotations,
                  feedbackId: savedFeedback.id,
                  focusComment: feedback.focusComment,
                  goalComment: feedback.goalComment,
                  hiddenAngleMarkIds: feedback.hiddenAngleMarkIds,
                  memberId: record?.memberId,
                  poseAnalysis: feedback.poseAnalysis,
                  poseAnglesVisible: feedback.poseAnglesVisible,
                  poseEngine: feedback.poseEngine,
                  proId: previewProAccount?.id,
                  proName: previewProAccount?.displayName,
                  recordId: feedback.recordId,
                  roomId: record?.roomId,
                  snapshotUrl: feedback.snapshotUrl,
                  stickerComment: feedback.stickerComment
                })
              }).catch(() => undefined);
              return savedFeedback;
            }}
            onSaveTrainingReview={(resultId, proComment) => {
              prototypeStore.saveTrainingReview(resultId, proComment);
              fetch("/api/training-results/review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  proComment,
                  proId: previewProAccount?.id,
                  resultId
                })
              }).catch(() => undefined);
            }}
            onUpdateProfile={updateProfile}
            pendingTrainingResults={prototypeStore.pendingTrainingResults}
            rooms={proRooms}
            sharedRecords={prototypeStore.sharedRecords.filter((record) =>
              proRooms.some((room) => room.id === record.roomId)
            )}
            trainingAssignments={prototypeStore.trainingAssignments}
          />
        )}
      </main>

      {mode === "member" ? <MemberNav active={pageNav[page]} go={go} /> : <ProNav active={pageNav[page]} go={go} />}
    </div>
  );
}

function AuthScreen({
  onCreateAccount,
  onEnter,
  onFindAccount,
  sessionMessage
}: {
  onCreateAccount: (account: {
    displayName: string;
    organization?: string;
    password: string;
    phone?: string;
    role: AccountRole;
    username: string;
  }) =>
    | { ok: true; account: PrototypeAccount }
    | { ok: false; message: string };
  onEnter: (account: PrototypeAccount) => void;
  onFindAccount: (username: string, password: string) => PrototypeAccount | undefined;
  sessionMessage?: string;
}) {
  const [authView, setAuthView] = useState<"login" | "signup">("login");
  const [selectedRole, setSelectedRole] = useState<AccountRole>("member");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [organization, setOrganization] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [syncMessage, setSyncMessage] = useState("");

  useEffect(() => {
    if (authView !== "login") {
      return;
    }

    const savedLoginId = window.localStorage.getItem(lastLoginIdStorageKey);
    if (savedLoginId) {
      setUsername(savedLoginId);
    }
  }, [authView]);

  function changeAuthView(nextView: "login" | "signup") {
    setAuthView(nextView);
    setAuthMessage("");
    setSyncMessage("");
    setSelectedRole("member");
    setUsername("");
    setPassword("");
    setDisplayName("");
    setPhone("");
    setOrganization("");
  }

  function startGoogleAuth(role: "member" | "pro") {
    setAuthMessage("");
    setSyncMessage("");
    window.location.href = `/api/auth/google/start?role=${role}`;
  }

  async function syncUserToSheet() {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          displayName,
          organization,
          password,
          phone,
          role: selectedRole,
          username
        })
      });
      const result = (await response.json()) as { ok?: boolean; message?: string };
      if (!result.ok) {
        setSyncMessage(result.message ?? "Google Sheets 저장은 나중에 다시 시도할 수 있습니다.");
        return false;
      }

      setSyncMessage("가입 정보가 저장되었습니다.");
      return true;
    } catch {
      setSyncMessage("저장 중 오류가 발생했습니다. 현재 기기에는 임시 저장됩니다.");
      return false;
    }
  }

  async function submitAuth() {
    if (authView === "signup") {
      const result = onCreateAccount({
        displayName,
        organization,
        username,
        password,
        phone,
        role: selectedRole
      });

      if (!result.ok) {
        setAuthMessage(result.message);
        return;
      }

      const synced = await syncUserToSheet();
      if (!synced) {
        setSyncMessage("계정은 이 기기에 생성되었습니다. Google Sheets 반영은 연결 설정 후 다시 확인하세요.");
      }

      window.localStorage.setItem(lastLoginIdStorageKey, username);
      onEnter(result.account);
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });
      const result = (await response.json()) as {
        account?: PrototypeAccount;
        code?: string;
        message?: string;
        mode?: string;
        ok?: boolean;
      };

      if (result.ok && result.account) {
        setSyncMessage("로그인했습니다.");
        window.localStorage.setItem(lastLoginIdStorageKey, username);
        onEnter(result.account);
        return;
      }

      const canUseOfflineFallback =
        result.code === "GOOGLE_SHEETS_NOT_CONFIGURED" ||
        result.code === "LOCAL_ACCOUNT_NOT_FOUND" ||
        result.mode === "local_prototype";

      if (!canUseOfflineFallback) {
        setAuthMessage(result.message ?? "아이디 또는 비밀번호가 맞지 않습니다.");
        return;
      }
    } catch {
      // Local prototype login stays available when the server DB check is not ready.
    }

    const account = onFindAccount(username, password);
    if (!account) {
      setAuthMessage("아이디 또는 비밀번호가 맞지 않습니다.");
      return;
    }

    setSyncMessage("로컬 프로토타입 계정으로 로그인했습니다. DB 로그인은 Google Sheets 설정 후 활성화됩니다.");
    window.localStorage.setItem(lastLoginIdStorageKey, username);
    onEnter(account);
  }

  return (
    <main className="auth-screen">
      <Image
        className="auth-logo"
        src="/assets/golfalign-wordmark.png"
        alt="GolfAlign"
        width={190}
        height={48}
        priority
      />
      <div className="auth-copy">
        <h1>스윙을 기록하고, 성장을 정렬하다.</h1>
        <p>회원과 프로가 직접 가입하고, 만든 계정으로 다시 로그인할 수 있습니다.</p>
      </div>

      <Card>
        <div className="auth-tabs" aria-label="로그인 또는 회원가입">
          <button className={authView === "login" ? "active" : ""} onClick={() => changeAuthView("login")}>
            로그인
          </button>
          <button className={authView === "signup" ? "active" : ""} onClick={() => changeAuthView("signup")}>
            회원가입
          </button>
        </div>

        <div className="google-auth-panel">
          <p>{authView === "login" ? "Google 계정으로 바로 시작" : "Google 계정으로 가입"}</p>
          <div className="google-auth-actions">
            <button className="google-auth-button" type="button" onClick={() => startGoogleAuth("member")}>
              <span>G</span>
              회원으로 시작
            </button>
            <button className="google-auth-button" type="button" onClick={() => startGoogleAuth("pro")}>
              <span>G</span>
              프로로 시작
            </button>
          </div>
          <small>가입하지 않은 Google 계정은 선택한 유형으로 새 계정을 만듭니다.</small>
        </div>

        <div className="auth-divider">
          <span>또는 직접 입력</span>
        </div>

        <label className="field-label">아이디</label>
        <input className="input" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="아이디 입력" />

        <label className="field-label">비밀번호</label>
        <input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="비밀번호 입력" />

        {authView === "signup" ? (
          <>
            <label className="field-label">이름 / 표시 이름</label>
            <input className="input" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="예: 박회원, 김프로" />

            <label className="field-label">연락처</label>
            <input className="input" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="선택 입력" />

            <label className="field-label">가입 유형</label>
            <div className="chips">
              <Chip active={selectedRole === "member"} onClick={() => setSelectedRole("member")}>
                일반 회원
              </Chip>
              <Chip active={selectedRole === "pro"} onClick={() => setSelectedRole("pro")}>
                프로
              </Chip>
            </div>
            {selectedRole === "pro" ? (
              <>
                <label className="field-label">소속 / 레슨명</label>
                <input className="input" value={organization} onChange={(event) => setOrganization(event.target.value)} placeholder="예: 니엘골프아카데미" />
              </>
            ) : null}
            <p className="auth-note">가입 유형에 따라 회원 앱 또는 프로 앱으로 바로 들어갑니다.</p>
          </>
        ) : (
          <>
            <p className="auth-note">가입한 계정 유형을 자동 확인해 회원 또는 프로 화면으로 이동합니다.</p>
          </>
        )}

        {sessionMessage ? <p className="save-notice">{sessionMessage}</p> : null}
        {authMessage ? <p className="form-error">{authMessage}</p> : null}
        {syncMessage ? <p className="save-notice">{syncMessage}</p> : null}

        <button className="primary wide" onClick={submitAuth}>
          {authView === "login" ? "로그인" : "가입 완료"}
        </button>
      </Card>
    </main>
  );
}

function MemberNav({ active, go }: { active: Page; go: (page: Page) => void }) {
  return (
    <nav className="bottom-nav" aria-label="회원 하단 메뉴">
      <NavButton active={active === "home"} icon={<Home size={20} />} label="홈" onClick={() => go("home")} />
      <NavButton active={active === "records"} icon={<Camera size={20} />} label="기록" onClick={() => go("records")} />
      <NavButton active={active === "training"} icon={<Dumbbell size={20} />} label="훈련" onClick={() => go("training")} />
      <NavButton active={active === "member-messages"} icon={<MessageSquareText size={20} />} label="메시지" onClick={() => go("member-messages")} />
      <NavButton active={active === "more"} icon={<MoreHorizontal size={20} />} label="마이" onClick={() => go("more")} />
    </nav>
  );
}

function ProNav({ active, go }: { active: Page; go: (page: Page) => void }) {
  return (
    <nav className="bottom-nav" aria-label="프로 하단 메뉴">
      <NavButton active={active === "pro-home"} icon={<Home size={20} />} label="홈" onClick={() => go("pro-home")} />
      <NavButton active={active === "pro-rooms"} icon={<UsersRound size={20} />} label="레슨방" onClick={() => go("pro-rooms")} />
      <NavButton active={active === "pro-feedback"} icon={<MessageSquareText size={20} />} label="피드백" onClick={() => go("pro-feedback")} />
      <NavButton active={active === "pro-training-review"} icon={<ClipboardCheck size={20} />} label="훈련" onClick={() => go("pro-training-review")} />
      <NavButton active={active === "pro-messages"} icon={<ShieldCheck size={20} />} label="메시지" onClick={() => go("pro-messages")} />
    </nav>
  );
}
