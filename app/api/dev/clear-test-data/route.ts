import { NextResponse } from "next/server";
import { clearLocalPrototypeTestData } from "@/lib/local/prototypeDbServer";

function rejectProductionDevApi() {
  if (process.env.NODE_ENV !== "production" || process.env.ENABLE_DEV_API === "true") {
    return null;
  }

  return NextResponse.json({ ok: false, message: "Development API is disabled." }, { status: 404 });
}

export async function POST() {
  const rejection = rejectProductionDevApi();
  if (rejection) {
    return rejection;
  }

  const result = await clearLocalPrototypeTestData();
  return NextResponse.json({
    ok: true,
    mode: "local_prototype",
    ...result
  });
}
