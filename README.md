# 정동401프로젝트

HFK 멤버 대상 PBL(Project-based Learning) 프로그램 기수별 활동 대시보드.

- **6기 대시보드**: https://thehfk.github.io/hfk-jeongdong401/6기/
- **랜딩**: https://thehfk.github.io/hfk-jeongdong401/

## 구조

```
hfk-jeongdong401/
├── index.html            # 기수 아카이브 랜딩
├── 6기/
│   ├── index.html        # 6기 대시보드 (멤버·계절·아이디어·칠판·회의록)
│   └── 회의록/
│       └── 1차_타운홀.md
└── apps-script/
    ├── jd401-board.gs    # 칠판(게시판) 백엔드 코드
    └── SETUP.md          # 배포 가이드
```

## 칠판(게시판) 백엔드

Google Sheets + Apps Script. 세팅은 [apps-script/SETUP.md](apps-script/SETUP.md) 참고.
