import { NextResponse } from "next/server";
import type { TrainingAssignment } from "@/components/golfalign/types";
import { appendSheetRow, isGoogleSheetsWriteConfigured, readSheetRange } from "@/lib/google/googleSheetsServer";
import { createLocalTrainingAssignment, getLocalTrainingAssignments } from "@/lib/local/prototypeDbServer";

type AssignmentRequest = {
  assignmentId?: string;
  assignmentScope?: "room_common" | "personal" | "self";
  dueDate?: string;
  goal?: string;
  memberId?: string;
  proId?: string;
  recordGuide?: string;
  requireMedia?: boolean;
  roomId?: string;
  title?: string;
};

function nowIso() {
  return new Date().toISOString();
}

function mapAssignmentRow(row: string[]): TrainingAssignment {
  const scope = row[4] === "room_common" || row[4] === "personal" || row[4] === "self" ? row[4] : "personal";
  return {
    id: row[0],
    roomId: row[1],
    memberId: row[3],
    assignmentType: scope,
    title: row[5] || "훈련 과제",
    goal: row[6],
    recordGuide: row[7],
    meta: scope === "room_common" ? "방 공통 드릴 · DB 불러옴" : "프로 추천 · DB 불러옴",
    dueLabel: row[9],
    requireMedia: row[10] === "true" || row[10] === "TRUE",
    createdAtLabel: row[11] ? "DB 불러옴" : "방금 저장",
    status: row[13] || "진행 중"
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const memberId = url.searchParams.get("memberId")?.trim();
  const proId = url.searchParams.get("proId")?.trim();
  const roomIds = (url.searchParams.get("roomIds") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const roomIdSet = new Set(roomIds);

  if (!memberId && !proId && roomIdSet.size === 0) {
    return NextResponse.json({ ok: false, message: "조회할 회원, 프로 또는 방 정보가 필요합니다." }, { status: 400 });
  }

  if (!isGoogleSheetsWriteConfigured()) {
    const assignments = await getLocalTrainingAssignments({ memberId, proId, roomIds });
    return NextResponse.json({ ok: true, mode: "local_prototype", assignments });
  }

  const rows = await readSheetRange("training_assignments!A:N");
  const assignments = rows
    .slice(1)
    .filter((row) => (row[13] || "active") !== "deleted")
    .filter((row) => {
      if (proId && row[2] === proId) {
        return true;
      }

      if (memberId && row[3] === memberId) {
        return true;
      }

      return Boolean(memberId && row[4] === "room_common" && roomIdSet.has(row[1]));
    })
    .map(mapAssignmentRow)
    .reverse();

  return NextResponse.json({ ok: true, assignments });
}

export async function POST(request: Request) {
  const body = (await request.json()) as AssignmentRequest;
  const assignmentId = body.assignmentId?.trim() || `trn_${Date.now()}`;
  const title = body.title?.trim() ?? "";
  const proId = body.proId?.trim() ?? "";
  const scope = body.assignmentScope ?? "personal";

  if (!title || !proId) {
    return NextResponse.json({ ok: false, message: "훈련 과제 저장에 제목과 프로 정보가 필요합니다." }, { status: 400 });
  }

  if (!isGoogleSheetsWriteConfigured()) {
    const assignment = await createLocalTrainingAssignment({
      assignmentId,
      assignmentScope: scope,
      dueDate: body.dueDate?.trim(),
      goal: body.goal?.trim(),
      memberId: body.memberId?.trim(),
      proId,
      recordGuide: body.recordGuide?.trim(),
      requireMedia: Boolean(body.requireMedia),
      roomId: body.roomId?.trim(),
      title
    });

    return NextResponse.json({ ok: true, mode: "local_prototype", assignmentId: assignment.id, assignment });
  }

  const createdAt = nowIso();
  await appendSheetRow("training_assignments!A:N", [
    assignmentId,
    body.roomId?.trim() ?? "",
    proId,
    scope === "room_common" ? "" : body.memberId?.trim() ?? "",
    scope,
    title,
    body.goal?.trim() ?? "",
    body.recordGuide?.trim() ?? "",
    "",
    body.dueDate?.trim() ?? "",
    Boolean(body.requireMedia),
    createdAt,
    createdAt,
    "진행 중"
  ]);

  return NextResponse.json({ ok: true, assignmentId });
}
