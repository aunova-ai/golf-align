import { NextResponse } from "next/server";
import { appendSheetRow, isGoogleSheetsWriteConfigured } from "@/lib/google/googleSheetsServer";
import { createLocalRoomInvitation } from "@/lib/local/prototypeDbServer";

type InvitationBody = {
  memberId?: string;
  memberName?: string;
  message?: string;
  proId?: string;
  proName?: string;
  roomId?: string;
  roomName?: string;
};

function nowIso() {
  return new Date().toISOString();
}

export async function POST(request: Request) {
  const body = (await request.json()) as InvitationBody;
  const roomId = body.roomId?.trim() ?? "";
  const roomName = body.roomName?.trim() ?? "";
  const proId = body.proId?.trim() ?? "";
  const proName = body.proName?.trim() ?? "";
  const memberId = body.memberId?.trim() ?? "";
  const memberName = body.memberName?.trim() ?? "";
  const message = body.message?.trim() || `${roomName} 초대가 도착했습니다.`;

  if (!roomId || !roomName || !proId || !proName || !memberId || !memberName) {
    return NextResponse.json({ ok: false, message: "초대할 방, 프로, 회원 정보가 필요합니다." }, { status: 400 });
  }

  if (!isGoogleSheetsWriteConfigured()) {
    const invitation = await createLocalRoomInvitation({
      memberId,
      memberName,
      message,
      proId,
      proName,
      roomId,
      roomName
    });

    return NextResponse.json({ ok: true, mode: "local_prototype", invitationId: invitation.id });
  }

  const createdAt = nowIso();
  const invitationId = `room_invitation_${Date.now()}`;
  await appendSheetRow("room_invitations!A:K", [
    invitationId,
    roomId,
    roomName,
    proId,
    proName,
    memberId,
    memberName,
    message,
    "pending",
    createdAt,
    createdAt
  ]);

  await appendSheetRow("messages!A:L", [
    `msg_${Date.now()}`,
    proId,
    proName,
    memberId,
    memberName,
    roomId,
    "invite",
    message,
    invitationId,
    "",
    createdAt,
    "active"
  ]);

  return NextResponse.json({ ok: true, invitationId });
}
