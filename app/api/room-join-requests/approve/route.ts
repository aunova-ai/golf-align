import { NextResponse } from "next/server";
import type { RoomMembership } from "@/components/golfalign/types";
import { appendSheetRow, isGoogleSheetsWriteConfigured } from "@/lib/google/googleSheetsServer";
import { approveLocalJoinRequest } from "@/lib/local/prototypeDbServer";

type ApproveJoinRequestBody = {
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
  const body = (await request.json()) as ApproveJoinRequestBody;
  const roomId = body.roomId?.trim() ?? "";
  const roomName = body.roomName?.trim() ?? "";
  const memberId = body.memberId?.trim() ?? "";
  const memberName = body.memberName?.trim() ?? "";
  const proId = body.proId?.trim() ?? "";
  const proName = body.proName?.trim() || "프로";

  if (!roomId || !roomName || !memberId || !memberName || !proId) {
    return NextResponse.json({ ok: false, message: "신청 승인에 필요한 정보가 부족합니다." }, { status: 400 });
  }

  if (!isGoogleSheetsWriteConfigured()) {
    const membership = await approveLocalJoinRequest({
      memberId,
      memberName,
      proId,
      proName,
      relatedId: body.relatedId?.trim(),
      roomId,
      roomName
    });

    return NextResponse.json({ ok: true, mode: "local_prototype", membership });
  }

  const createdAt = nowIso();
  const membership: RoomMembership = {
    id: `membership_${Date.now()}`,
    roomId,
    memberId,
    memberName,
    joinedAtLabel: "신청 승인"
  };

  await appendSheetRow("room_members!A:H", [
    membership.id,
    roomId,
    memberId,
    memberName,
    createdAt,
    "active",
    "join_request",
    body.relatedId?.trim() ?? ""
  ]);

  await appendSheetRow("messages!A:L", [
    `msg_${Date.now()}`,
    proId,
    proName,
    memberId,
    memberName,
    roomId,
    "system",
    `${proName}님이 ${memberName}님을 ${roomName}에 배정했습니다.`,
    body.relatedId?.trim() ?? "",
    "",
    createdAt,
    "active"
  ]);

  return NextResponse.json({ ok: true, membership });
}
