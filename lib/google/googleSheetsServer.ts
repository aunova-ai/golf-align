import { createSign, pbkdf2Sync, randomBytes } from "crypto";

const tokenUrl = "https://oauth2.googleapis.com/token";
const sheetsScope = "https://www.googleapis.com/auth/spreadsheets";

function base64Url(input: string | Buffer) {
  return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function getPrivateKey() {
  return process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n") ?? "";
}

export function isGoogleSheetsWriteConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_EMAIL && getPrivateKey() && process.env.GOOGLE_SHEETS_SPREADSHEET_ID);
}

function getSpreadsheetId() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is not configured.");
  }

  return spreadsheetId;
}

async function getAccessToken() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = getPrivateKey();

  if (!clientEmail || !privateKey) {
    throw new Error("Google Sheets service account is not configured.");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      iss: clientEmail,
      scope: sheetsScope,
      aud: tokenUrl,
      exp: now + 3600,
      iat: now
    })
  );
  const unsignedJwt = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsignedJwt);
  const signature = base64Url(signer.sign(privateKey));
  const assertion = `${unsignedJwt}.${signature}`;

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });

  if (!response.ok) {
    throw new Error(`Google token request failed: ${response.status}`);
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("Google token response did not include access_token.");
  }

  return data.access_token;
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return { hash, salt };
}

export function verifyPassword(password: string, salt: string, expectedHash: string) {
  if (!password || !salt || !expectedHash) {
    return false;
  }

  const hash = pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return hash === expectedHash;
}

export async function appendSheetRow(range: string, values: Array<string | number | boolean>) {
  const spreadsheetId = getSpreadsheetId();

  const accessToken = await getAccessToken();
  const url = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append`
  );
  url.searchParams.set("valueInputOption", "USER_ENTERED");
  url.searchParams.set("insertDataOption", "INSERT_ROWS");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      values: [values]
    })
  });

  if (!response.ok) {
    throw new Error(`Google Sheets append failed: ${response.status}`);
  }

  return response.json();
}

export async function readSheetRange(range: string) {
  const spreadsheetId = getSpreadsheetId();

  const accessToken = await getAccessToken();
  const url = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`
  );

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Google Sheets read failed: ${response.status}`);
  }

  const data = (await response.json()) as { values?: string[][] };
  return data.values ?? [];
}

export type SpreadsheetSheetMeta = {
  sheetId: number;
  title: string;
};

export type SpreadsheetMeta = {
  sheets: SpreadsheetSheetMeta[];
};

export type SpreadsheetBatchRequest = {
  addSheet?: {
    properties: {
      title: string;
    };
  };
};

export async function getSpreadsheetMetadata(): Promise<SpreadsheetMeta> {
  const spreadsheetId = getSpreadsheetId();
  const accessToken = await getAccessToken();
  const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`);
  url.searchParams.set("fields", "sheets.properties(sheetId,title)");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Google Sheets metadata read failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    sheets?: Array<{
      properties?: {
        sheetId?: number;
        title?: string;
      };
    }>;
  };

  return {
    sheets:
      data.sheets
        ?.map((sheet) => ({
          sheetId: sheet.properties?.sheetId ?? 0,
          title: sheet.properties?.title ?? ""
        }))
        .filter((sheet) => sheet.title) ?? []
  };
}

export async function batchUpdateSpreadsheet(requests: SpreadsheetBatchRequest[]) {
  const spreadsheetId = getSpreadsheetId();
  const accessToken = await getAccessToken();
  const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ requests })
  });

  if (!response.ok) {
    throw new Error(`Google Sheets batch update failed: ${response.status}`);
  }

  return response.json();
}

export async function updateSheetValues(range: string, values: Array<Array<string | number | boolean>>) {
  const spreadsheetId = getSpreadsheetId();
  const accessToken = await getAccessToken();
  const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`);
  url.searchParams.set("valueInputOption", "USER_ENTERED");

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      values
    })
  });

  if (!response.ok) {
    throw new Error(`Google Sheets values update failed: ${response.status}`);
  }

  return response.json();
}
