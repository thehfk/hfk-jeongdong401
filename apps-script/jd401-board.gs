/**
 * 정동401프로젝트 6기 게시판 백엔드
 *
 * 배포 방법:
 * 1. 새 Google Sheet 생성 → 파일 이름 "정동401 6기 게시판"
 *    - 시트1 헤더 A1:D1: timestamp | name | message | id
 * 2. 확장 → Apps Script 열기
 * 3. 이 파일 전체 붙여넣기 → 저장
 * 4. 배포 → 새 배포 → 유형 '웹앱':
 *    - 실행 계정: 본인
 *    - 액세스: 'Anyone' (URL 알면 누구나)
 * 5. 발급된 웹앱 URL을 6기/index.html의 BOARD_API_URL에 붙여넣기
 */

const SHEET_NAME = "시트1";

function doGet(e) {
  return handleRequest(e, "list");
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    return handleRequest(e, body.action, body);
  } catch (err) {
    return jsonResponse({ ok: false, error: "exception: " + err.message });
  }
}

function handleRequest(e, action, body) {
  try {
    if (action === "list") return jsonResponse({ ok: true, memos: listMemos() });
    if (action === "create") return jsonResponse(createMemo(body));
    if (action === "delete") return jsonResponse(deleteMemo(body));
    return jsonResponse({ ok: false, error: "unknown action: " + action });
  } catch (err) {
    return jsonResponse({ ok: false, error: "exception: " + err.message });
  }
}

function sheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
}

function listMemos() {
  const s = sheet();
  const last = s.getLastRow();
  if (last < 2) return [];
  const rows = s.getRange(2, 1, last - 1, 4).getValues();
  return rows
    .filter(r => r[0])
    .map(r => ({
      timestamp: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
      name: String(r[1] || ""),
      message: String(r[2] || ""),
      id: String(r[3] || ""),
    }))
    .reverse();
}

function createMemo(body) {
  const name = String(body.name || "").trim();
  const message = String(body.message || "").trim();
  if (!name) return { ok: false, error: "name required" };
  if (!message) return { ok: false, error: "message required" };
  if (message.length > 2000) return { ok: false, error: "message too long" };

  const id = Utilities.getUuid();
  const timestamp = new Date();
  sheet().appendRow([timestamp, name, message, id]);
  return { ok: true, id: id };
}

function deleteMemo(body) {
  const id = String(body.id || "").trim();
  const secret = String(body.secret || "");
  const expected = PropertiesService.getScriptProperties().getProperty("ADMIN_SECRET");
  if (!expected || secret !== expected) return { ok: false, error: "unauthorized" };
  if (!id) return { ok: false, error: "id required" };
  const s = sheet();
  const last = s.getLastRow();
  const ids = s.getRange(2, 4, last - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === id) {
      s.deleteRow(i + 2);
      return { ok: true };
    }
  }
  return { ok: false, error: "not found" };
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
