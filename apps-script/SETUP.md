# 6기 칠판(게시판) 백엔드 세팅

Google Sheets + Apps Script 기반. v2에서 답글·이모지 반응·핀·계절 태그·수정·삭제·마크다운·이미지 첨부 지원.

## 1. Google Sheet 세팅

기존 시트에 이어서 컬럼 확장:

| A | B | C | D | E | F | G | H | I | J | K |
|---|---|---|---|---|---|---|---|---|---|---|
| timestamp | name | message | id | parent_id | season_tag | pinned_at | reactions | edited_at | deleted | attachments |

기존 A~D 그대로 두고 **E1~K1**에 헤더만 채워 넣으면 됩니다. 기존 메모 데이터도 그대로 유지됩니다.

## 2. Apps Script 코드 갱신

1. Apps Script 프로젝트 열기 (기존 것 그대로)
2. 코드 전체 지우고 [jd401-board.gs](jd401-board.gs) v2 코드 붙여넣기
3. 저장

## 3. 스크립트 속성 추가

Apps Script 프로젝트 설정(왼쪽 톱니바퀴 아이콘) → **스크립트 속성** → 아래 두 개 추가:

- `ADMIN_SECRET` — 재윤님이 핀·관리자 삭제할 때 쓸 비밀번호 (예: `hfkjd401-{임의문자}`)
- `IMAGE_DRIVE_FOLDER_ID` — 이미지 업로드용 Google Drive 폴더 ID

### Drive 폴더 준비

1. https://drive.google.com 에서 새 폴더 생성 (예: `정동401 6기 게시판 이미지`)
2. 폴더 우클릭 → **공유** → 일반 액세스: **링크가 있는 모든 사용자** · 뷰어
3. 폴더 열고 URL에서 폴더 ID 추출 (예: `https://drive.google.com/drive/folders/1AbCd...` → `1AbCd...`)
4. 이 ID를 `IMAGE_DRIVE_FOLDER_ID`에 붙여넣기

## 4. 웹앱 재배포

1. **배포 → 배포 관리 → 현재 배포 편집**
2. **새 버전** 선택
3. **액세스**: 모든 사용자 유지
4. **배포**
5. URL은 그대로 유지됩니다 (프론트 수정 불필요)

## 5. 관리자 모드 사용법 (재윤님)

대시보드 칠판 우측 상단에 **관리자** 링크가 있습니다. 클릭 → `ADMIN_SECRET` 입력 → 메모마다 핀 버튼이 나타납니다. 브라우저에 저장되어 다음에도 유지됩니다.

## 액션 목록

- `list` — GET 또는 `{action:"list"}`
- `create` — `{name, message, parent_id?, season_tag?, attachments?}`
- `edit` — `{id, name, message}` (본인만)
- `delete_own` — `{id, name}` (본인만), 또는 `{id, admin_secret}` (관리자)
- `react` — `{id, name, emoji}` (토글)
- `pin` — `{id, admin_secret}` (토글, 관리자만)
- `upload_image` — `{name, filename, mime, data_base64}` → `{url}`
