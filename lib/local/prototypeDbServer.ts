import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";
import type {
  AccountRole,
  DirectoryPerson,
  FeedbackItem,
  PrototypeAccount,
  PrototypeMessage,
  PrototypeRoom,
  RecordItem,
  RoomMembership,
  TrainingAssignment,
  TrainingResult
} from "@/components/golfalign/types";
import { resolveProfileImageForAccount, sampleProfileImages } from "@/lib/mock/profileImages";

type LocalPrototypeDb = {
  accounts: PrototypeAccount[];
  feedback: FeedbackItem[];
  joinRequests: LocalJoinRequest[];
  messages: PrototypeMessage[];
  records: RecordItem[];
  roomInvitations: LocalRoomInvitation[];
  roomMemberships: RoomMembership[];
  rooms: PrototypeRoom[];
  trainingAssignments: TrainingAssignment[];
  trainingResults: TrainingResult[];
};

type LocalJoinRequest = {
  id: string;
  memberId: string;
  memberName: string;
  message: string;
  proId: string;
  proName: string;
  requestedRoomId?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

type LocalRoomInvitation = {
  id: string;
  memberId: string;
  memberName: string;
  message: string;
  proId: string;
  proName: string;
  roomId: string;
  roomName: string;
  status: "pending" | "accepted" | "cancelled";
  createdAt: string;
};

const dbPath = join(process.cwd(), "data", "local-db", "prototype-db.json");

const initialDb: LocalPrototypeDb = {
  accounts: [
    {
      id: "acc_admin_demo",
      username: "golfalign_admin",
      loginId: "golfalign_admin",
      password: "admin123",
      authProvider: "local",
      emailVerified: true,
      role: "admin",
      displayName: "관리자",
      profileImageUrl: sampleProfileImages.kenji
    }
  ],
  feedback: [],
  joinRequests: [],
  messages: [],
  records: [],
  roomInvitations: [],
  roomMemberships: [],
  rooms: [],
  trainingAssignments: [],
  trainingResults: []
};

async function ensureDbDirectory() {
  await mkdir(dirname(dbPath), { recursive: true });
}

async function readLocalPrototypeDb(): Promise<LocalPrototypeDb> {
  try {
    const raw = await readFile(dbPath, "utf8");
    const parsed = JSON.parse(raw) as Partial<LocalPrototypeDb>;
    return {
      accounts: parsed.accounts ?? initialDb.accounts,
      feedback: parsed.feedback ?? [],
      joinRequests: parsed.joinRequests ?? [],
      messages: parsed.messages ?? [],
      records: parsed.records ?? [],
      roomInvitations: parsed.roomInvitations ?? [],
      roomMemberships: parsed.roomMemberships ?? [],
      rooms: parsed.rooms ?? [],
      trainingAssignments: parsed.trainingAssignments ?? [],
      trainingResults: parsed.trainingResults ?? []
    };
  } catch {
    await writeLocalPrototypeDb(initialDb);
    return initialDb;
  }
}

async function writeLocalPrototypeDb(db: LocalPrototypeDb) {
  await ensureDbDirectory();
  await writeFile(dbPath, `${JSON.stringify(db, null, 2)}\n`, "utf8");
}

export async function findLocalAccount(username: string, password?: string) {
  const normalizedUsername = username.trim();
  const db = await readLocalPrototypeDb();
  const account = db.accounts.find((item) => {
    const account = {
      ...item,
      profileImageUrl: item.profileImageUrl || resolveProfileImageForAccount(item)
    };
    const matchesUsername = account.loginId === normalizedUsername || account.username === normalizedUsername;
    return matchesUsername && (password === undefined || account.password === password);
  });
  return account
    ? {
        ...account,
        profileImageUrl: account.profileImageUrl || resolveProfileImageForAccount(account)
      }
    : undefined;
}

export async function createLocalAccount({
  displayName,
  organization,
  password,
  phone,
  role,
  username
}: {
  displayName: string;
  organization?: string;
  password: string;
  phone?: string;
  role: AccountRole;
  username: string;
}) {
  const normalizedUsername = username.trim();
  const db = await readLocalPrototypeDb();
  const existing = db.accounts.find((account) => account.username === normalizedUsername || account.loginId === normalizedUsername);

  if (existing) {
    return {
      account: existing,
      created: false
    };
  }

  const account: PrototypeAccount = {
    id: `acc_local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    username: normalizedUsername,
    loginId: normalizedUsername,
    password,
    authProvider: "local",
    emailVerified: false,
    termsAgreedAt: new Date().toISOString(),
    role,
    displayName: displayName.trim(),
    organization: organization?.trim(),
    phone: phone?.trim(),
    profileImageUrl: resolveProfileImageForAccount({ id: normalizedUsername, role }, db.accounts.length)
  };

  await writeLocalPrototypeDb({
    ...db,
    accounts: [account, ...db.accounts]
  });

  return {
    account,
    created: true
  };
}

export async function updateLocalAccountProfile({
  bio,
  displayName,
  golfExperience,
  id,
  mainGoal,
  organization,
  phone,
  profileImageUrl
}: {
  bio?: string;
  displayName?: string;
  golfExperience?: string;
  id: string;
  mainGoal?: string;
  organization?: string;
  phone?: string;
  profileImageUrl?: string;
}) {
  const db = await readLocalPrototypeDb();
  const account = db.accounts.find((item) => item.id === id);

  if (!account) {
    return undefined;
  }

  const updatedAccount: PrototypeAccount = {
    ...account,
    bio: bio?.trim() || account.bio,
    displayName: displayName?.trim() || account.displayName,
    golfExperience: golfExperience?.trim() || account.golfExperience,
    mainGoal: mainGoal?.trim() || account.mainGoal,
    organization: organization?.trim() || account.organization,
    phone: phone?.trim() || account.phone,
    profileImageUrl: profileImageUrl?.trim() || account.profileImageUrl || resolveProfileImageForAccount(account)
  };

  await writeLocalPrototypeDb({
    ...db,
    accounts: db.accounts.map((item) => (item.id === id ? updatedAccount : item)),
    roomMemberships: db.roomMemberships.map((membership) =>
      membership.memberId === id ? { ...membership, memberName: updatedAccount.displayName } : membership
    ),
    rooms: db.rooms.map((room) =>
      room.proId === id ? { ...room, proName: updatedAccount.displayName } : room
    )
  });

  return updatedAccount;
}

export async function listLocalAccounts() {
  const db = await readLocalPrototypeDb();
  return db.accounts;
}

export async function deleteLocalAccounts(usernames: string[]) {
  const usernameSet = new Set(usernames.map((username) => username.trim()));
  const db = await readLocalPrototypeDb();
  const beforeCount = db.accounts.length;
  const accounts = db.accounts.filter((account) => !usernameSet.has(account.username) && !usernameSet.has(account.loginId ?? ""));

  await writeLocalPrototypeDb({
    ...db,
    accounts
  });

  return {
    deletedCount: beforeCount - accounts.length,
    remainingCount: accounts.length
  };
}

export async function findLocalDirectory(role: "member" | "pro", query = ""): Promise<DirectoryPerson[]> {
  const db = await readLocalPrototypeDb();
  const normalizedQuery = query.trim().toLowerCase();

  return db.accounts
    .filter((account) => account.role === role)
    .map((account, index): DirectoryPerson => {
      const meta =
        role === "pro"
          ? [account.organization, account.bio || "프로 레슨", "초대 가능"].filter(Boolean).join(" · ")
          : ["회원", account.golfExperience, account.mainGoal, account.phone, "신청 가능"].filter(Boolean).join(" · ");

      return {
        id: `directory_${account.id}`,
        userId: account.id,
        name: account.displayName,
        profileImageUrl: account.profileImageUrl || resolveProfileImageForAccount(account, index),
        meta,
        badge: role === "pro" ? "레슨 가능" : "신청 가능"
      };
    })
    .filter((person) => {
      if (!normalizedQuery) {
        return true;
      }

      return `${person.name} ${person.meta} ${person.badge}`.toLowerCase().includes(normalizedQuery);
    })
    .slice(0, 20);
}

export async function createLocalRoom({
  inviteCode,
  name,
  proId,
  proName,
  purpose,
  roomId
}: {
  inviteCode: string;
  name: string;
  proId: string;
  proName: string;
  purpose: string;
  roomId?: string;
}) {
  const db = await readLocalPrototypeDb();
  const normalizedInviteCode = inviteCode.trim().toUpperCase();
  const duplicatedInvite = db.rooms.some((room) => room.inviteCode.toUpperCase() === normalizedInviteCode);

  if (duplicatedInvite) {
    return {
      ok: false as const,
      message: "이미 사용 중인 초대코드입니다."
    };
  }

  const room: PrototypeRoom = {
    id: roomId || `room_local_${Date.now()}`,
    inviteCode: normalizedInviteCode,
    name,
    proId,
    proName,
    purpose,
    createdAtLabel: "로컬 저장"
  };

  await writeLocalPrototypeDb({
    ...db,
    rooms: [room, ...db.rooms]
  });

  return {
    ok: true as const,
    room
  };
}

export async function getLocalRoomsForPro(proId?: string) {
  const db = await readLocalPrototypeDb();
  return db.rooms.filter((room) => !proId || room.proId === proId);
}

export async function joinLocalRoomByCode({
  code,
  memberId,
  memberName
}: {
  code: string;
  memberId: string;
  memberName: string;
}) {
  const db = await readLocalPrototypeDb();
  const normalizedCode = code.trim().toUpperCase();
  const room = db.rooms.find((item) => item.inviteCode.toUpperCase() === normalizedCode);

  if (!room) {
    return {
      ok: false as const,
      message: "일치하는 초대코드가 없습니다."
    };
  }

  const existing = db.roomMemberships.find((membership) => membership.roomId === room.id && membership.memberId === memberId);
  if (existing) {
    return {
      ok: false as const,
      message: "이미 가입한 프로방입니다."
    };
  }

  const membership: RoomMembership = {
    id: `membership_local_${Date.now()}`,
    roomId: room.id,
    memberId,
    memberName,
    joinedAtLabel: "초대코드 가입"
  };

  await writeLocalPrototypeDb({
    ...db,
    roomMemberships: [membership, ...db.roomMemberships]
  });

  return {
    ok: true as const,
    membership,
    room
  };
}

export async function getLocalRoomMemberships({ memberId, proId }: { memberId?: string; proId?: string }) {
  const db = await readLocalPrototypeDb();
  const proRoomIds = new Set(db.rooms.filter((room) => !proId || room.proId === proId).map((room) => room.id));
  const memberships = db.roomMemberships.filter((membership) =>
    memberId ? membership.memberId === memberId : proRoomIds.has(membership.roomId)
  );
  const roomIds = new Set(memberships.map((membership) => membership.roomId));
  const rooms = db.rooms.filter((room) => roomIds.has(room.id));

  return {
    memberships,
    rooms
  };
}

export async function createLocalMessage(message: Omit<PrototypeMessage, "id" | "createdAt" | "status">) {
  const db = await readLocalPrototypeDb();
  const nextMessage: PrototypeMessage = {
    ...message,
    id: `msg_local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    status: "active"
  };

  await writeLocalPrototypeDb({
    ...db,
    messages: [nextMessage, ...db.messages]
  });

  return nextMessage;
}

export async function getLocalMessages(userId: string) {
  const db = await readLocalPrototypeDb();
  return db.messages.filter((message) => message.senderId === userId || message.receiverId === userId);
}

export async function createLocalJoinRequest({
  memberId,
  memberName,
  message,
  proId,
  proName,
  requestedRoomId
}: {
  memberId: string;
  memberName: string;
  message: string;
  proId: string;
  proName: string;
  requestedRoomId?: string;
}) {
  const db = await readLocalPrototypeDb();
  const createdAt = new Date().toISOString();
  const request: LocalJoinRequest = {
    id: `join_req_local_${Date.now()}`,
    memberId,
    memberName,
    message,
    proId,
    proName,
    requestedRoomId,
    status: "pending",
    createdAt
  };
  const requestMessage: PrototypeMessage = {
    id: `msg_local_${Date.now()}`,
    senderId: memberId,
    senderName: memberName,
    receiverId: proId,
    receiverName: proName,
    messageType: "request",
    content: message,
    relatedId: request.id,
    createdAt,
    status: "active"
  };

  await writeLocalPrototypeDb({
    ...db,
    joinRequests: [request, ...db.joinRequests],
    messages: [requestMessage, ...db.messages]
  });

  return request;
}

export async function approveLocalJoinRequest({
  memberId,
  memberName,
  proId,
  proName,
  relatedId,
  roomId,
  roomName
}: {
  memberId: string;
  memberName: string;
  proId: string;
  proName: string;
  relatedId?: string;
  roomId: string;
  roomName: string;
}) {
  const db = await readLocalPrototypeDb();
  const membership: RoomMembership = {
    id: `membership_local_${Date.now()}`,
    roomId,
    memberId,
    memberName,
    joinedAtLabel: "신청 승인"
  };
  const systemMessage: PrototypeMessage = {
    id: `msg_local_${Date.now()}`,
    senderId: proId,
    senderName: proName,
    receiverId: memberId,
    receiverName: memberName,
    roomId,
    messageType: "system",
    content: `${proName}님이 ${memberName}님을 ${roomName}에 배정했습니다.`,
    relatedId,
    createdAt: new Date().toISOString(),
    status: "active"
  };

  await writeLocalPrototypeDb({
    ...db,
    joinRequests: db.joinRequests.map((request) =>
      request.id === relatedId ? { ...request, status: "approved" } : request
    ),
    messages: [systemMessage, ...db.messages],
    roomMemberships: [membership, ...db.roomMemberships]
  });

  return membership;
}

export async function createLocalRoomInvitation({
  memberId,
  memberName,
  message,
  proId,
  proName,
  roomId,
  roomName
}: {
  memberId: string;
  memberName: string;
  message: string;
  proId: string;
  proName: string;
  roomId: string;
  roomName: string;
}) {
  const db = await readLocalPrototypeDb();
  const createdAt = new Date().toISOString();
  const invitation: LocalRoomInvitation = {
    id: `room_invitation_local_${Date.now()}`,
    memberId,
    memberName,
    message,
    proId,
    proName,
    roomId,
    roomName,
    status: "pending",
    createdAt
  };
  const invitationMessage: PrototypeMessage = {
    id: `msg_local_${Date.now()}`,
    senderId: proId,
    senderName: proName,
    receiverId: memberId,
    receiverName: memberName,
    roomId,
    messageType: "invite",
    content: message,
    relatedId: invitation.id,
    createdAt,
    status: "active"
  };

  await writeLocalPrototypeDb({
    ...db,
    messages: [invitationMessage, ...db.messages],
    roomInvitations: [invitation, ...db.roomInvitations]
  });

  return invitation;
}

export async function acceptLocalRoomInvitation({
  memberId,
  memberName,
  proId,
  proName,
  relatedId,
  roomId,
  roomName
}: {
  memberId: string;
  memberName: string;
  proId: string;
  proName: string;
  relatedId?: string;
  roomId: string;
  roomName: string;
}) {
  const db = await readLocalPrototypeDb();
  const room = db.rooms.find((item) => item.id === roomId) ?? {
    id: roomId,
    name: roomName,
    purpose: "초대로 연결된 레슨방",
    inviteCode: "",
    proId,
    proName,
    createdAtLabel: "로컬 저장"
  };
  const existing = db.roomMemberships.find((membership) => membership.roomId === roomId && membership.memberId === memberId);
  const membership: RoomMembership =
    existing ??
    {
      id: `membership_local_${Date.now()}`,
      roomId,
      memberId,
      memberName,
      joinedAtLabel: "초대 수락"
    };
  const systemMessage: PrototypeMessage = {
    id: `msg_local_${Date.now()}`,
    senderId: memberId,
    senderName: memberName,
    receiverId: proId,
    receiverName: proName,
    roomId,
    messageType: "system",
    content: `${memberName}님이 ${roomName} 초대를 수락했습니다.`,
    relatedId,
    createdAt: new Date().toISOString(),
    status: "active"
  };

  await writeLocalPrototypeDb({
    ...db,
    messages: [systemMessage, ...db.messages],
    roomInvitations: db.roomInvitations.map((invitation) =>
      invitation.id === relatedId ? { ...invitation, status: "accepted" } : invitation
    ),
    roomMemberships: existing ? db.roomMemberships : [membership, ...db.roomMemberships],
    rooms: db.rooms.some((item) => item.id === room.id) ? db.rooms : [room, ...db.rooms]
  });

  return {
    membership,
    room
  };
}

export async function createLocalRecord({
  bodyAngle,
  cameraAngle,
  media,
  mediaUrl,
  memberId,
  memberName,
  memo,
  meta,
  recordId,
  recordType,
  roomId,
  roomName,
  thumbnailUrl,
  title
}: {
  bodyAngle?: string;
  cameraAngle?: string;
  media: "video" | "image";
  mediaUrl?: string;
  memberId: string;
  memberName?: string;
  memo?: string;
  meta?: string;
  recordId?: string;
  recordType?: string;
  roomId?: string;
  roomName?: string;
  thumbnailUrl?: string;
  title?: string;
}) {
  const db = await readLocalPrototypeDb();
  const shared = Boolean(roomId);
  const record: RecordItem = {
    id: recordId || `rec_local_${Date.now()}`,
    memberId,
    memberName,
    title: title || "업로드 기록",
    meta: meta || `${recordType || "swing"} · ${bodyAngle || cameraAngle || "자세 각도 미지정"} · 로컬 저장`,
    media,
    mediaUrl,
    badge: shared ? "개인 기록 + 프로방 공유" : "개인 기록",
    thumbnailUrl,
    recordType: recordType || "swing",
    cameraAngle,
    bodyAngle: bodyAngle || cameraAngle,
    memo,
    roomId,
    roomName,
    sharedAt: shared ? new Date().toISOString() : undefined
  };

  await writeLocalPrototypeDb({
    ...db,
    records: [record, ...db.records.filter((item) => item.id !== record.id)]
  });

  return {
    record,
    shared
  };
}

export async function getLocalRecords({ memberId, roomIds }: { memberId?: string; roomIds?: string[] }) {
  const db = await readLocalPrototypeDb();
  const roomIdSet = new Set(roomIds?.filter(Boolean));

  return db.records.filter((record) => {
    if (memberId && record.memberId === memberId) {
      return true;
    }

    return Boolean(roomIdSet.size > 0 && record.roomId && roomIdSet.has(record.roomId));
  });
}

function isPrototypeTestRecord(record: RecordItem) {
  return (
    record.id.startsWith("rec_share_test_") ||
    record.id.startsWith("rec_pose_test_") ||
    record.id.startsWith("rec_local_") ||
    record.title.includes("방금 올린") ||
    record.title.includes("공유 테스트")
  );
}

function isPrototypeTestFeedback(feedback: FeedbackItem, testRecordIds: Set<string>) {
  return (
    testRecordIds.has(feedback.recordId) ||
    feedback.id.startsWith("fb_pose_test_") ||
    feedback.id.startsWith("fb_preview_") ||
    feedback.id.startsWith("fb_local_")
  );
}

export async function clearLocalPrototypeTestData() {
  const db = await readLocalPrototypeDb();
  const testRecordIds = new Set(db.records.filter(isPrototypeTestRecord).map((record) => record.id));
  const nextRecords = db.records.filter((record) => !testRecordIds.has(record.id));
  const nextFeedback = db.feedback.filter((feedback) => !isPrototypeTestFeedback(feedback, testRecordIds));

  await writeLocalPrototypeDb({
    ...db,
    feedback: nextFeedback,
    records: nextRecords
  });

  return {
    removedFeedbackCount: db.feedback.length - nextFeedback.length,
    removedRecordCount: db.records.length - nextRecords.length
  };
}

export async function normalizeLocalPrototypeRealTestData() {
  const db = await readLocalPrototypeDb();
  const memberId = "acc_local_1779185204928_thsmog";
  const proId = "acc_local_1779185204984_ksiooi";
  const roomId = "room_1779185871312";
  const staleRoomIds = new Set(["room_test_dm_1779411382569"]);
  const memberName = "Niel 회원";
  const proName = "Niel 프로";
  const roomName = "Niel 드라이버 교정방";

  await writeLocalPrototypeDb({
    ...db,
    accounts: db.accounts.map((account) => {
      if (account.id === memberId) {
        return {
          ...account,
          displayName: memberName,
          golfExperience: account.golfExperience || "6개월",
          mainGoal: account.mainGoal || "드라이버 슬라이스 교정",
          profileImageUrl: account.profileImageUrl || sampleProfileImages.liam
        };
      }

      if (account.id === proId) {
        return {
          ...account,
          displayName: proName,
          organization: account.organization || "Niel Farm",
          profileImageUrl: account.profileImageUrl || sampleProfileImages.kenji
        };
      }

      return account;
    }),
    feedback: db.feedback.map((feedback) => (feedback.proName.includes("Niel") || feedback.proName.includes("김프로") ? { ...feedback, proName } : feedback)),
    messages: db.messages
      .filter((message) => !message.roomId || !staleRoomIds.has(message.roomId))
      .map((message) => ({
        ...message,
        receiverName: message.receiverId === memberId ? memberName : message.receiverId === proId ? proName : message.receiverName,
        senderName: message.senderId === memberId ? memberName : message.senderId === proId ? proName : message.senderName
      })),
    records: db.records
      .filter((record) => !record.roomId || !staleRoomIds.has(record.roomId))
      .map((record) => ({
        ...record,
        memberName: record.memberId === memberId ? memberName : record.memberName,
        roomName: record.roomId === roomId ? roomName : record.roomName,
        title: record.id === "rec_test_32834" ? "Niel 테스트 스윙 영상" : record.title,
        meta: record.id === "rec_test_32834" ? "스윙 · 정면 · 5초 · 로컬 저장" : record.meta,
        memo: record.id === "rec_test_32834" ? "실제 계정 테스트 기록" : record.memo
      })),
    roomInvitations: db.roomInvitations.map((invitation) => ({
      ...invitation,
      memberName: invitation.memberId === memberId ? memberName : invitation.memberName,
      proName: invitation.proId === proId ? proName : invitation.proName,
      roomName: invitation.roomId === roomId ? roomName : invitation.roomName
    })),
    roomMemberships: db.roomMemberships
      .filter((membership) => !staleRoomIds.has(membership.roomId))
      .map((membership) => ({
        ...membership,
        memberName: membership.memberId === memberId ? memberName : membership.memberName
      })),
    rooms: db.rooms
      .filter((room) => !staleRoomIds.has(room.id))
      .map((room) =>
        room.id === roomId
          ? {
              ...room,
              name: roomName,
              proName,
              purpose: "실제 계정 테스트용 개인 레슨 관리"
            }
          : room.proId === proId
            ? { ...room, proName }
          : room
      ),
    trainingAssignments: db.trainingAssignments.map((assignment) =>
      assignment.id === "trn_test_21515"
        ? {
            ...assignment,
            title: "어프로치 거리감 50개",
            meta: "프로 추천 · 로컬 저장",
            roomId,
            goal: "30m 거리감과 방향성을 안정적으로 맞춥니다.",
            recordGuide: "성공 횟수, 체감 난이도, 선택 이미지/영상을 기록",
            dueLabel: "이번 주",
            status: "완료"
          }
        : assignment
    ),
    trainingResults: db.trainingResults.map((result) =>
      result.id === "trr_test_64298"
        ? {
            ...result,
            title: "어프로치 거리감 50개",
            memberName,
            count: "50개",
            difficulty: "보통",
            memo: "후반 10개에서 거리감이 좋아졌습니다.",
            attachmentLabel: "이미지 1장",
            proComment: "좋습니다. 다음에는 방향성을 함께 확인해보겠습니다."
          }
        : result
    )
  });

  return {
    memberId,
    memberName,
    proId,
    proName,
    roomId,
    roomName
  };
}

export async function createLocalFeedback({
  annotations,
  feedbackId,
  focusComment,
  goalComment,
  hiddenAngleMarkIds,
  poseAnalysis,
  poseAnglesVisible,
  poseEngine,
  proName,
  recordId,
  snapshotUrl,
  stickerComment
}: {
  annotations?: FeedbackItem["annotations"];
  feedbackId?: string;
  focusComment: string;
  goalComment: string;
  hiddenAngleMarkIds?: string[];
  poseAnalysis?: FeedbackItem["poseAnalysis"];
  poseAnglesVisible?: boolean;
  poseEngine?: string;
  proName: string;
  recordId: string;
  snapshotUrl?: string;
  stickerComment?: string;
}) {
  const db = await readLocalPrototypeDb();
  const feedback: FeedbackItem = {
    id: feedbackId || `fb_local_${Date.now()}`,
    recordId,
    proName,
    goalComment,
    focusComment,
    stickerComment: stickerComment ?? "",
    snapshotUrl,
    poseAnglesVisible,
    hiddenAngleMarkIds,
    annotations,
    poseAnalysis,
    poseEngine,
    createdAtLabel: "로컬 저장"
  };

  await writeLocalPrototypeDb({
    ...db,
    feedback: [feedback, ...db.feedback.filter((item) => item.recordId !== recordId)],
    records: db.records.map((record) => (record.id === recordId ? { ...record, badge: "피드백 완료" } : record))
  });

  return feedback;
}

export async function getLocalFeedback({
  memberId,
  proId,
  recordId
}: {
  memberId?: string;
  proId?: string;
  recordId?: string;
}) {
  const db = await readLocalPrototypeDb();
  const recordsById = new Map(db.records.map((record) => [record.id, record]));
  const proRoomIds = new Set(db.rooms.filter((room) => room.proId === proId).map((room) => room.id));

  return db.feedback.filter((feedback) => {
    if (recordId && feedback.recordId === recordId) {
      return true;
    }

    const record = recordsById.get(feedback.recordId);
    if (memberId && record?.memberId === memberId) {
      return true;
    }

    return Boolean(proId && record?.roomId && proRoomIds.has(record.roomId));
  });
}

export async function createLocalTrainingAssignment({
  assignmentId,
  assignmentScope,
  dueDate,
  goal,
  memberId,
  proId,
  recordGuide,
  requireMedia,
  roomId,
  title
}: {
  assignmentId?: string;
  assignmentScope?: "room_common" | "personal" | "self";
  dueDate?: string;
  goal?: string;
  memberId?: string;
  proId: string;
  recordGuide?: string;
  requireMedia?: boolean;
  roomId?: string;
  title: string;
}) {
  const db = await readLocalPrototypeDb();
  const scope = assignmentScope ?? "personal";
  const assignment: TrainingAssignment = {
    id: assignmentId || `trn_local_${Date.now()}`,
    assignmentType: scope,
    memberId: scope === "room_common" ? undefined : memberId,
    title,
    meta: scope === "room_common" ? "방 공통 드릴 · 로컬 저장" : "프로 추천 · 로컬 저장",
    roomId,
    status: "진행 중",
    goal,
    recordGuide,
    dueLabel: dueDate,
    requireMedia,
    createdAtLabel: "로컬 저장"
  };

  await writeLocalPrototypeDb({
    ...db,
    trainingAssignments: [assignment, ...db.trainingAssignments.filter((item) => item.id !== assignment.id)]
  });

  return assignment;
}

export async function getLocalTrainingAssignments({
  memberId,
  proId,
  roomIds
}: {
  memberId?: string;
  proId?: string;
  roomIds?: string[];
}) {
  const db = await readLocalPrototypeDb();
  const roomIdSet = new Set(roomIds?.filter(Boolean));
  const proRoomIds = new Set(db.rooms.filter((room) => room.proId === proId).map((room) => room.id));

  return db.trainingAssignments.filter((assignment) => {
    if (proId && assignment.roomId && proRoomIds.has(assignment.roomId)) {
      return true;
    }

    if (memberId && assignment.memberId === memberId) {
      return true;
    }

    return Boolean(memberId && assignment.assignmentType === "room_common" && assignment.roomId && roomIdSet.has(assignment.roomId));
  });
}

export async function createLocalTrainingResult({
  actualReps,
  assignmentId,
  attachmentLabel,
  difficulty,
  memberName,
  memberNote,
  resultId,
  roomId,
  title,
  userId,
  visibility
}: {
  actualReps?: string;
  assignmentId: string;
  attachmentLabel?: string;
  difficulty?: string;
  memberName: string;
  memberNote?: string;
  resultId?: string;
  roomId?: string;
  title: string;
  userId: string;
  visibility?: string;
}) {
  const db = await readLocalPrototypeDb();
  const result: TrainingResult = {
    id: resultId || `trr_local_${Date.now()}`,
    assignmentId,
    title,
    memberName,
    count: actualReps || "기록 없음",
    difficulty: difficulty || "보통",
    memo: memberNote || "",
    shareToRoom: visibility !== "private",
    attachmentLabel,
    createdAtLabel: "로컬 저장",
    status: "제출됨"
  };

  await writeLocalPrototypeDb({
    ...db,
    trainingAssignments: db.trainingAssignments.map((assignment) =>
      assignment.id === assignmentId ? { ...assignment, status: "결과 제출" } : assignment
    ),
    trainingResults: [result, ...db.trainingResults.filter((item) => item.assignmentId !== assignmentId)]
  });

  return result;
}

export async function getLocalTrainingResults({ userId, roomIds }: { userId?: string; roomIds?: string[] }) {
  const db = await readLocalPrototypeDb();
  const roomIdSet = new Set(roomIds?.filter(Boolean));
  const assignmentById = new Map(db.trainingAssignments.map((assignment) => [assignment.id, assignment]));

  return db.trainingResults.filter((result) => {
    const assignment = assignmentById.get(result.assignmentId);
    if (userId && assignment?.memberId === userId) {
      return true;
    }

    return Boolean(roomIdSet.size > 0 && assignment?.roomId && roomIdSet.has(assignment.roomId));
  });
}

export async function reviewLocalTrainingResult({
  proComment,
  proId,
  resultId
}: {
  proComment: string;
  proId: string;
  resultId: string;
}) {
  const db = await readLocalPrototypeDb();
  const targetResult = db.trainingResults.find((result) => result.id === resultId);
  const assignmentId = targetResult?.assignmentId;
  const message: PrototypeMessage = {
    id: `msg_local_${Date.now()}`,
    senderId: proId,
    senderName: "프로",
    receiverId: "",
    receiverName: "",
    messageType: "system",
    content: `훈련 결과 ${resultId} 확인 완료: ${proComment}`,
    relatedId: resultId,
    createdAt: new Date().toISOString(),
    status: "active"
  };

  await writeLocalPrototypeDb({
    ...db,
    messages: [message, ...db.messages],
    trainingAssignments: db.trainingAssignments.map((assignment) =>
      assignment.id === assignmentId ? { ...assignment, status: "완료" } : assignment
    ),
    trainingResults: db.trainingResults.map((result) =>
      result.id === resultId ? { ...result, proComment, status: "확인 완료" } : result
    )
  });

  return {
    ok: true
  };
}
