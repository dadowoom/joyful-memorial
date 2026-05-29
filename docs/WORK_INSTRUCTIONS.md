# 기쁨이 있는 곳 인생기념관 작업 지시문

이 문서는 다른 컴퓨터, 다른 작업자, 또는 다음 Codex 세션에서 바로 이어서 작업하기 위한 인수인계 문서입니다.

## 1. 프로젝트 기준

- GitHub 저장소: `dadowoom/joyful-memorial`
- 서비스명: `기쁨이 있는 곳 인생기념관`
- 운영 URL: `http://115.68.224.123:3070/`
- 운영 PM2 프로세스명: `joyful-memorial`
- 운영 배포 단위: 기존 `somang-memorial`, `hanyeong-memorial`과 완전히 분리
- 현재 핵심 컨셉: 일반인도 쉽게 들어와 부모님의 인생, 가족의 기억, 사진, 영상, 글을 남기는 밝고 따뜻한 인생기념관

## 2. 절대 금지

- `dadowoom/somang-memorial`, `dadowoom/hanyeong-memorial` 저장소를 수정하지 않는다.
- 소망교회/한영교회 운영 DB, 서버 경로, PM2 프로세스를 건드리지 않는다.
- `.env`, 서버 비밀번호, DB 비밀번호, 토큰, 인증키를 커밋하지 않는다.
- 서버/DB 접속 정보는 코드, 문서, README, 이슈, 커밋 메시지에 적지 않는다.
- 기쁨 프로젝트를 소망/한영 사이트 이름만 바꾼 복붙처럼 만들지 않는다.

## 3. 로컬 개발 시작

```bash
git clone git@github.com:dadowoom/joyful-memorial.git
cd joyful-memorial
pnpm install --frozen-lockfile
cp .env.example .env
```

`.env`는 실제 환경에 맞게 채운다. 아래 값들은 반드시 로컬 또는 서버 환경변수로만 관리한다.

```bash
NODE_ENV=development
DATABASE_URL=mysql://...
JWT_SECRET=...
UPLOAD_DIR=./uploads
OAUTH_SERVER_URL=...
VITE_APP_ID=joyful-memorial
SAMPLE_FAMILY_ROOM_PASSWORD=
```

DB 준비 후:

```bash
pnpm run db:push
pnpm run db:seed
pnpm dev
```

기본 개발 서버는 `PORT`가 없으면 `3000`을 사용한다. 포트가 바쁘면 앱이 가능한 포트를 찾아서 실행한다.

## 4. 필수 검증 명령

작업 전후로 아래 명령을 기준으로 확인한다.

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
```

운영 반영 전에는 최소 `pnpm check`, `pnpm test`, `pnpm build`를 통과시킨다.

## 5. 주요 기능 기준

### 회원/마이페이지

- 회원가입/로그인 가능
- 회원가입 후 `/memorial/create`로 자연스럽게 이동
- `/mypage`에서 내가 만든 기념관 확인
- 마이페이지에서 기본 정보 수정, 삭제, 입장 비밀번호 변경, 가족관 비밀번호 변경 가능

### 인생기념관 생성

- 로그인한 사용자만 생성 가능
- 기본 정보, 삶의 이야기, 생애 기록, 대표 사진, 활동 사진, 공개 설정 입력
- 기본 기록 타입은 `faith`, 즉 살아계신 분 또는 일반 가족 기록용 인생기념관
- 생성 후 별도 관리자 승인 없이 바로 공개
- 공개 인생기념관 생성 후 기본 이동 경로는 `/memorial/{slug}/archive`

### 인생기념관 상세

- 밝고 따뜻한 컬러 사진 중심
- 흑백 필터를 기본으로 쓰지 않는다.
- 인생기념관에는 소천일, 추도일, 하늘로 보내는 편지 같은 문구를 노출하지 않는다.
- 댓글/메시지는 `감사글` 또는 일반 가족 메시지 톤으로 유지한다.
- 소유자 또는 관리자는 인라인 편집, 사진첩, 영상, 책장/연표를 관리할 수 있다.

### 추모 기록

- `recordType === "memorial"`이거나 `deathDate`가 있는 경우만 차분한 추모 톤으로 분리한다.
- 추모 기록에서는 별세일, 기일, 추모성 문구를 사용할 수 있다.
- 인생기념관과 추모 기록의 문구가 섞이지 않도록 주의한다.

### 사진첩

- 여러 장 업로드
- 이미지 압축
- 목록 표시
- 크게 보기
- 설명/연도 수정
- 삭제
- 순서 변경
- 대표사진 지정
- 인생기념관에서는 컬러 톤 유지

### 영상

- 유튜브 링크 등록
- 유튜브 ID 자동 추출
- 영상 목록 표시
- 제목/설명 수정
- 숨김/노출
- 삭제
- 순서 관리

### 책장/연표

- 책 형태 보기와 연표 보기를 모두 제공
- 관리자는 `책 만들기` 후 `글/사진 페이지 추가`로 쉽게 기록 추가
- 페이지에는 제목, 본문, 날짜, 사진을 넣는다.
- 글과 사진을 넣으면 책 모양과 연표에 같이 반영된다.
- 사용자에게 어려운 관리자 용어보다 가족이 바로 이해하는 문구를 사용한다.

### 가족관

- 공개 인생기념관과 분리된 가족 전용 공간
- 가족관 비밀번호 입력 후 입장
- 현재는 비밀번호와 기본 소개 중심
- 추후 가족 기록 확장 가능하게 구조 유지

## 6. 디자인 방향

- 첫 인상은 `밝지만 가볍지 않은 가족 인생기록관`
- 교회/종교 색채는 전면에 드러내지 않는다.
- 일반인도 자기 부모님의 인생을 남기기 쉽게 느껴야 한다.
- 화려한 마케팅 페이지보다 실제 사용 가능한 서비스 화면을 우선한다.
- 흰색 기반에 산뜻한 그린, 따뜻한 옐로우, 부드러운 코랄/골드 포인트를 절제해서 쓴다.
- 과한 그라데이션, 장식, 카드 남발, 어둡고 중후한 복제 톤을 피한다.
- 카드 목록은 가능하지만 페이지 전체를 카드 더미처럼 만들지 않는다.
- 모바일에서 메뉴, CTA, 입력 폼이 겹치지 않게 확인한다.

## 7. 현재 샘플 데이터

샘플 인물:

- 이름: `정기쁨`
- 슬러그: `jung-gippeum-mother`
- 샘플 경로: `/memorial/jung-gippeum-mother/archive`

시드 실행:

```bash
pnpm run db:seed
```

샘플은 실제 운영 데이터가 아니라 UI/기능 확인용이다. 시드에는 가족사진, 포항 관련 사진, 활동 사진, 책장 페이지, 샘플 메시지가 포함된다.

## 8. 운영 배포 절차

운영 배포는 반드시 별도 승인 후 진행한다. 서버 접속 정보는 문서에 적지 않고 안전한 채널로만 전달받는다.

일반적인 서버 반영 흐름:

```bash
cd /var/www/joyful-memorial/current
git fetch origin main
git reset --hard origin/main
pnpm install --frozen-lockfile
pnpm run db:push
pnpm run db:seed
pnpm build
pm2 restart joyful-memorial --update-env
```

현재 서버는 릴리즈 디렉터리 방식으로도 운영될 수 있다. 이 경우 새 릴리즈 경로에 코드를 풀고 기존 `.env`를 복사한 뒤 빌드하고, PM2가 새 릴리즈의 `dist/index.js`를 바라보게 한다.

배포 후 확인:

```bash
curl -sS -o /dev/null -w "ROOT:%{http_code}\n" http://115.68.224.123:3070/
curl -sS -o /dev/null -w "GARDEN:%{http_code}\n" http://115.68.224.123:3070/memorial-garden
curl -sS -o /dev/null -w "CREATE:%{http_code}\n" http://115.68.224.123:3070/memorial/create
curl -sS -o /dev/null -w "LOGIN:%{http_code}\n" "http://115.68.224.123:3070/login?redirect=%2Fmemorial%2Fcreate"
curl -sS -o /dev/null -w "MYPAGE:%{http_code}\n" http://115.68.224.123:3070/mypage
```

## 9. 실사용 테스트 체크리스트

운영 또는 스테이징에서 임시 계정으로 아래를 확인한다.

```text
[ ] 회원가입
[ ] 로그인
[ ] 회원가입 후 기념관 만들기 화면 이동
[ ] 인물 기본 정보 등록
[ ] 대표 사진 업로드
[ ] 활동 사진 여러 장 업로드
[ ] 생성 후 공개 인생기념관 바로 접근
[ ] 사진이 컬러로 표시
[ ] 마이페이지 진입
[ ] 기본 정보 수정
[ ] 사진 설명/연도 수정
[ ] 대표사진 변경
[ ] 사진 삭제
[ ] 유튜브 영상 등록
[ ] 영상 제목 수정
[ ] 영상 숨김/노출
[ ] 책 만들기
[ ] 글/사진 페이지 추가
[ ] 책 모양 보기 확인
[ ] 연표 보기 확인
[ ] 입장 비밀번호 변경
[ ] 가족관 비밀번호 변경
[ ] 비공개 전환 후 소유자 접근 확인
[ ] 기념관 삭제
[ ] 모바일 화면 확인
```

## 10. 다음 고도화 후보

- 책장 페이지 편집 UX를 더 쉽게 개선: 사진 드래그앤드롭, 자동 저장, 미리보기 강화
- 마이페이지에서 사진/영상/책장 관리 바로가기 강화
- 가족관 내부 기록 확장: 가족 전용 사진, 비공개 메모, 가족 연표
- 기념관 생성 폼 단계형 개선
- 이미지 업로드 용량/실패 메시지 개선
- 운영 로그/에러 모니터링 정리
- OG 이미지 미리보기 QA
- 관리자 화면 검색/필터/상태 변경 고도화

## 11. Codex에게 줄 작업 프롬프트 예시

다음 작업자가 Codex를 쓸 때 아래 프롬프트를 그대로 붙여도 된다.

```text
이 저장소는 dadowoom/joyful-memorial, 서비스명은 "기쁨이 있는 곳 인생기념관"이다.

기존 dadowoom/somang-memorial, dadowoom/hanyeong-memorial은 절대 건드리지 않는다.
이 프로젝트는 일반인도 부모님의 인생과 가족 기록을 남길 수 있는 밝고 따뜻한 인생기념관이다.
종교색은 전면에 내세우지 말고, 인생기념관에서는 컬러 사진과 감사/가족/삶의 이야기 중심을 유지한다.
추모 기록으로 전환된 화면에서만 차분한 추모 톤과 별세/기일 문구를 사용한다.

작업 전:
git status
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build

작업 중:
- .env, 비밀번호, 토큰, DB 접속정보를 커밋하지 않는다.
- 기존 기능 구조를 먼저 읽고, 필요한 파일만 좁게 수정한다.
- 모바일 화면을 우선 확인한다.
- 인생기념관 사진은 흑백 처리하지 않는다.
- 책장/연표는 가족이 쉽게 글 쓰고 사진 올리면 책 모양으로 보이는 방향을 유지한다.

작업 후:
pnpm check
pnpm test
pnpm build
git status
git add <변경 파일만>
git commit -m "<작업 내용>"
git push origin main

배포는 사용자가 별도 승인할 때만 진행한다.
```
