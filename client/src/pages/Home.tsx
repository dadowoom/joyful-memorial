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
const muted = "#686257";
const olive = "#6f7658";
const line = "#ded7c8";
const ivory = "#fbfaf6";
const sand = "#f2eee4";
const gold = "#a6844b";

const VALUES = [
  {
    title: "기억",
    desc: "이름과 사진 너머에 남아 있는 삶의 결, 신앙의 고백, 가족의 목소리를 차분히 보존합니다.",
  },
  {
    title: "감사",
    desc: "함께 예배하고 섬겼던 시간을 감사의 언어로 정리해 다음 세대가 다시 읽을 수 있게 합니다.",
  },
  {
    title: "위로",
    desc: "찾아오는 이들이 슬픔에 머물지 않고 공동체의 기도와 따뜻한 말을 만날 수 있도록 돕습니다.",
  },
  {
    title: "부활의 기쁨",
    desc: "작별의 무게를 가볍게 만들지 않으면서도, 믿음 안의 약속과 다시 만날 기쁨을 조용히 담습니다.",
  },
];

const SERVICES = [
  {
    title: "추모관 검색",
    desc: "성함으로 등록된 추모관을 찾고, 비공개 추모관은 비밀번호 확인 후 입장합니다.",
    icon: Search,
    href: "/memorial/search",
  },
  {
    title: "추모관 만들기",
    desc: "회원가입 또는 로그인 후 기본 정보, 신앙 이야기, 생애 기록, 사진을 등록합니다.",
    icon: PenLine,
    href: "/memorial/create",
  },
  {
    title: "하늘로 보내는 편지",
    desc: "각 추모관에 남긴 편지와 메인에서 직접 쓴 편지가 한 흐름으로 모입니다.",
    icon: Mail,
    href: "/letters",
  },
];

const PROCESS = [
  "고인의 기본 정보와 대표 말씀을 입력합니다.",
  "삶과 신앙 이야기, 사진, 연표를 차분히 정리합니다.",
  "공개 범위와 비밀번호를 설정한 뒤 바로 추모관을 공개합니다.",
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
      setLocation("/memorial/search");
      return;
    }
    setLocation(`/memorial/search?q=${encodeURIComponent(keyword)}`);
  };

  return (
    <div className="min-h-screen bg-white" style={{ color: ink }}>
      <Navbar />

      <main className="pt-16">
        <section
          className="relative min-h-[calc(100svh-4rem)] overflow-hidden border-b"
          style={{ borderColor: line, background: ivory }}
        >
          <div className="absolute inset-0 md:left-[42%]">
            <img
              src="/joyful-memorial-hero.png"
              alt=""
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-white/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#fbfaf6] via-[#fbfaf6]/88 to-[#fbfaf6]/12" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/12 via-transparent to-[#fbfaf6]/72" />
          </div>

          <div className="container relative z-10 flex min-h-[calc(100svh-4rem)] flex-col justify-center py-12 md:py-20">
            <div className="max-w-2xl">
              <p
                className="text-[11px] font-medium uppercase"
                style={{ letterSpacing: "0.18em", color: olive }}
              >
                기쁨이 있는교회 디지털추모관
              </p>
              <h1
                className="mt-6 text-5xl font-normal leading-[1.12] sm:text-6xl md:text-7xl"
                style={serifStyle}
              >
                기쁨의 기억
              </h1>
              <p
                className="mt-7 max-w-xl text-base leading-8 md:text-lg"
                style={{ color: muted }}
              >
                삶의 마지막 장면만이 아니라, 하나님 앞에서 살아온 감사와 사랑의
                흔적을 가족과 공동체가 함께 기억하는 밝고 경건한 추모
                공간입니다.
              </p>

              <form
                onSubmit={submitSearch}
                className="mt-10 max-w-xl border bg-white/88 backdrop-blur"
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
                    placeholder="고인 성함으로 추모관 검색"
                  />
                  <button
                    type="submit"
                    className="inline-flex h-10 items-center justify-center gap-2 px-4 text-sm font-medium text-white"
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
                    className="inline-flex h-12 items-center justify-center gap-2 px-5 text-sm font-medium text-white"
                    style={{ background: olive }}
                  >
                    <PenLine className="h-4 w-4" />
                    추모관 만들기
                  </button>
                </Link>
                <Link href="/letters">
                  <button
                    className="inline-flex h-12 items-center justify-center gap-2 border bg-white px-5 text-sm font-medium"
                    style={{ borderColor: line, color: ink }}
                  >
                    <Mail className="h-4 w-4" />
                    하늘로 보내는 편지
                  </button>
                </Link>
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
                  Memorial Guide
                </p>
                <h2
                  className="mt-4 text-3xl font-normal leading-tight md:text-5xl"
                  style={serifStyle}
                >
                  기억은 조용히,
                  <br />
                  위로는 따뜻하게
                </h2>
              </div>

              <div
                className="grid gap-px md:grid-cols-3"
                style={{ background: line }}
              >
                {SERVICES.map(service => {
                  const Icon = service.icon;
                  return (
                    <Link key={service.title} href={service.href}>
                      <article className="h-full bg-white p-6 transition-colors hover:bg-[#fbfaf6]">
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
                  밝지만 경건한
                  <br />
                  디지털 추모관
                </h2>
                <p
                  className="mt-6 max-w-md text-sm leading-7"
                  style={{ color: muted }}
                >
                  기쁨이 있는교회 디지털추모관은 장식보다 여백을, 슬픔의
                  과장보다 믿음의 언어를 선택합니다.
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
                바로 공개합니다
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
                  Letters
                </p>
                <h2
                  className="mt-4 text-3xl font-normal leading-tight md:text-5xl"
                  style={serifStyle}
                >
                  하늘로 보내는 편지
                </h2>
              </div>
              <Link href="/letters">
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 border px-4 text-sm font-medium"
                  style={{ borderColor: line, color: ink }}
                >
                  전체 편지 보기
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>

            <div
              className="grid gap-px md:grid-cols-3"
              style={{ background: line }}
            >
              {lettersQuery.isLoading ? (
                <LetterState text="편지를 불러오고 있습니다." />
              ) : letters.length === 0 ? (
                <LetterState text="아직 남겨진 편지가 없습니다." />
              ) : (
                letters.map(letter => (
                  <Link
                    key={letter.id}
                    href={letter.memorialHref || "/letters"}
                  >
                    <article className="h-full min-h-56 bg-white p-6 transition-colors hover:bg-[#fbfaf6]">
                      <div className="mb-8 flex items-center justify-between gap-4">
                        <p className="text-sm" style={{ color: olive }}>
                          {letter.memorialName || "하늘"}
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
                  감사의 기억을 오늘 남겨보세요.
                </h2>
                <p
                  className="mt-3 max-w-2xl text-sm leading-7"
                  style={{ color: muted }}
                >
                  추모관은 생성 후 바로 공개되며, 이후 기념관에서 사진첩, 영상
                  기록, 책장과 연표를 계속 보완할 수 있습니다.
                </p>
              </div>
            </div>
            <Link href="/memorial/create">
              <button
                className="inline-flex h-12 items-center justify-center gap-2 px-5 text-sm font-medium text-white"
                style={{ background: ink }}
              >
                <BookOpenText className="h-4 w-4" />
                추모관 만들기
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
