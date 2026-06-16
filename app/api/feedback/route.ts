import { NextResponse } from "next/server";
import type { FeedbackItem } from "@/components/golfalign/types";
import { appendSheetRow, isGoogleSheetsWriteConfigured, readSheetRange } from "@/lib/google/googleSheetsServer";
import { createLocalFeedback, getLocalFeedback } from "@/lib/local/prototypeDbServer";

type FeedbackRequest = {
  annotations?: FeedbackItem["annotations"];
  feedbackId?: string;
  focusComment?: string;
  goalComment?: string;
  hiddenAngleMarkIds?: string[];
  memberId?: string;
  poseAnalysis?: FeedbackItem["poseAnalysis"];
  poseAnglesVisible?: boolean;
  poseEngine?: string;
  proId?: string;
  proName?: string;
  recordId?: string;
  roomId?: string;
  snapshotUrl?: string;
  stickerComment?: string;
};

function nowIso() {
  return new Date().toISOString();
}

function mapFeedbackRow(row: string[]): FeedbackItem {
  return {
    id: row[0],
    recordId: row[4],
    proName: row[12] || "프로",
    goalComment: row[5] || "",
    focusComment: row[6] || "",
    stickerComment: row[7] || "",
    snapshotUrl: row[13] || "",
    poseAnglesVisible: row[14] ? row[14] === "true" : undefined,
    hiddenAngleMarkIds: row[15] ? row[15].split(",").filter(Boolean) : undefined,
    annotations: row[16] ? JSON.parse(row[16]) : undefined,
    poseAnalysis: row[17] ? JSON.parse(row[17]) : undefined,
    poseEngine: row[18] || undefined,
    createdAtLabel: row[9] ? "DB 불러옴" : "방금 저장"
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const memberId = url.searchParams.get("memberId")?.trim();
  const proId = url.searchParams.get("proId")?.trim();
  const recordId = url.searchParams.get("recordId")?.trim();

  if (!memberId && !proId && !recordId) {
    return NextResponse.json({ ok: false, message: "조회할 회원, 프로 또는 기록 정보가 필요합니다." }, { status: 400 });
  }

  if (!isGoogleSheetsWriteConfigured()) {
    const feedback = await getLocalFeedback({ memberId, proId, recordId });
    return NextResponse.json({ ok: true, mode: "local_prototype", feedback });
  }

  const rows = await readSheetRange("feedback!A:S");
  const feedback = rows
    .slice(1)
    .filter((row) => (row[11] || "active") === "active")
    .filter((row) => {
      if (recordId && row[4] === recordId) {
        return true;
      }

      if (memberId && row[3] === memberId) {
        return true;
      }

      return Boolean(proId && row[2] === proId);
    })
    .map(mapFeedbackRow)
    .reverse();

  return NextResponse.json({ ok: true, feedback });
}

export async function POST(request: Request) {
  const body = (await request.json()) as FeedbackRequest;
  const recordId = body.recordId?.trim() ?? "";
  const proId = body.proId?.trim() ?? "";
  const memberId = body.memberId?.trim() ?? "";
  const goalComment = body.goalComment?.trim() ?? "";
  const focusComment = body.focusComment?.trim() ?? "";
  const stickerComment = body.stickerComment?.trim() ?? "";

  if (!recordId || !proId || !goalComment || !focusComment) {
    return NextResponse.json({ ok: false, message: "피드백 저장에 기록, 프로, 목표, 코멘트가 필요합니다." }, { status: 400 });
  }

  if (!isGoogleSheetsWriteConfigured()) {
    const feedback = await createLocalFeedback({
      annotations: body.annotations,
      feedbackId: body.feedbackId?.trim(),
      focusComment,
      goalComment,
      hiddenAngleMarkIds: body.hiddenAngleMarkIds,
      poseAnalysis: body.poseAnalysis,
      poseAnglesVisible: body.poseAnglesVisible,
      poseEngine: body.poseEngine,
      proName: body.proName?.trim() || "프로",
      recordId,
      snapshotUrl: body.snapshotUrl?.trim(),
      stickerComment
    });

    return NextResponse.json({ ok: true, mode: "local_prototype", feedbackId: feedback.id, feedback });
  }

  const createdAt = nowIso();
  const feedbackId = body.feedbackId?.trim() || `fb_${Date.now()}`;
  await appendSheetRow("feedback!A:S", [
    feedbackId,
    body.roomId?.trim() ?? "",
    proId,
    memberId,
    recordId,
    goalComment,
    focusComment,
    stickerComment,
    "",
    createdAt,
    createdAt,
    "active",
    body.proName?.trim() ?? "프로",
    body.snapshotUrl?.trim() ?? "",
    String(body.poseAnglesVisible ?? ""),
    body.hiddenAngleMarkIds?.join(",") ?? "",
    body.annotations ? JSON.stringify(body.annotations) : "",
    body.poseAnalysis ? JSON.stringify(body.poseAnalysis) : "",
    body.poseEngine ?? body.poseAnalysis?.engine ?? ""
  ]);

  return NextResponse.json({ ok: true, feedbackId });
}
