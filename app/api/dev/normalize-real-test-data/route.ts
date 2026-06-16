import { NextResponse } from "next/server";
import { normalizeLocalPrototypeRealTestData } from "@/lib/local/prototypeDbServer";

export async function POST() {
  const result = await normalizeLocalPrototypeRealTestData();
  return NextResponse.json({
    ok: true,
    mode: "local_prototype",
    ...result
  });
}
