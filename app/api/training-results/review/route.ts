import { NextResponse } from "next/server";
import { appendSheetRow, isGoogleSheetsWriteConfigured } from "@/lib/google/googleSheetsServer";
import { reviewLocalTrainingResult } from "@/lib/local/prototypeDbServer";

type ReviewRequest = {
  proComment?: string;
  proId?: string;
  resultId?: string;
};

function nowIso() {
  return new Date().toISOString();
}

export async function POST(request: Request) {
  const body = (await request.json()) as ReviewRequest;
  const resultId = body.resultId?.trim() ?? "";
  const proId = body.proId?.trim() ?? "";
  const proComment = body.proComment?.trim() ?? "";

  if (!resultId || !proId || !proComment) {
    return NextResponse.json({ ok: false, message: "결과 확인에 결과 ID, 프로, 코멘트가 필요합니다." }, { status: 400 });
  }

  if (!isGoogleSheetsWriteConfigured()) {
    const result = await reviewLocalTrainingResult({ proComment, proId, resultId });
    return NextResponse.json({ ...result, mode: "local_prototype" });
  }

  const createdAt = nowIso();
  await appendSheetRow("messages!A:L", [
    `msg_${Date.now()}`,
    proId,
    "프로",
    "",
    "",
    "",
    "system",
    `훈련 결과 ${resultId} 확인 완료: ${proComment}`,
    resultId,
    "",
    createdAt,
    "active"
  ]);

  return NextResponse.json({ ok: true });
}
