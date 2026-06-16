import { NextResponse } from "next/server";
import type { DirectoryPerson } from "@/components/golfalign/types";
import { isGoogleSheetsWriteConfigured, readSheetRange } from "@/lib/google/googleSheetsServer";
import { findLocalDirectory } from "@/lib/local/prototypeDbServer";

function includesQuery(person: DirectoryPerson, query: string) {
  if (!query) {
    return true;
  }

  return `${person.name} ${person.meta} ${person.badge}`.toLowerCase().includes(query.toLowerCase());
}

function compactMeta(parts: Array<string | undefined>) {
  return parts.filter((part) => part && part.trim()).join(" · ");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const role = url.searchParams.get("role");
  const query = url.searchParams.get("q")?.trim() ?? "";

  if (role !== "member" && role !== "pro") {
    return NextResponse.json({ ok: false, message: "검색할 역할 정보가 필요합니다." }, { status: 400 });
  }

  if (!isGoogleSheetsWriteConfigured()) {
    const people = await findLocalDirectory(role, query);
    return NextResponse.json({ ok: true, mode: "local_prototype", people });
  }

  const [userRows, proProfileRows] = await Promise.all([
    readSheetRange("users!A:AB"),
    readSheetRange("pro_profiles!A:J")
  ]);
  const proProfileByUserId = new Map(proProfileRows.slice(1).map((row) => [row[1], row]));

  const people = userRows
    .slice(1)
    .filter((row) => row[1] === role && (row[19] || "active") === "active")
    .map((row): DirectoryPerson => {
      const proProfile = proProfileByUserId.get(row[0]);
      const name = role === "pro" ? proProfile?.[2] || row[2] || row[3] : row[2] || row[3];
      const meta =
        role === "pro"
          ? compactMeta([proProfile?.[3], proProfile?.[4], proProfile?.[5], row[15]])
          : compactMeta([row[13], row[15], row[16]]);

      return {
        id: `directory_${row[0]}`,
        userId: row[0],
        name: name || "이름 없음",
        profileImageUrl: row[9] || "",
        meta: meta || (role === "pro" ? "프로필 준비 중" : "회원 프로필 준비 중"),
        badge: role === "pro" ? "레슨 가능" : "신청 가능"
      };
    })
    .filter((person) => includesQuery(person, query))
    .slice(0, 20);

  return NextResponse.json({ ok: true, people });
}
