import { NextResponse } from "next/server";
import { clearLocalPrototypeTestData } from "@/lib/local/prototypeDbServer";

export async function POST() {
  const result = await clearLocalPrototypeTestData();
  return NextResponse.json({
    ok: true,
    mode: "local_prototype",
    ...result
  });
}
