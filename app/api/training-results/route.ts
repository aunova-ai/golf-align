import { NextResponse } from "next/server";
import type { TrainingResult } from "@/components/golfalign/types";
import { appendSheetRow, isGoogleSheetsWriteConfigured, readSheetRange } from "@/lib/google/googleSheetsServer";
import { createLocalTrainingResult, getLocalTrainingResults } from "@/lib/local/prototypeDbServer";

type ResultRequest = {
  actualReps?: string;
  assignmentId?: string;
  attachmentLabel?: string;
  difficulty?: string;
  memberName?: string;
  memberNote?: string;
  resultId?: string;
  resultRecordId?: string;
  roomId?: string;
  successCount?: string;
  title?: string;
  userId?: string;
  visibility?: string;
};

function nowIso() {
  return new Date().toISOString();
}

function mapResultRow(row: string[]): TrainingResult {
  return {
    id: row[0],
    assignmentId: row[1],
    title: row[14] || "훈련 결과",
    memberName: row[15] || "회원",
    count: row[4] || row[5] || "기록 없음",
    difficulty: row[6] || "보통",
    memo: row[7] || "",
    shareToRoom: row[9] !== "private",
    attachmentLabel: row[8] ? "기록 첨부" : "",
    proComment: row[16] || "",
    createdAtLabel: row[11] ? "DB 불러옴" : "방금 저장",
    status: row[13] === "확인 완료" ? "확인 완료" : "제출됨"
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId")?.trim();
  const roomIds = (url.searchParams.get("roomIds") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const roomIdSet = new Set(roomIds);

  if (!userId && roomIdSet.size === 0) {
    return NextResponse.json({ ok: false, message: "조회할 회원 또는 방 정보가 필요합니다." }, { status: 400 });
  }

  if (!isGoogleSheetsWriteConfigured()) {
    const results = await getLocalTrainingResults({ userId, roomIds });
    return NextResponse.json({ ok: true, mode: "local_prototype", results });
  }

  const rows = await readSheetRange("training_results!A:Q");
  const results = rows
    .slice(1)
    .filter((row) => (row[13] || "active") !== "deleted")
    .filter((row) => (userId ? row[3] === userId : roomIdSet.has(row[2])))
    .map(mapResultRow)
    .reverse();

  return NextResponse.json({ ok: true, results });
}

export async function POST(request: Request) {
  const body = (await request.json()) as ResultRequest;
  const resultId = body.resultId?.trim() || `trr_${Date.now()}`;
  const assignmentId = body.assignmentId?.trim() ?? "";
  const userId = body.userId?.trim() ?? "";
  const title = body.title?.trim() || "훈련 결과";
  const memberName = body.memberName?.trim() || "회원";

  if (!assignmentId || !userId) {
    return NextResponse.json({ ok: false, message: "훈련 결과 저장에 과제와 회원 정보가 필요합니다." }, { status: 400 });
  }

  if (!isGoogleSheetsWriteConfigured()) {
    const result = await createLocalTrainingResult({
      actualReps: body.actualReps?.trim(),
      assignmentId,
      attachmentLabel: body.attachmentLabel?.trim(),
      difficulty: body.difficulty?.trim(),
      memberName,
      memberNote: body.memberNote?.trim(),
      resultId,
      roomId: body.roomId?.trim(),
      title,
      userId,
      visibility: body.visibility?.trim()
    });

    return NextResponse.json({ ok: true, mode: "local_prototype", resultId: result.id, result });
  }

  const createdAt = nowIso();
  await appendSheetRow("training_results!A:Q", [
    resultId,
    assignmentId,
    body.roomId?.trim() ?? "",
    userId,
    body.actualReps?.trim() ?? "",
    body.successCount?.trim() ?? "",
    body.difficulty?.trim() ?? "",
    body.memberNote?.trim() ?? "",
    body.resultRecordId?.trim() ?? "",
    body.visibility?.trim() ?? "room",
    createdAt,
    createdAt,
    createdAt,
    "제출됨",
    title,
    memberName,
    ""
  ]);

  return NextResponse.json({ ok: true, resultId });
}
