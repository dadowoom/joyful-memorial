import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  BookOpenText,
  HandHeart,
  Mail,
  PenLine,
  Search,
  Sprout,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

const serifStyle = { fontFamily: "'Noto Serif KR', serif" } as const;
const ink = "#29251d";
const muted = "#6f675b";
const olive = "#7a835f";
const line = "#e8decd";
const ivory = "#fffdf8";
const sand = "#f8f1e6";
const gold = "#b08a4b";

const VALUES = [
  {
    title: "기쁨",
    desc: "부모님이 남긴 웃음과 다정한 순간이 가족 안에서 오래 이어지도록 기록합니다.",
  },
  {
    title: "감사",
    desc: "함께 지낸 시간과 고마웠던 마음을 정리해 다음 세대가 다시 읽을 수 있게 합니다.",
  },
  {
    title: "삶의 이야기",
    desc: "사진, 영상, 책장과 연표를 통해 한 사람의 인생을 차분히 엮습니다.",
  },
  {
    title: "가족",
    desc: "가족과 가까운 사람들이 마음을 남기며 한 사람의 삶을 함께 완성해갑니다.",
  },
];

const SERVICES = [
  {
    title: "기념관 찾기",
    desc: "성함으로 등록된 인생기념관을 찾고, 비공개 공간은 비밀번호 확인 후 입장합니다.",
    icon: Search,
    href: "/memorial-garden#faith-memorials",
  },
  {
    title: "인생기념관 만들기",
    desc: "회원가입 또는 로그인 후 기본 정보, 삶의 이야기, 책장 페이지, 사진을 등록합니다.",
    icon: PenLine,
    href: "/memorial/create",
  },
  {
    title: "감사글과 마음글",
    desc: "인생기념관에는 감사글을, 추모 기록 전환 이후에는 가족의 마음글을 남깁니다.",
    icon: Mail,
    href: "/letters",
  },
];

const PROCESS = [
  "인물의 기본 정보와 대표 문장을 입력합니다.",
  "삶의 이야기, 사진, 연표를 차분히 정리합니다.",
  "공개 범위와 비밀번호를 설정한 뒤 바로 인생기념관을 공개합니다.",
];

function formatDate(value: Date | string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}.${String(date.getDate()).padStart(2, "0")}`;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const lettersQuery = trpc.letter.recent.useQuery({ limit: 3 });
  const letters = useMemo(() => lettersQuery.data ?? [], [lettersQuery.data]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const keyword = search.trim();
    if (!keyword) {
      setLocation("/memorial-garden#faith-memorials");
      return;
    }
    setLocation(`/memorial/search?q=${encodeURIComponent(keyword)}`);
  };

  return (
    <div className="min-h-screen bg-white" style={{ color: ink }}>
      <Navbar />

      <main className="pt-16">
        <section
          className="relative min-h-[calc(90svh-4rem)] overflow-hidden border-b"
          style={{ borderColor: line, background: ivory }}
        >
          <div className="absolute inset-0 md:left-[42%]">
            <img
              src="/joyful-memorial-hero.png"
              alt=""
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-white/12" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#fffdf8] via-[#fffdf8]/84 to-[#fffdf8]/10" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-[#fffdf8]/66" />
          </div>

          <div className="container relative z-10 flex min-h-[calc(90svh-4rem)] flex-col justify-center py-12 md:py-20">
            <div className="max-w-2xl">
              <p
                className="text-[11px] font-medium uppercase"
                style={{ letterSpacing: "0.18em", color: olive }}
              >
                기쁨이 있는 곳
              </p>
              <h1
                className="mt-6 text-5xl font-normal leading-[1.12] sm:text-6xl md:text-7xl"
                style={serifStyle}
              >
                기쁨이 있는 곳
                <br />
                인생기념관
              </h1>
              <p
                className="mt-7 max-w-xl text-base leading-8 md:text-lg"
                style={{ color: muted }}
              >
                부모님의 인생과 가족의 기억을 밝은 인생기념관으로 남깁니다.
                사진, 영상, 글을 통해 평범하지만 소중했던 시간을 오래
                보관합니다.
              </p>

              <form
                onSubmit={submitSearch}
                className="mt-10 max-w-xl rounded-[8px] border bg-white/92 shadow-[0_18px_45px_rgba(75,66,52,0.08)] backdrop-blur"
                style={{ borderColor: line }}
              >
                <label className="flex min-h-16 items-center gap-3 px-4">
                  <Search
                    className="h-5 w-5 shrink-0"
                    style={{ color: olive }}
                    strokeWidth={1.6}
                  />
                  <input
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[#9c968b]"
                    placeholder="성함으로 인생기념관 찾기"
                  />
                  <button
                    type="submit"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium text-white"
                    style={{ background: ink }}
                  >
                    검색
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </label>
              </form>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Link href="/memorial/create">
                  <button
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium text-white"
                    style={{ background: olive }}
                  >
                    <PenLine className="h-4 w-4" />
                    인생기념관 만들기
                  </button>
                </Link>
                <Link href="/letters">
                  <button
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full border bg-white/92 px-5 text-sm font-medium"
                    style={{ borderColor: line, color: ink }}
                  >
                    <Mail className="h-4 w-4" />
                    가족의 마음글
                  </button>
                </Link>
              </div>

              <div
                className="mt-8 grid max-w-2xl gap-px overflow-hidden rounded-[8px] border bg-[#e8decd] sm:grid-cols-3"
                style={{ borderColor: line }}
              >
                {["사진첩", "영상 기록", "책장과 연표"].map(item => (
                  <div key={item} className="bg-white/86 px-4 py-3">
                    <p className="text-sm font-medium" style={{ color: ink }}>
                      {item}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: muted }}>
                      인생기념관 안에서 보관
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b bg-white" style={{ borderColor: line }}>
          <div className="container py-14 md:py-20">
            <div className="grid gap-10 md:grid-cols-[260px_minmax(0,1fr)]">
              <div>
                <p
                  className="text-[11px] font-medium uppercase"
                  style={{ letterSpacing: "0.18em", color: gold }}
                >
                  Memorial Hall
                </p>
                <h2
                  className="mt-4 text-3xl font-normal leading-tight md:text-5xl"
                  style={serifStyle}
                >
                  인생기념관에서
                  <br />
                  기억이 이어집니다
                </h2>
              </div>

              <div
                className="grid gap-px overflow-hidden rounded-[8px] border md:grid-cols-3"
                style={{ background: line }}
              >
                {SERVICES.map(service => {
                  const Icon = service.icon;
                  return (
                    <Link key={service.title} href={service.href}>
                      <article className="h-full bg-white p-6 transition-colors hover:bg-[#fffdf8]">
                        <div className="mb-12 flex items-center justify-between">
                          <Icon
                            className="h-5 w-5"
                            style={{ color: olive }}
                            strokeWidth={1.6}
                          />
                          <ArrowRight
                            className="h-4 w-4"
                            style={{ color: gold }}
                            strokeWidth={1.6}
                          />
                        </div>
                        <h3 className="text-xl font-normal" style={serifStyle}>
                          {service.title}
                        </h3>
                        <p
                          className="mt-4 text-sm leading-7"
                          style={{ color: muted }}
                        >
                          {service.desc}
                        </p>
                      </article>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section
          className="border-b"
          style={{ borderColor: line, background: sand }}
        >
          <div className="container py-14 md:py-20">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
              <div>
                <p
                  className="text-[11px] font-medium uppercase"
                  style={{ letterSpacing: "0.18em", color: olive }}
                >
                  Values
                </p>
                <h2
                  className="mt-4 text-3xl font-normal leading-tight md:text-5xl"
                  style={serifStyle}
                >
                  밝고 따뜻한
                  <br />
                  인생기념관
                </h2>
                <p
                  className="mt-6 max-w-md text-sm leading-7"
                  style={{ color: muted }}
                >
                  기쁨이 있는 곳 인생기념관은 과한 장식보다 여백을, 무거움보다
                  감사와 삶의 이야기를 선택합니다.
                </p>
              </div>

              <div className="border-t" style={{ borderColor: line }}>
                {VALUES.map((value, index) => (
                  <article
                    key={value.title}
                    className="grid gap-5 border-b py-6 md:grid-cols-[88px_160px_minmax(0,1fr)]"
                    style={{ borderColor: line }}
                  >
                    <span className="text-sm" style={{ color: gold }}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-xl font-normal" style={serifStyle}>
                      {value.title}
                    </h3>
                    <p className="text-sm leading-7" style={{ color: muted }}>
                      {value.desc}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b bg-white" style={{ borderColor: line }}>
          <div className="container grid gap-10 py-14 md:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)] md:py-20">
            <div>
              <p
                className="text-[11px] font-medium uppercase"
                style={{ letterSpacing: "0.18em", color: gold }}
              >
                Process
              </p>
              <h2
                className="mt-4 text-3xl font-normal leading-tight md:text-5xl"
                style={serifStyle}
              >
                만들고,
                <br />
                인생기념관으로 공개합니다
              </h2>
            </div>
            <div className="border-t" style={{ borderColor: line }}>
              {PROCESS.map((item, index) => (
                <div
                  key={item}
                  className="grid gap-4 border-b py-6 sm:grid-cols-[72px_minmax(0,1fr)]"
                  style={{ borderColor: line }}
                >
                  <span className="text-sm" style={{ color: olive }}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="text-base leading-8" style={{ color: ink }}>
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="container py-14 md:py-20">
            <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p
                  className="text-[11px] font-medium uppercase"
                  style={{ letterSpacing: "0.18em", color: olive }}
                >
                  Family Notes
                </p>
                <h2
                  className="mt-4 text-3xl font-normal leading-tight md:text-5xl"
                  style={serifStyle}
                >
                  가족의 마음글
                </h2>
              </div>
              <Link href="/letters">
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border px-4 text-sm font-medium"
                  style={{ borderColor: line, color: ink }}
                >
                  마음글 보기
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>

            <div
              className="grid gap-px md:grid-cols-3"
              style={{ background: line }}
            >
              {lettersQuery.isLoading ? (
                <LetterState text="마음글을 불러오고 있습니다." />
              ) : letters.length === 0 ? (
                <LetterState text="아직 남겨진 마음글이 없습니다." />
              ) : (
                letters.map(letter => (
                  <Link
                    key={letter.id}
                    href={letter.memorialHref || "/letters"}
                  >
                    <article className="h-full min-h-56 bg-white p-6 transition-colors hover:bg-[#fbfaf6]">
                      <div className="mb-8 flex items-center justify-between gap-4">
                        <p className="text-sm" style={{ color: olive }}>
                          {letter.memorialName || "마음"}
                        </p>
                        <p className="text-xs" style={{ color: muted }}>
                          {formatDate(letter.createdAt)}
                        </p>
                      </div>
                      <p
                        className="line-clamp-4 text-sm leading-7"
                        style={{ color: ink }}
                      >
                        {letter.content}
                      </p>
                      <p className="mt-6 text-sm" style={{ color: gold }}>
                        {letter.author}
                      </p>
                    </article>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>

        <section
          className="border-t"
          style={{ borderColor: line, background: ivory }}
        >
          <div className="container grid gap-8 py-12 md:grid-cols-[1fr_auto] md:items-center">
            <div className="flex items-start gap-4">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                style={{ background: "#eef0e4", color: olive }}
              >
                <Sprout className="h-5 w-5" strokeWidth={1.7} />
              </span>
              <div>
                <h2
                  className="text-2xl font-normal md:text-3xl"
                  style={serifStyle}
                >
                  기쁨의 기록을 오늘 남겨보세요.
                </h2>
                <p
                  className="mt-3 max-w-2xl text-sm leading-7"
                  style={{ color: muted }}
                >
                  인생기념관은 생성 후 바로 공개되며, 이후 사진첩, 영상 기록,
                  책장과 연표를 계속 보완할 수 있습니다.
                </p>
              </div>
            </div>
            <Link href="/memorial/create">
              <button
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium text-white"
                style={{ background: ink }}
              >
                <BookOpenText className="h-4 w-4" />
                인생기념관 만들기
              </button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function LetterState({ text }: { text: string }) {
  return (
    <div className="bg-white p-8 md:col-span-3">
      <div className="flex min-h-32 items-center justify-center gap-3 text-sm text-[#686257]">
        <HandHeart className="h-4 w-4" strokeWidth={1.7} />
        {text}
      </div>
    </div>
  );
}
