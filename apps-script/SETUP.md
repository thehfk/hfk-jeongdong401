# 6기 칠판(게시판) 백엔드 세팅

Google Sheets + Apps Script로 구성됩니다. 재윤님이 한 번만 세팅하면 되고, 이후 시트에서 직접 수정·삭제 가능합니다.

## 1. Google Sheet 만들기

1. https://sheets.new 에서 새 시트 생성
2. 파일 이름: `정동401 6기 게시판`
3. 시트1 A1:D1에 헤더 입력: `timestamp | name | message | id`

## 2. Apps Script 붙이기

1. 시트에서 **확장 프로그램 → Apps Script** 열기
2. 프로젝트 이름: `정동401 게시판 API`
3. `Code.gs` 내용 전부 지우고 [jd401-board.gs](jd401-board.gs) 코드 붙여넣기
4. 저장 (Ctrl/Cmd+S)

## 3. 웹앱으로 배포

1. 우측 상단 **배포 → 새 배포**
2. 유형: **웹앱**
3. 설정:
   - 설명: `정동401 6기 게시판 v1`
   - 실행 계정: **본인**
   - 액세스 권한: **모든 사용자**(Anyone with the link)
4. **배포** 클릭 → 권한 승인
5. 발급된 **웹앱 URL** 복사 (예: `https://script.google.com/macros/s/AKfy.../exec`)

## 4. 대시보드에 URL 연결

[6기/index.html](../6기/index.html) 하단 스크립트 블록에서:

```javascript
const BOARD_API_URL = ""; // ← 여기에 웹앱 URL 붙여넣기
```

URL 붙여넣고 저장 → 커밋·푸시하면 GitHub Pages에 반영됩니다.

## 5. 관리자 삭제 기능 (선택)

시트에서 직접 행 삭제하면 됩니다. 별도 관리자 삭제 API가 필요하면 Apps Script의 **프로젝트 설정 → 스크립트 속성**에 `ADMIN_SECRET` 값 하나 추가 후 그 값으로 delete API 호출 가능합니다.

## 코드 업데이트 시

Apps Script 코드 수정 후에는 **배포 → 배포 관리 → 현재 배포 편집 → 새 버전 선택 → 배포**로 재배포해야 반영됩니다. URL은 유지됩니다.
