import { NextResponse } from "next/server";
import { checkSheetSchema, repairSheetSchema } from "@/lib/google/sheetAdmin";

export async function GET() {
  try {
    const result = await checkSheetSchema();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        configured: true,
        ok: false,
        message: error instanceof Error ? error.message : "Google Sheets schema check failed.",
        sheets: []
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const result = await repairSheetSchema();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        configured: true,
        ok: false,
        message: error instanceof Error ? error.message : "Google Sheets schema repair failed.",
        repaired: false,
        sheets: []
      },
      { status: 500 }
    );
  }
}
