"use client";

import { recentRecords } from "@/lib/mock/member";
import { sharedRecordForReview } from "@/lib/mock/pro";
import { resolveProfileImageForAccount, sampleProfileImages } from "@/lib/mock/profileImages";
import { useEffect, useMemo, useState } from "react";
import type {
  AccountRole,
  FeedbackItem,
  PrototypeAccount,
  PrototypeRoom,
  RecordItem,
  RoomMembership,
  TrainingAssignment,
  TrainingResult
} from "./types";

type PrototypeState = {
  accounts: PrototypeAccount[];
  feedback: FeedbackItem[];
  records: RecordItem[];
  roomMemberships: RoomMembership[];
  rooms: PrototypeRoom[];
  trainingAssignments: TrainingAssignment[];
  trainingResults: TrainingResult[];
  activeRecordId?: string;
  activeTrainingId?: string;
};

const storageKey = "golfalign.prototype.v1";

const defaultAccounts: PrototypeAccount[] = [
  {
    id: "acc_member_demo",
    username: "member_seed_profile",
    authProvider: "local",
    emailVerified: false,
    role: "member",
    displayName: "박회원",
    phone: "010-0000-0001",
    profileImageUrl: sampleProfileImages.miSook
  },
  {
    id: "acc_pro_demo",
    username: "pro_seed_profile",
    authProvider: "local",
    emailVerified: false,
    role: "pro",
    displayName: "김프로",
    organization: "드라이버 교정반",
    phone: "010-0000-0002",
    profileImageUrl: sampleProfileImages.david
  }
];

function normalizeAccounts(accounts: PrototypeAccount[]) {
  const seedIds = new Set(defaultAccounts.map((account) => account.id));

  return [
    ...defaultAccounts,
    ...accounts.filter((account) => account.role !== "admin" && !seedIds.has(account.id))
  ];
}

const defaultRecords: RecordItem[] = [
  {
    ...recentRecords[0],
    memberId: "acc_member_demo",
    memberName: "박회원"
  },
  {
    ...recentRecords[1],
    memberId: "acc_member_demo",
    memberName: "박회원",
    roomId: "room_demo_driver",
    roomName: "드라이버 교정방"
  },
  {
    ...sharedRecordForReview,
    memberId: "acc_member_demo",
    memberName: "박회원",
    roomId: "room_demo_driver",
    roomName: "드라이버 교정방"
  },
  {
    id: "rec_pose_real_video_mvp",
    memberId: "acc_member_demo",
    memberName: "박회원",
    title: "실제 영상 본 분석 테스트",
    meta: "스윙 · 실제 영상 · 본 분석 대기 · 드라이버 교정방",
    media: "video",
    badge: "확인 필요",
    thumbnailUrl:
      "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22720%22%20height%3D%22405%22%20viewBox%3D%220%200%20720%20405%22%3E%3Crect%20width%3D%22720%22%20height%3D%22405%22%20fill%3D%22%231f5f4a%22%2F%3E%3Ccircle%20cx%3D%22584%22%20cy%3D%2276%22%20r%3D%2246%22%20fill%3D%22%23e2a51f%22%2F%3E%3Cpath%20d%3D%22M78%20314%20C184%20250%20255%20216%20360%20192%20C468%20168%20565%20176%20644%20210%22%20fill%3D%22none%22%20stroke%3D%22%23fff4e0%22%20stroke-width%3D%2214%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M238%20294%20L438%20144%22%20stroke%3D%22%23ffd15d%22%20stroke-width%3D%2212%22%20stroke-linecap%3D%22round%22%2F%3E%3Ctext%20x%3D%2248%22%20y%3D%2274%22%20fill%3D%22%23fff4e0%22%20font-family%3D%22Arial%22%20font-size%3D%2234%22%20font-weight%3D%22700%22%3EPose%20test%3C%2Ftext%3E%3Ctext%20x%3D%2248%22%20y%3D%22116%22%20fill%3D%22%23ffd15d%22%20font-family%3D%22Arial%22%20font-size%3D%2222%22%20font-weight%3D%22700%22%3EGolfAlign%20real%20video%3C%2Ftext%3E%3C%2Fsvg%3E",
    mediaUrl: "/test-assets/test-swing-short.mp4",
    recordType: "swing",
    cameraAngle: "side",
    bodyAngle: "swing_pose",
    memo: "MediaPipe 본 분석 테스트용 실제 영상 기록",
    roomId: "room_demo_driver",
    roomName: "드라이버 교정방",
    sharedAt: "2026-06-13T00:00:00.000Z"
  }
];

const defaultFeedback: FeedbackItem[] = [
  {
    id: "fb_mock_001",
    recordId: "rec_mock_001",
    proName: "김프로",
    goalComment: "백스윙 균형을 먼저 안정시킵니다.",
    focusComment: "왼쪽 어깨가 빨리 열리지 않게 피니시를 3초 유지해보세요.",
    stickerComment: "어깨 열림",
    createdAtLabel: "방금 전"
  }
];

function mergeRecords(savedRecords: RecordItem[] = []) {
  const savedIds = new Set(savedRecords.map((record) => record.id));
  return [
    ...savedRecords,
    ...defaultRecords.filter((record) => !savedIds.has(record.id))
  ];
}

function mergeFeedback(savedFeedback: FeedbackItem[] = []) {
  const savedKeys = new Set(savedFeedback.flatMap((feedback) => [feedback.id, feedback.recordId]));
  return [
    ...savedFeedback,
    ...defaultFeedback.filter((feedback) => !savedKeys.has(feedback.id) && !savedKeys.has(feedback.recordId))
  ];
}

const initialState: PrototypeState = {
  accounts: defaultAccounts,
  feedback: defaultFeedback,
  records: defaultRecords,
  roomMemberships: [
    {
      id: "membership_demo",
      roomId: "room_demo_driver",
      memberId: "acc_member_demo",
      memberName: "박회원",
      joinedAtLabel: "기본 가입"
    }
  ],
  rooms: [
    {
      id: "room_demo_driver",
      name: "드라이버 교정반",
      purpose: "초급/중급 스윙 교정",
      inviteCode: "GA-2026",
      proId: "acc_pro_demo",
      proName: "김프로",
      createdAtLabel: "기본 방"
    }
  ],
  trainingAssignments: [],
  trainingResults: []
};

export function usePrototypeStore() {
  const [state, setState] = useState<PrototypeState>(initialState);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<PrototypeState>;
        setState({
          accounts: normalizeAccounts(parsed.accounts ?? defaultAccounts),
          feedback: mergeFeedback(parsed.feedback ?? []),
          records: mergeRecords(parsed.records ?? []),
          roomMemberships: parsed.roomMemberships ?? initialState.roomMemberships,
          rooms: parsed.rooms ?? initialState.rooms,
          trainingAssignments: parsed.trainingAssignments ?? [],
          trainingResults: parsed.trainingResults ?? [],
          activeRecordId: parsed.activeRecordId,
          activeTrainingId: parsed.activeTrainingId
        });
      }
    } catch {
      setState(initialState);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [isLoaded, state]);

  const sharedRecords = useMemo(() => state.records.filter((record) => record.roomId), [state.records]);
  const activeTraining = useMemo(
    () => state.trainingAssignments.find((assignment) => assignment.id === state.activeTrainingId),
    [state.activeTrainingId, state.trainingAssignments]
  );
  const pendingTrainingResults = useMemo(
    () => state.trainingResults.filter((result) => result.status !== "확인 완료"),
    [state.trainingResults]
  );
  const activeRecord = useMemo(
    () => state.records.find((record) => record.id === state.activeRecordId),
    [state.activeRecordId, state.records]
  );
  const activeFeedback = useMemo(
    () => state.feedback.find((feedback) => feedback.recordId === state.activeRecordId),
    [state.activeRecordId, state.feedback]
  );
  const latestFeedback = useMemo(() => state.feedback[0], [state.feedback]);

  function getRoomsForMember(memberId?: string) {
    if (!memberId) {
      return [];
    }

    const roomIds = new Set(
      state.roomMemberships.filter((membership) => membership.memberId === memberId).map((membership) => membership.roomId)
    );
    return state.rooms.filter((room) => roomIds.has(room.id));
  }

  function getRoomsForPro(proId?: string) {
    if (!proId) {
      return [];
    }

    return state.rooms.filter((room) => room.proId === proId);
  }

  function getMembersForPro(proId?: string) {
    const proRoomIds = new Set(getRoomsForPro(proId).map((room) => room.id));
    return state.roomMemberships.filter((membership) => proRoomIds.has(membership.roomId));
  }

  function findAccount(username: string, password: string) {
    const normalizedUsername = username.trim();
    return state.accounts.find(
      (account) =>
        (account.loginId === normalizedUsername || account.username === normalizedUsername) &&
        account.password === password
    );
  }

  function createAccount({
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
    const normalizedDisplayName = displayName.trim();

    if (!normalizedUsername || !password) {
      return {
        ok: false as const,
        message: "아이디와 비밀번호를 입력해 주세요."
      };
    }

    if (!normalizedDisplayName) {
      return {
        ok: false as const,
        message: "이름 또는 표시 이름을 입력해 주세요."
      };
    }

    if (password.length < 6) {
      return {
        ok: false as const,
        message: "비밀번호는 6자 이상으로 만들어 주세요."
      };
    }

    if (role === "admin") {
      return {
        ok: false as const,
        message: "관리자 계정은 회원가입에서 만들 수 없습니다."
      };
    }

    if (state.accounts.some((account) => account.username === normalizedUsername)) {
      return {
        ok: false as const,
        message: "이미 사용 중인 아이디입니다."
      };
    }

    const nextAccount: PrototypeAccount = {
      id: `acc_local_${Date.now()}`,
      username: normalizedUsername,
      loginId: normalizedUsername,
      password,
      authProvider: "local",
      emailVerified: false,
      termsAgreedAt: new Date().toISOString(),
      role,
      displayName: normalizedDisplayName,
      organization: organization?.trim(),
      phone: phone?.trim(),
      profileImageUrl: resolveProfileImageForAccount({ id: normalizedUsername, role }, state.accounts.length)
    };

    setState((current) => ({
      ...current,
      accounts: [nextAccount, ...current.accounts]
    }));

    return {
      ok: true as const,
      account: nextAccount
    };
  }

  function updateAccountProfile(profile: Partial<PrototypeAccount> & { id: string }) {
    let updatedAccount: PrototypeAccount | undefined;

    setState((current) => {
      const accounts = current.accounts.map((account) => {
        if (account.id !== profile.id) {
          return account;
        }

        updatedAccount = {
          ...account,
          ...profile,
          displayName: profile.displayName?.trim() || account.displayName,
          phone: profile.phone?.trim() || account.phone,
          organization: profile.organization?.trim() || account.organization,
          profileImageUrl: profile.profileImageUrl?.trim() || account.profileImageUrl,
          golfExperience: profile.golfExperience?.trim() || account.golfExperience,
          mainGoal: profile.mainGoal?.trim() || account.mainGoal,
          bio: profile.bio?.trim() || account.bio
        };
        return updatedAccount;
      });

      return {
        ...current,
        accounts,
        roomMemberships: current.roomMemberships.map((membership) =>
          membership.memberId === profile.id && updatedAccount
            ? { ...membership, memberName: updatedAccount.displayName }
            : membership
        ),
        rooms: current.rooms.map((room) =>
          room.proId === profile.id && updatedAccount ? { ...room, proName: updatedAccount.displayName } : room
        )
      };
    });

    return updatedAccount;
  }

  function addRecord(record: RecordItem) {
    setState((current) => ({
      ...current,
      activeRecordId: record.id,
      records: [record, ...current.records]
    }));
  }

  function upsertRecord(record: RecordItem) {
    setState((current) => {
      const exists = current.records.some((item) => item.id === record.id);
      return {
        ...current,
        records: exists ? current.records.map((item) => (item.id === record.id ? record : item)) : [record, ...current.records]
      };
    });
  }

  function createRoom({
    name,
    proId,
    proName,
    purpose
  }: {
    name: string;
    proId: string;
    proName: string;
    purpose: string;
  }) {
    const normalizedName = name.trim();
    if (!normalizedName) {
      return {
        ok: false as const,
        message: "방 이름을 입력해 주세요."
      };
    }

    const inviteCode = `GA-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const nextRoom: PrototypeRoom = {
      id: `room_local_${Date.now()}`,
      name: normalizedName,
      purpose: purpose.trim() || "개인 레슨 관리",
      inviteCode,
      proId,
      proName,
      createdAtLabel: "방금 생성"
    };

    setState((current) => ({
      ...current,
      rooms: [nextRoom, ...current.rooms]
    }));

    return {
      ok: true as const,
      room: nextRoom
    };
  }

  function upsertRoom(room: PrototypeRoom) {
    setState((current) => {
      const exists = current.rooms.some((item) => item.id === room.id);
      return {
        ...current,
        rooms: exists ? current.rooms.map((item) => (item.id === room.id ? room : item)) : [room, ...current.rooms]
      };
    });
  }

  function upsertRoomMembership(membership: RoomMembership) {
    setState((current) => {
      const exists = current.roomMemberships.some(
        (item) => item.roomId === membership.roomId && item.memberId === membership.memberId
      );
      return {
        ...current,
        roomMemberships: exists
          ? current.roomMemberships.map((item) =>
              item.roomId === membership.roomId && item.memberId === membership.memberId ? membership : item
            )
          : [membership, ...current.roomMemberships]
      };
    });
  }

  function joinRoomByCode({
    code,
    memberId,
    memberName
  }: {
    code: string;
    memberId: string;
    memberName: string;
  }) {
    const normalizedCode = code.trim().toUpperCase();
    const room = state.rooms.find((item) => item.inviteCode.toUpperCase() === normalizedCode);
    if (!room) {
      return {
        ok: false as const,
        message: "일치하는 초대 코드가 없습니다."
      };
    }

    if (state.roomMemberships.some((membership) => membership.roomId === room.id && membership.memberId === memberId)) {
      return {
        ok: false as const,
        message: "이미 가입한 프로방입니다."
      };
    }

    const nextMembership: RoomMembership = {
      id: `membership_local_${Date.now()}`,
      roomId: room.id,
      memberId,
      memberName,
      joinedAtLabel: "방금 가입"
    };

    setState((current) => ({
      ...current,
      roomMemberships: [nextMembership, ...current.roomMemberships]
    }));

    return {
      ok: true as const,
      room
    };
  }

  function saveFeedback(feedback: Omit<FeedbackItem, "id" | "createdAtLabel">) {
    const nextFeedback: FeedbackItem = {
      ...feedback,
      id: `fb_local_${Date.now()}`,
      createdAtLabel: "방금 저장"
    };

    setState((current) => ({
      ...current,
      feedback: [
        nextFeedback,
        ...current.feedback.filter((item) => item.recordId !== feedback.recordId)
      ],
      records: current.records.map((record) =>
        record.id === feedback.recordId
          ? {
              ...record,
              badge: "피드백 완료"
            }
          : record
      )
    }));

    return nextFeedback;
  }

  function upsertFeedback(feedback: FeedbackItem) {
    setState((current) => {
      const exists = current.feedback.some((item) => item.id === feedback.id);
      return {
        ...current,
        feedback: exists
          ? current.feedback.map((item) => (item.id === feedback.id ? feedback : item))
          : [feedback, ...current.feedback],
        records: current.records.map((record) =>
          record.id === feedback.recordId
            ? {
                ...record,
                badge: "피드백 완료"
              }
            : record
        )
      };
    });
  }

  function selectRecord(recordId: string) {
    setState((current) => ({
      ...current,
      activeRecordId: recordId
    }));
  }

  function addTrainingAssignment(assignment: Omit<TrainingAssignment, "id" | "createdAtLabel" | "status">) {
    const nextAssignment: TrainingAssignment = {
      ...assignment,
      id: `trn_local_${Date.now()}`,
      createdAtLabel: "방금 저장",
      status: assignment.dueLabel ?? "진행 중"
    };

    setState((current) => ({
      ...current,
      activeTrainingId: nextAssignment.id,
      trainingAssignments: [nextAssignment, ...current.trainingAssignments]
    }));

    return nextAssignment;
  }

  function upsertTrainingAssignment(assignment: TrainingAssignment) {
    setState((current) => {
      const exists = current.trainingAssignments.some((item) => item.id === assignment.id);
      return {
        ...current,
        trainingAssignments: exists
          ? current.trainingAssignments.map((item) => (item.id === assignment.id ? assignment : item))
          : [assignment, ...current.trainingAssignments]
      };
    });
  }

  function selectTraining(assignmentId: string) {
    setState((current) => ({
      ...current,
      activeTrainingId: assignmentId
    }));
  }

  function toggleTrainingAssignmentStatus(assignmentId: string) {
    setState((current) => ({
      ...current,
      trainingAssignments: current.trainingAssignments.map((assignment) =>
        assignment.id === assignmentId
          ? {
              ...assignment,
              status: assignment.status === "완료" ? "진행 중" : "완료"
            }
          : assignment
      )
    }));
  }

  function saveTrainingResult(result: Omit<TrainingResult, "id" | "createdAtLabel" | "status">) {
    const nextResult: TrainingResult = {
      ...result,
      id: `trr_local_${Date.now()}`,
      createdAtLabel: "방금 저장",
      status: "제출됨"
    };

    setState((current) => ({
      ...current,
      trainingAssignments: current.trainingAssignments.map((assignment) =>
        assignment.id === result.assignmentId
          ? {
              ...assignment,
              status: "결과 제출"
            }
          : assignment
      ),
      trainingResults: [
        nextResult,
        ...current.trainingResults.filter((item) => item.assignmentId !== result.assignmentId)
      ]
    }));

    return nextResult;
  }

  function upsertTrainingResult(result: TrainingResult) {
    setState((current) => {
      const exists = current.trainingResults.some((item) => item.id === result.id);
      return {
        ...current,
        trainingAssignments: current.trainingAssignments.map((assignment) =>
          assignment.id === result.assignmentId && result.status !== "확인 완료"
            ? {
                ...assignment,
                status: "결과 제출"
              }
            : assignment
        ),
        trainingResults: exists
          ? current.trainingResults.map((item) => (item.id === result.id ? result : item))
          : [result, ...current.trainingResults]
      };
    });
  }

  function saveTrainingReview(resultId: string, proComment: string) {
    setState((current) => ({
      ...current,
      trainingResults: current.trainingResults.map((result) =>
        result.id === resultId
          ? {
              ...result,
              proComment,
              status: "확인 완료"
            }
          : result
      ),
      trainingAssignments: current.trainingAssignments.map((assignment) =>
        current.trainingResults.some((result) => result.id === resultId && result.assignmentId === assignment.id)
          ? {
              ...assignment,
              status: "완료"
            }
          : assignment
      )
    }));
  }

  function clearPrototypeData() {
    setState(initialState);
    window.localStorage.removeItem(storageKey);
  }

  function clearPrototypeTestData() {
    setState((current) => {
      const testRecordIds = new Set(
        current.records
          .filter((record) =>
            record.id.startsWith("rec_share_test_") ||
            record.id.startsWith("rec_pose_test_") ||
            record.id.startsWith("rec_local_") ||
            record.title.includes("방금 올린") ||
            record.title.includes("공유 테스트")
          )
          .map((record) => record.id)
      );

      return {
        ...current,
        activeRecordId: testRecordIds.has(current.activeRecordId ?? "") ? undefined : current.activeRecordId,
        feedback: current.feedback.filter(
          (feedback) =>
            !testRecordIds.has(feedback.recordId) &&
            !feedback.id.startsWith("fb_pose_test_") &&
            !feedback.id.startsWith("fb_preview_") &&
            !feedback.id.startsWith("fb_local_")
        ),
        records: current.records.filter((record) => !testRecordIds.has(record.id))
      };
    });
  }

  return {
    accounts: state.accounts,
    activeFeedback,
    activeRecord,
    activeTraining,
    addRecord,
    addTrainingAssignment,
    clearPrototypeData,
    clearPrototypeTestData,
    createRoom,
    createAccount,
    updateAccountProfile,
    feedback: state.feedback,
    findAccount,
    getMembersForPro,
    getRoomsForMember,
    getRoomsForPro,
    isLoaded,
    joinRoomByCode,
    upsertFeedback,
    upsertRoom,
    upsertRoomMembership,
    upsertRecord,
    upsertTrainingAssignment,
    upsertTrainingResult,
    latestFeedback,
    pendingTrainingResults,
    records: state.records,
    roomMemberships: state.roomMemberships,
    rooms: state.rooms,
    saveFeedback,
    saveTrainingResult,
    saveTrainingReview,
    selectRecord,
    selectTraining,
    toggleTrainingAssignmentStatus,
    sharedRecords,
    trainingAssignments: state.trainingAssignments,
    trainingResults: state.trainingResults
  };
}
