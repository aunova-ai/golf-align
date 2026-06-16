import { golfAlignSheets } from "./sheetSchema";
import {
  batchUpdateSpreadsheet,
  getSpreadsheetMetadata,
  isGoogleSheetsWriteConfigured,
  readSheetRange,
  updateSheetValues
} from "./googleSheetsServer";

type SheetSchemaStatus = {
  actualColumns: string[];
  expectedColumns: string[];
  extraColumns: string[];
  headerMatchesExact: boolean;
  missingColumns: string[];
  name: string;
  status: "missing_sheet" | "missing_header" | "ok" | "header_mismatch";
};

export type SheetSchemaCheckResult = {
  configured: boolean;
  ok: boolean;
  repaired?: boolean;
  sheets: SheetSchemaStatus[];
};

function columnName(index: number) {
  let column = "";
  let value = index;

  while (value > 0) {
    const remainder = (value - 1) % 26;
    column = String.fromCharCode(65 + remainder) + column;
    value = Math.floor((value - 1) / 26);
  }

  return column;
}

function headerRange(sheetName: string, columnsLength: number) {
  return `${sheetName}!A1:${columnName(columnsLength)}1`;
}

function buildStatus(name: string, expectedColumns: string[], actualColumns: string[] | null): SheetSchemaStatus {
  if (!actualColumns) {
    return {
      actualColumns: [],
      expectedColumns,
      extraColumns: [],
      headerMatchesExact: false,
      missingColumns: expectedColumns,
      name,
      status: "missing_sheet"
    };
  }

  const normalizedActual = actualColumns.map((column) => column.trim()).filter(Boolean);
  const missingColumns = expectedColumns.filter((column) => !normalizedActual.includes(column));
  const extraColumns = normalizedActual.filter((column) => !expectedColumns.includes(column));
  const headerMatchesExact =
    normalizedActual.length >= expectedColumns.length &&
    expectedColumns.every((column, index) => normalizedActual[index] === column);

  return {
    actualColumns: normalizedActual,
    expectedColumns,
    extraColumns,
    headerMatchesExact,
    missingColumns,
    name,
    status:
      normalizedActual.length === 0
        ? "missing_header"
        : headerMatchesExact && missingColumns.length === 0
          ? "ok"
          : "header_mismatch"
  };
}

export async function checkSheetSchema(): Promise<SheetSchemaCheckResult> {
  if (!isGoogleSheetsWriteConfigured()) {
    return {
      configured: false,
      ok: false,
      sheets: []
    };
  }

  const metadata = await getSpreadsheetMetadata();
  const existingSheetNames = new Set(metadata.sheets.map((sheet) => sheet.title));

  const sheets = await Promise.all(
    golfAlignSheets.map(async (definition) => {
      if (!existingSheetNames.has(definition.name)) {
        return buildStatus(definition.name, definition.columns, null);
      }

      const rows = await readSheetRange(headerRange(definition.name, definition.columns.length));
      return buildStatus(definition.name, definition.columns, rows[0] ?? []);
    })
  );

  return {
    configured: true,
    ok: sheets.every((sheet) => sheet.status === "ok"),
    sheets
  };
}

export async function repairSheetSchema(): Promise<SheetSchemaCheckResult> {
  if (!isGoogleSheetsWriteConfigured()) {
    return {
      configured: false,
      ok: false,
      repaired: false,
      sheets: []
    };
  }

  const before = await checkSheetSchema();
  const missingSheets = before.sheets.filter((sheet) => sheet.status === "missing_sheet");

  if (missingSheets.length > 0) {
    await batchUpdateSpreadsheet(
      missingSheets.map((sheet) => ({
        addSheet: {
          properties: {
            title: sheet.name
          }
        }
      }))
    );
  }

  await Promise.all(
    golfAlignSheets.map((definition) => updateSheetValues(headerRange(definition.name, definition.columns.length), [definition.columns]))
  );

  const after = await checkSheetSchema();
  return {
    ...after,
    repaired: true
  };
}
