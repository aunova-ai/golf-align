import { NextResponse } from "next/server";
import { appendSheetRow, isGoogleSheetsWriteConfigured } from "@/lib/google/googleSheetsServer";
import { createLocalJoinRequest } from "@/lib/local/prototypeDbServer";

type JoinRequestBody = {
  memberId?: string;
  memberName?: string;
  message?: string;
  proId?: string;
  proName?: string;
  requestedRoomId?: string;
};

function nowIso() {
  return new Date().toISOString();
}

export async function POST(request: Request) {
  const body = (await request.json()) as JoinRequestBody;
  const memberId = body.memberId?.trim() ?? "";
  const memberName = body.memberName?.trim() ?? "";
  const proId = body.proId?.trim() ?? "";
  const proName = body.proName?.trim() ?? "";
  const message = body.message?.trim() || "프로방 가입을 신청합니다.";

  if (!memberId || !memberName || !proId || !proName) {
    return NextResponse.json({ ok: false, message: "신청자와 프로 정보가 필요합니다." }, { status: 400 });
  }

  if (!isGoogleSheetsWriteConfigured()) {
    const joinRequest = await createLocalJoinRequest({
      memberId,
      memberName,
      message,
      proId,
      proName,
      requestedRoomId: body.requestedRoomId?.trim()
    });

    return NextResponse.json({ ok: true, mode: "local_prototype", requestId: joinRequest.id });
  }

  const createdAt = nowIso();
  const requestId = `join_req_${Date.now()}`;
  await appendSheetRow("room_join_requests!A:J", [
    requestId,
    memberId,
    memberName,
    proId,
    proName,
    body.requestedRoomId?.trim() ?? "",
    message,
    "pending",
    createdAt,
    createdAt
  ]);

  await appendSheetRow("messages!A:L", [
    `msg_${Date.now()}`,
    memberId,
    memberName,
    proId,
    proName,
    "",
    "request",
    message,
    requestId,
    "",
    createdAt,
    "active"
  ]);

  return NextResponse.json({ ok: true, requestId });
}
