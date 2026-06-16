import { NextResponse } from "next/server";
import type { PrototypeRoom } from "@/components/golfalign/types";
import { appendSheetRow, isGoogleSheetsWriteConfigured, readSheetRange } from "@/lib/google/googleSheetsServer";
import { createLocalRoom, getLocalRoomsForPro } from "@/lib/local/prototypeDbServer";

type CreateRoomRequest = {
  inviteCode?: string;
  name?: string;
  proId?: string;
  proName?: string;
  purpose?: string;
  roomId?: string;
};

function nowIso() {
  return new Date().toISOString();
}

function mapRoomRow(row: string[], inviteCode = ""): PrototypeRoom {
  return {
    id: row[0],
    proId: row[1] || row[2],
    proName: row[11] || "프로",
    name: row[3] || "레슨방",
    purpose: row[4] || "개인 레슨 관리",
    inviteCode,
    createdAtLabel: row[8] ? "DB 저장됨" : "방금 생성"
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const proId = url.searchParams.get("proId")?.trim();

  if (!isGoogleSheetsWriteConfigured()) {
    const rooms = await getLocalRoomsForPro(proId);
    return NextResponse.json({ ok: true, mode: "local_prototype", rooms });
  }

  const [roomRows, inviteRows] = await Promise.all([
    readSheetRange("lesson_rooms!A:L"),
    readSheetRange("room_invites!A:M")
  ]);
  const inviteByRoomId = new Map(inviteRows.slice(1).map((row) => [row[1], row[3]]));
  const rooms = roomRows
    .slice(1)
    .filter((row) => !proId || row[1] === proId || row[2] === proId)
    .map((row) => mapRoomRow(row, inviteByRoomId.get(row[0]) ?? ""));

  return NextResponse.json({ ok: true, rooms });
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreateRoomRequest;
  const roomId = body.roomId?.trim() || `room_${Date.now()}`;
  const name = body.name?.trim() ?? "";
  const proId = body.proId?.trim() ?? "";
  const proName = body.proName?.trim() ?? "프로";
  const purpose = body.purpose?.trim() || "개인 레슨 관리";
  const inviteCode = body.inviteCode?.trim().toUpperCase() ?? "";

  if (!name || !proId || !inviteCode) {
    return NextResponse.json({ ok: false, message: "레슨방 저장 정보가 부족합니다." }, { status: 400 });
  }

  if (!isGoogleSheetsWriteConfigured()) {
    const result = await createLocalRoom({ inviteCode, name, proId, proName, purpose, roomId });
    if (!result.ok) {
      return NextResponse.json(result, { status: 409 });
    }

    return NextResponse.json({ ok: true, mode: "local_prototype", room: result.room });
  }

  const inviteRows = await readSheetRange("room_invites!A:M");
  const duplicatedInvite = inviteRows.slice(1).some((row) => row[3]?.toUpperCase() === inviteCode);
  if (duplicatedInvite) {
    return NextResponse.json({ ok: false, message: "이미 사용 중인 초대코드입니다." }, { status: 409 });
  }

  const createdAt = nowIso();
  await appendSheetRow("lesson_rooms!A:L", [
    roomId,
    proId,
    proId,
    name,
    purpose,
    "private_lesson",
    "invite_only",
    "name_photo",
    createdAt,
    createdAt,
    "active",
    proName
  ]);

  await appendSheetRow("room_invites!A:M", [
    `invite_${Date.now()}`,
    roomId,
    proId,
    inviteCode,
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/?invite=${inviteCode}`,
    `${proName} · ${name}`,
    "",
    0,
    "",
    createdAt,
    createdAt,
    "active"
  ]);

  return NextResponse.json({
    ok: true,
    room: {
      id: roomId,
      proId,
      proName,
      name,
      purpose,
      inviteCode,
      createdAtLabel: "DB 저장됨"
    } satisfies PrototypeRoom
  });
}
