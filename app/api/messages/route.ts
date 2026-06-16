import { NextResponse } from "next/server";
import { appendSheetRow, isGoogleSheetsWriteConfigured, readSheetRange } from "@/lib/google/googleSheetsServer";
import { createLocalMessage, getLocalMessages } from "@/lib/local/prototypeDbServer";

type MessageBody = {
  content?: string;
  messageType?: "text" | "invite" | "request" | "system";
  receiverId?: string;
  receiverName?: string;
  relatedId?: string;
  roomId?: string;
  senderId?: string;
  senderName?: string;
};

function nowIso() {
  return new Date().toISOString();
}

function mapMessageRow(row: string[]) {
  return {
    id: row[0],
    senderId: row[1],
    senderName: row[2],
    receiverId: row[3],
    receiverName: row[4],
    roomId: row[5],
    messageType: row[6] === "invite" || row[6] === "request" || row[6] === "system" ? row[6] : "text",
    content: row[7],
    relatedId: row[8],
    readAt: row[9],
    createdAt: row[10],
    status: row[11] || "active"
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId")?.trim();

  if (!userId) {
    return NextResponse.json({ ok: false, message: "조회할 사용자 정보가 필요합니다." }, { status: 400 });
  }

  if (!isGoogleSheetsWriteConfigured()) {
    const messages = await getLocalMessages(userId);
    return NextResponse.json({ ok: true, mode: "local_prototype", messages });
  }

  const rows = await readSheetRange("messages!A:L");
  const messages = rows
    .slice(1)
    .filter((row) => (row[1] === userId || row[3] === userId) && (row[11] || "active") === "active")
    .map(mapMessageRow)
    .reverse();

  return NextResponse.json({ ok: true, messages });
}

export async function POST(request: Request) {
  const body = (await request.json()) as MessageBody;
  const senderId = body.senderId?.trim() ?? "";
  const senderName = body.senderName?.trim() ?? "";
  const receiverId = body.receiverId?.trim() ?? "";
  const receiverName = body.receiverName?.trim() ?? "";
  const content = body.content?.trim() ?? "";
  const messageType = body.messageType ?? "text";

  if (!senderId || !senderName || !receiverId || !receiverName || !content) {
    return NextResponse.json({ ok: false, message: "메시지 발신자, 수신자, 내용이 필요합니다." }, { status: 400 });
  }

  if (!isGoogleSheetsWriteConfigured()) {
    const message = await createLocalMessage({
      senderId,
      senderName,
      receiverId,
      receiverName,
      roomId: body.roomId?.trim() || undefined,
      messageType,
      content,
      relatedId: body.relatedId?.trim() || undefined
    });

    return NextResponse.json({ ok: true, mode: "local_prototype", messageId: message.id, message });
  }

  const createdAt = nowIso();
  const messageId = `msg_${Date.now()}`;
  await appendSheetRow("messages!A:L", [
    messageId,
    senderId,
    senderName,
    receiverId,
    receiverName,
    body.roomId?.trim() ?? "",
    messageType,
    content,
    body.relatedId?.trim() ?? "",
    "",
    createdAt,
    "active"
  ]);

  return NextResponse.json({
    ok: true,
    message: {
      id: messageId,
      senderId,
      senderName,
      receiverId,
      receiverName,
      roomId: body.roomId?.trim() || undefined,
      messageType,
      content,
      relatedId: body.relatedId?.trim() || undefined,
      createdAt,
      status: "active"
    },
    messageId
  });
}
