export function canUseServerLocalPrototypeDb() {
  return process.env.NODE_ENV !== "production" || process.env.ENABLE_SERVER_LOCAL_DB === "true";
}

export function serverLocalDbUnavailableResponse() {
  return {
    ok: false,
    code: "GOOGLE_SHEETS_NOT_CONFIGURED",
    message: "Google Sheets 저장 환경이 연결되지 않아 이 기기 저장 모드로만 사용할 수 있습니다.",
    mode: "device_only"
  };
}
