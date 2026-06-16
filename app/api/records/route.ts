import { NextResponse } from "next/server";
import type { RecordItem } from "@/components/golfalign/types";
import { appendSheetRow, isGoogleSheetsWriteConfigured, readSheetRange } from "@/lib/google/googleSheetsServer";
import { createLocalRecord, getLocalRecords } from "@/lib/local/prototypeDbServer";

type RecordRequest = {
  bodyAngle?: string;
  cameraAngle?: string;
  media?: "video" | "image";
  mediaUrl?: string;
  memberId?: string;
  memberName?: string;
  memo?: string;
  meta?: string;
  recordId?: string;
  recordType?: string;
  roomId?: string;
  roomName?: string;
  roomProId?: string;
  thumbnailUrl?: string;
  title?: string;
};

function nowIso() {
  return new Date().toISOString();
}

function mapRecordRow(row: string[], shared?: { roomId?: string; roomName?: string }): RecordItem {
  const mediaUrl = row[18] || "";
  const thumbnailUrl = row[20] || row[18] || row[17] || "";
  const visibility = row[23] || row[22] || "";
  return {
    id: row[0],
    memberId: row[1],
    recordType: row[2],
    media: row[3] === "image" ? "image" : "video",
    title: row[4] || "업로드 기록",
    cameraAngle: row[6],
    bodyAngle: row[6],
    meta: `${row[2] || "기록"} · ${row[6] || "자세 각도 미지정"} · DB 불러옴`,
    mediaUrl,
    thumbnailUrl,
    memo: row[24],
    badge: shared || visibility === "shared" ? "개인 기록 + 프로방 공유" : "개인 기록",
    roomId: shared?.roomId,
    roomName: shared?.roomName,
    sharedAt: shared ? "DB 공유" : undefined
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const memberId = url.searchParams.get("memberId")?.trim();
  const roomIds = url.searchParams
    .get("roomIds")
    ?.split(",")
    .map((roomId) => roomId.trim())
    .filter(Boolean);

  if (!memberId && (!roomIds || roomIds.length === 0)) {
    return NextResponse.json({ ok: false, message: "조회할 회원 또는 방 정보가 필요합니다." }, { status: 400 });
  }

  if (!isGoogleSheetsWriteConfigured()) {
    const records = await getLocalRecords({ memberId, roomIds });
    return NextResponse.json({ ok: true, mode: "local_prototype", records });
  }

  const [rows, sharedRows, roomRows] = await Promise.all([
    readSheetRange("records!A:AC"),
    readSheetRange("shared_records!A:K"),
    readSheetRange("lesson_rooms!A:L")
  ]);
  const roomNameById = new Map(roomRows.slice(1).map((row) => [row[0], row[3] || "프로방"]));
  const roomIdSet = new Set(roomIds ?? []);
  const activeShares = sharedRows
    .slice(1)
    .filter((row) => (row[10] || "active") === "active")
    .filter((row) => !roomIdSet.size || roomIdSet.has(row[1]));
  const shareByRecordId = new Map(
    activeShares.map((row) => [
      row[3],
      {
        roomId: row[1],
        roomName: roomNameById.get(row[1]) ?? "프로방"
      }
    ])
  );

  const records = rows
    .slice(1)
    .filter((row) => (row[28] || row[25] || "active") === "active")
    .filter((row) => {
      if (memberId && row[1] === memberId) {
        return true;
      }

      return Boolean(roomIdSet.size && shareByRecordId.has(row[0]));
    })
    .map((row) => mapRecordRow(row, shareByRecordId.get(row[0])))
    .reverse();

  return NextResponse.json({ ok: true, records });
}

export async function POST(request: Request) {
  const body = (await request.json()) as RecordRequest;
  const memberId = body.memberId?.trim() ?? "";
  const recordId = body.recordId?.trim() || `rec_${Date.now()}`;
  const title = body.title?.trim() || "업로드 기록";
  const media = body.media === "image" ? "image" : "video";
  const recordType = body.recordType?.trim() || "swing";
  const bodyAngle = body.bodyAngle?.trim() || body.cameraAngle?.trim() || "";
  const roomId = body.roomId?.trim() ?? "";
  const shared = Boolean(roomId);

  if (!memberId) {
    return NextResponse.json({ ok: false, message: "기록 저장에 회원 정보가 필요합니다." }, { status: 400 });
  }

  if (!isGoogleSheetsWriteConfigured()) {
    const result = await createLocalRecord({
      bodyAngle,
      cameraAngle: bodyAngle,
      media,
      mediaUrl: body.mediaUrl?.trim(),
      memberId,
      memberName: body.memberName?.trim(),
      memo: body.memo?.trim(),
      meta: body.meta?.trim(),
      recordId,
      recordType,
      roomId,
      roomName: body.roomName?.trim(),
      thumbnailUrl: body.thumbnailUrl?.trim(),
      title
    });

    return NextResponse.json({
      ok: true,
      mode: "local_prototype",
      recordId: result.record.id,
      record: result.record,
      shared: result.shared
    });
  }

  const createdAt = nowIso();
  await appendSheetRow("records!A:AC", [
    recordId,
    memberId,
    recordType,
    media,
    title,
    "",
    bodyAngle,
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "device",
    "",
    "",
    "local_download",
    body.mediaUrl?.trim() ?? "",
    "",
    body.thumbnailUrl ?? "",
    body.thumbnailUrl ? 1 : 0,
    "",
    "",
    "synced",
    shared ? "shared" : "private",
    body.memo?.trim() ?? "",
    createdAt,
    createdAt,
    createdAt,
    "active"
  ]);

  if (shared) {
    await appendSheetRow("shared_records!A:K", [
      `shared_record_${Date.now()}`,
      roomId,
      memberId,
      recordId,
      body.roomProId?.trim() ?? "",
      "view_feedback",
      createdAt,
      "",
      createdAt,
      createdAt,
      "active"
    ]);
  }

  return NextResponse.json({ ok: true, recordId, shared });
}
