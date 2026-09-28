/**
 * 정동401프로젝트 6기 게시판 백엔드 v2
 *
 * 시트 컬럼(A~K):
 *   A timestamp   B name       C message      D id
 *   E parent_id   F season_tag G pinned_at    H reactions (JSON)
 *   I edited_at   J deleted    K attachments (JSON array of URLs)
 *
 * 스크립트 속성:
 *   ADMIN_SECRET          - 재윤 핀/관리자 기능용 비밀번호
 *   IMAGE_DRIVE_FOLDER_ID - 이미지 업로드 대상 Google Drive 폴더 ID (공유 링크 공개)
 */

const SHEET_NAME = "시트1";

function doGet(e) {
  return handleRequest("list", {});
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    return handleRequest(body.action, body);
  } catch (err) {
    return jsonResponse({ ok: false, error: "exception: " + err.message });
  }
}

function handleRequest(action, body) {
  try {
    switch (action) {
      case "list":         return jsonResponse({ ok: true, memos: listMemos() });
      case "create":       return jsonResponse(createMemo(body));
      case "edit":         return jsonResponse(editMemo(body));
      case "delete_own":   return jsonResponse(deleteOwn(body));
      case "react":        return jsonResponse(toggleReaction(body));
      case "pin":          return jsonResponse(togglePin(body));
      case "upload_image": return jsonResponse(uploadImage(body));
      default:             return jsonResponse({ ok: false, error: "unknown action: " + action });
    }
  } catch (err) {
    return jsonResponse({ ok: false, error: "exception: " + err.message });
  }
}

function sheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
}

function readRow(row) {
  return {
    timestamp: row[0] instanceof Date ? row[0].toISOString() : String(row[0] || ""),
    name: String(row[1] || ""),
    message: String(row[2] || ""),
    id: String(row[3] || ""),
    parent_id: String(row[4] || ""),
    season_tag: String(row[5] || ""),
    pinned_at: row[6] instanceof Date ? row[6].toISOString() : String(row[6] || ""),
    reactions: parseJson(row[7], {}),
    edited_at: row[8] instanceof Date ? row[8].toISOString() : String(row[8] || ""),
    deleted: String(row[9] || "") === "true",
    attachments: parseJson(row[10], []),
  };
}

function parseJson(val, fallback) {
  if (!val) return fallback;
  try { return JSON.parse(String(val)); } catch (e) { return fallback; }
}

function listMemos() {
  const s = sheet();
  const last = s.getLastRow();
  if (last < 2) return [];
  const rows = s.getRange(2, 1, last - 1, 11).getValues();
  return rows
    .map(readRow)
    .filter(m => m.id && !m.deleted)
    .sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
}

function findRowById(id) {
  const s = sheet();
  const last = s.getLastRow();
  if (last < 2) return { row: -1, sheet: s };
  const ids = s.getRange(2, 4, last - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === id) return { row: i + 2, sheet: s };
  }
  return { row: -1, sheet: s };
}

function createMemo(body) {
  const name = String(body.name || "").trim();
  const message = String(body.message || "").trim();
  const parent_id = String(body.parent_id || "").trim();
  const season_tag = String(body.season_tag || "").trim();
  const attachments = Array.isArray(body.attachments) ? body.attachments : [];

  if (!name) return { ok: false, error: "name required" };
  if (!message && attachments.length === 0) return { ok: false, error: "message or attachment required" };
  if (message.length > 4000) return { ok: false, error: "message too long" };

  const id = Utilities.getUuid();
  const now = new Date();
  sheet().appendRow([now, name, message, id, parent_id, season_tag, "", JSON.stringify({}), "", "", JSON.stringify(attachments)]);
  return { ok: true, id: id };
}

function editMemo(body) {
  const id = String(body.id || "").trim();
  const name = String(body.name || "").trim();
  const message = String(body.message || "").trim();
  if (!id || !name || !message) return { ok: false, error: "id, name, message required" };
  if (message.length > 4000) return { ok: false, error: "message too long" };

  const { row, sheet: s } = findRowById(id);
  if (row < 0) return { ok: false, error: "not found" };
  const ownerName = String(s.getRange(row, 2).getValue());
  if (ownerName !== name) return { ok: false, error: "unauthorized" };

  s.getRange(row, 3).setValue(message);
  s.getRange(row, 9).setValue(new Date());
  return { ok: true };
}

function deleteOwn(body) {
  const id = String(body.id || "").trim();
  const name = String(body.name || "").trim();
  const admin_secret = String(body.admin_secret || "");
  if (!id) return { ok: false, error: "id required" };

  const { row, sheet: s } = findRowById(id);
  if (row < 0) return { ok: false, error: "not found" };
  const ownerName = String(s.getRange(row, 2).getValue());

  const isAdmin = admin_secret && admin_secret === PropertiesService.getScriptProperties().getProperty("ADMIN_SECRET");
  if (!isAdmin && ownerName !== name) return { ok: false, error: "unauthorized" };

  s.getRange(row, 10).setValue("true");
  return { ok: true };
}

function toggleReaction(body) {
  const id = String(body.id || "").trim();
  const name = String(body.name || "").trim();
  const emoji = String(body.emoji || "").trim();
  if (!id || !name || !emoji) return { ok: false, error: "id, name, emoji required" };

  const { row, sheet: s } = findRowById(id);
  if (row < 0) return { ok: false, error: "not found" };
  const reactions = parseJson(s.getRange(row, 8).getValue(), {});
  const users = reactions[emoji] || [];
  const idx = users.indexOf(name);
  if (idx >= 0) users.splice(idx, 1);
  else users.push(name);
  if (users.length === 0) delete reactions[emoji];
  else reactions[emoji] = users;
  s.getRange(row, 8).setValue(JSON.stringify(reactions));
  return { ok: true, reactions: reactions };
}

function togglePin(body) {
  const id = String(body.id || "").trim();
  const admin_secret = String(body.admin_secret || "");
  const expected = PropertiesService.getScriptProperties().getProperty("ADMIN_SECRET");
  if (!expected || admin_secret !== expected) return { ok: false, error: "unauthorized" };
  if (!id) return { ok: false, error: "id required" };

  const { row, sheet: s } = findRowById(id);
  if (row < 0) return { ok: false, error: "not found" };
  const current = s.getRange(row, 7).getValue();
  if (current) s.getRange(row, 7).setValue("");
  else s.getRange(row, 7).setValue(new Date());
  return { ok: true };
}

function uploadImage(body) {
  const name = String(body.name || "").trim();
  const filename = String(body.filename || "image.png").trim();
  const dataBase64 = String(body.data_base64 || "").trim();
  const mime = String(body.mime || "image/png").trim();
  if (!name) return { ok: false, error: "name required" };
  if (!dataBase64) return { ok: false, error: "data_base64 required" };

  const folderId = PropertiesService.getScriptProperties().getProperty("IMAGE_DRIVE_FOLDER_ID");
  if (!folderId) return { ok: false, error: "IMAGE_DRIVE_FOLDER_ID not set" };

  const bytes = Utilities.base64Decode(dataBase64);
  const blob = Utilities.newBlob(bytes, mime, filename);
  const folder = DriveApp.getFolderById(folderId);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  const url = "https://drive.google.com/uc?export=view&id=" + file.getId();
  return { ok: true, url: url, file_id: file.getId() };
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
