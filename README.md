# 기쁨이 있는 곳 인생기념관

부모님의 인생과 가족의 기억을 사진, 글, 영상으로 남기는 새 프로젝트입니다. 기존 소망/한영 계열 운영 레포와 DB를 덮어쓰지 않도록 별도 폴더, 별도 환경변수, 별도 배포 단위를 기준으로 구성했습니다.

## 방향

- 밝고 따뜻한 인생기념관
- 흰색 기반, 절제된 아이보리/연한 골드/올리브/샌드 톤
- 기억, 감사, 가족, 위로, 기쁨
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
- `/memorial/search` 기념관 검색
- `/memorial/create` 인생기념관 생성
- `/memorial/:slug` 개인 추모 기록
- `/memorial/:slug/archive` 기념관 자세히 보기
- `/memorial/:slug/family` 가족관
- `/letters` 가족의 마음글
- `/kiosk` 키오스크 검색
- `/kiosk/memorial/:slug` 키오스크 전용 상세
