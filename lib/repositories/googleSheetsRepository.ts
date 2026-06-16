import { golfAlignSheets } from "@/lib/google/sheetSchema";

export const googleSheetsRepository = {
  getSpreadsheetId() {
    return process.env.GOOGLE_SHEETS_SPREADSHEET_ID ?? "";
  },

  getSheetFolderId() {
    return process.env.GOOGLE_DRIVE_SHEET_FOLDER_ID ?? "1ixM9gVRDFSYkNIuqhbbuPdxJ0UTodPUP";
  },

  getSchema() {
    return golfAlignSheets;
  },

  isConfigured() {
    return Boolean(process.env.GOOGLE_SHEETS_SPREADSHEET_ID);
  }
};
