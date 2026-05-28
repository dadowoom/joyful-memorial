# 기쁨의 기억

기쁨이 있는교회 디지털추모관 새 프로젝트입니다. 기존 소망교회 운영 레포와 DB를 덮어쓰지 않도록 별도 폴더, 별도 환경변수, 별도 배포 단위를 기준으로 구성했습니다.

## 방향

- 밝지만 경건한 추모관
- 흰색 기반, 절제된 아이보리/연한 골드/올리브/샌드 톤
- 기억, 감사, 위로, 공동체, 부활의 기쁨
- 카드 남발과 과한 장식을 피한 단순한 화면 구조

## 실행

```bash
npm install
cp .env.example .env
npm run dev
```

DB가 준비된 뒤:

```bash
npm run db:push
npm run db:seed
```

`SAMPLE_FAMILY_ROOM_PASSWORD`를 설정하면 샘플 인물의 가족관도 함께 생성됩니다.

## 주요 경로

- `/` 메인
- `/memorial/search` 추모관 검색
- `/memorial/create` 추모관 생성
- `/memorial/:slug` 개인 추모관
- `/memorial/:slug/archive` 기념관 자세히 보기
- `/memorial/:slug/family` 가족관
- `/letters` 하늘로 보내는 편지
- `/kiosk` 키오스크 검색
- `/kiosk/memorial/:slug` 키오스크 전용 상세
