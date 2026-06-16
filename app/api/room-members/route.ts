import { NextResponse } from "next/server";
import type { PrototypeRoom, RoomMembership } from "@/components/golfalign/types";
import { appendSheetRow, isGoogleSheetsWriteConfigured, readSheetRange } from "@/lib/google/googleSheetsServer";
import { getLocalRoomMemberships, joinLocalRoomByCode } from "@/lib/local/prototypeDbServer";

type JoinRoomRequest = {
  code?: string;
  memberId?: string;
  memberName?: string;
};

function nowIso() {
  return new Date().toISOString();
}

function mapRoomRow(row: string[], inviteCode: string): PrototypeRoom {
  return {
    id: row[0],
    proId: row[1] || row[2],
    proName: row[11] || "프로",
    name: row[3] || "레슨방",
    purpose: row[4] || "개인 레슨 관리",
    inviteCode,
    createdAtLabel: "DB 불러옴"
  };
}

function mapMembershipRow(row: string[]): RoomMembership {
  return {
    id: row[0],
    roomId: row[1],
    memberId: row[2],
    memberName: row[3] || "회원",
    joinedAtLabel: row[4] ? "DB 불러옴" : "방금 가입"
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const memberId = url.searchParams.get("memberId")?.trim();
  const proId = url.searchParams.get("proId")?.trim();

  if (!memberId && !proId) {
    return NextResponse.json({ ok: false, message: "조회할 회원 또는 프로 정보가 필요합니다." }, { status: 400 });
  }

  if (!isGoogleSheetsWriteConfigured()) {
    const result = await getLocalRoomMemberships({ memberId, proId });
    return NextResponse.json({ ok: true, mode: "local_prototype", ...result });
  }

  const [memberRows, roomRows, inviteRows] = await Promise.all([
    readSheetRange("room_members!A:H"),
    readSheetRange("lesson_rooms!A:L"),
    readSheetRange("room_invites!A:M")
  ]);

  const activeRooms = roomRows.slice(1).filter((row) => (row[10] || "active") === "active");
  const roomsById = new Map(activeRooms.map((row) => [row[0], row]));
  const inviteByRoomId = new Map(inviteRows.slice(1).map((row) => [row[1], row[3]]));
  const proRoomIds = new Set(activeRooms.filter((row) => row[1] === proId || row[2] === proId).map((row) => row[0]));

  const memberships = memberRows
    .slice(1)
    .filter((row) => (row[5] || "active") === "active")
    .filter((row) => (memberId ? row[2] === memberId : proRoomIds.has(row[1])))
    .map(mapMembershipRow);

  const roomIds = new Set(memberships.map((membership) => membership.roomId));
  const rooms = Array.from(roomIds)
    .map((roomId) => {
      const roomRow = roomsById.get(roomId);
      return roomRow ? mapRoomRow(roomRow, inviteByRoomId.get(roomId) ?? "") : undefined;
    })
    .filter((room): room is PrototypeRoom => Boolean(room));

  return NextResponse.json({ ok: true, memberships, rooms });
}

export async function POST(request: Request) {
  const body = (await request.json()) as JoinRoomRequest;
  const code = body.code?.trim().toUpperCase() ?? "";
  const memberId = body.memberId?.trim() ?? "";
  const memberName = body.memberName?.trim() ?? "회원";

  if (!code || !memberId) {
    return NextResponse.json({ ok: false, message: "초대코드와 회원 정보가 필요합니다." }, { status: 400 });
  }

  if (!isGoogleSheetsWriteConfigured()) {
    const result = await joinLocalRoomByCode({ code, memberId, memberName });
    if (!result.ok) {
      return NextResponse.json(result, { status: 404 });
    }

    return NextResponse.json({ ok: true, mode: "local_prototype", membership: result.membership, room: result.room });
  }

  const [inviteRows, roomRows, memberRows] = await Promise.all([
    readSheetRange("room_invites!A:M"),
    readSheetRange("lesson_rooms!A:L"),
    readSheetRange("room_members!A:H")
  ]);
  const invite = inviteRows.slice(1).find((row) => row[3]?.toUpperCase() === code && (row[11] || "active") === "active");
  if (!invite) {
    return NextResponse.json({ ok: false, message: "일치하는 초대코드가 없습니다." }, { status: 404 });
  }

  const roomId = invite[1];
  const roomRow = roomRows.slice(1).find((row) => row[0] === roomId);
  if (!roomRow) {
    return NextResponse.json({ ok: false, message: "초대코드의 레슨방을 찾을 수 없습니다." }, { status: 404 });
  }

  const alreadyJoined = memberRows
    .slice(1)
    .some((row) => row[1] === roomId && row[2] === memberId && (row[5] || "active") === "active");
  if (alreadyJoined) {
    return NextResponse.json({ ok: false, message: "이미 가입한 프로방입니다." }, { status: 409 });
  }

  const createdAt = nowIso();
  const membership: RoomMembership = {
    id: `membership_${Date.now()}`,
    roomId,
    memberId,
    memberName,
    joinedAtLabel: "DB 저장됨"
  };

  await appendSheetRow("room_members!A:H", [
    membership.id,
    roomId,
    memberId,
    memberName,
    createdAt,
    "active",
    "invite_code",
    code
  ]);

  return NextResponse.json({
    ok: true,
    membership,
    room: mapRoomRow(roomRow, code)
  });
}
