import { NextResponse } from "next/server";
import type { PrototypeRoom, RoomMembership } from "@/components/golfalign/types";
import { appendSheetRow, isGoogleSheetsWriteConfigured } from "@/lib/google/googleSheetsServer";
import { acceptLocalRoomInvitation } from "@/lib/local/prototypeDbServer";

type AcceptInvitationBody = {
  memberId?: string;
  memberName?: string;
  proId?: string;
  proName?: string;
  relatedId?: string;
  roomId?: string;
  roomName?: string;
};

function nowIso() {
  return new Date().toISOString();
}

export async function POST(request: Request) {
  const body = (await request.json()) as AcceptInvitationBody;
  const roomId = body.roomId?.trim() ?? "";
  const roomName = body.roomName?.trim() || "초대받은 레슨방";
  const memberId = body.memberId?.trim() ?? "";
  const memberName = body.memberName?.trim() ?? "";
  const proId = body.proId?.trim() ?? "";
  const proName = body.proName?.trim() || "프로";

  if (!roomId || !memberId || !memberName || !proId) {
    return NextResponse.json({ ok: false, message: "초대 수락에 필요한 정보가 부족합니다." }, { status: 400 });
  }

  if (!isGoogleSheetsWriteConfigured()) {
    const result = await acceptLocalRoomInvitation({
      memberId,
      memberName,
      proId,
      proName,
      relatedId: body.relatedId?.trim(),
      roomId,
      roomName
    });

    return NextResponse.json({ ok: true, mode: "local_prototype", ...result });
  }

  const createdAt = nowIso();
  const membership: RoomMembership = {
    id: `membership_${Date.now()}`,
    roomId,
    memberId,
    memberName,
    joinedAtLabel: "초대 수락"
  };
  const room: PrototypeRoom = {
    id: roomId,
    name: roomName,
    purpose: "초대로 연결된 레슨방",
    inviteCode: "",
    proId,
    proName,
    createdAtLabel: "DB 불러옴"
  };

  await appendSheetRow("room_members!A:H", [
    membership.id,
    roomId,
    memberId,
    memberName,
    createdAt,
    "active",
    "invitation",
    body.relatedId?.trim() ?? ""
  ]);

  await appendSheetRow("messages!A:L", [
    `msg_${Date.now()}`,
    memberId,
    memberName,
    proId,
    proName,
    roomId,
    "system",
    `${memberName}님이 ${roomName} 초대를 수락했습니다.`,
    body.relatedId?.trim() ?? "",
    "",
    createdAt,
    "active"
  ]);

  return NextResponse.json({ ok: true, membership, room });
}
