import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { toImgUrl } from "@/lib/imageUrl";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  BookOpenText,
  ChevronLeft,
  ChevronRight,
  HeartHandshake,
  Image,
  LockKeyhole,
  MessageCircle,
  Plus,
  Search,
  UserRound,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Link } from "wouter";

const PEOPLE_PAGE_SIZE = 12;
const serifStyle = { fontFamily: "'Noto Serif KR', serif" } as const;
const ink = "#243027";
const muted = "#687062";
const line = "#e7ddc8";
const ivory = "#fffdf7";
const green = "#6f8a58";
const yellow = "#d6a94b";
const coral = "#d8896f";

const FEATURES = [
  {
    title: "신앙의 이야기",
    desc: "현재의 삶과 섬김, 가족이 기억하는 감사의 고백을 한곳에 정리합니다.",
    icon: BookOpenText,
  },
  {
    title: "사진과 영상",
    desc: "컬러 사진과 영상 기록을 밝은 톤으로 보존하고, 필요할 때 계속 보완합니다.",
    icon: Image,
  },
  {
    title: "응원글",
    desc: "살아 있는 신앙기념관에는 편지 대신 응원과 감사의 마음을 남깁니다.",
    icon: MessageCircle,
  },
];

export default function MemorialGarden() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const memorialsQuery = trpc.memorial.list.useQuery();
  const memorials = memorialsQuery.data ?? [];

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return memorials;

    return memorials.filter(memorial =>
      [memorial.name, memorial.role, memorial.church, memorial.summary]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(keyword))
    );
  }, [memorials, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PEOPLE_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const people = filtered.slice(
    (currentPage - 1) * PEOPLE_PAGE_SIZE,
    currentPage * PEOPLE_PAGE_SIZE
  );

  return (
    <div className="min-h-screen bg-[#fffefa]" style={{ color: ink }}>
      <Navbar />

      <main className="pt-16">
        <section
          className="border-b"
          style={{
            borderColor: line,
            background:
              "linear-gradient(135deg, #fffefa 0%, #f7fbef 48%, #fff6ec 100%)",
          }}
        >
          <div className="container grid gap-10 py-12 md:grid-cols-[minmax(0,0.92fr)_minmax(320px,0.72fr)] md:items-center md:py-20">
            <div>
              <p
                className="text-[11px] font-semibold uppercase"
                style={{ letterSpacing: "0.18em", color: green }}
              >
                Faith Memorial Hall
              </p>
              <h1
                className="mt-5 text-5xl font-normal leading-[1.08] md:text-7xl"
                style={serifStyle}
              >
                기쁨이 있는 곳
                <br />
                신앙기념관
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-8" style={{ color: muted }}>
                살아계신 성도의 믿음과 섬김, 가족의 감사와 공동체의 응원을
                밝고 따뜻한 기록으로 이어가는 공간입니다.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="#faith-memorials">
                  <button
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold text-white"
                    style={{ background: green }}
                  >
                    <Search className="h-4 w-4" />
                    신앙기념관 찾기
                  </button>
                </a>
                <Link href="/memorial/create">
                  <button
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full border bg-white px-5 text-sm font-semibold"
                    style={{ borderColor: line, color: ink }}
                  >
                    <Plus className="h-4 w-4" />
                    신앙기념관 만들기
                  </button>
                </Link>
              </div>
            </div>

            <div
              className="rounded-[8px] border bg-white/82 p-6 shadow-[0_24px_70px_rgba(55,66,44,0.08)] backdrop-blur md:p-8"
              style={{ borderColor: line }}
            >
              <HeartHandshake className="h-8 w-8" style={{ color: coral }} />
              <p
                className="mt-7 text-2xl font-normal leading-10"
                style={serifStyle}
              >
                “기억을 넘어,
                <br />
                오늘의 믿음을 함께 응원합니다.”
              </p>
              <div className="mt-8 grid gap-px overflow-hidden rounded-[8px] bg-[#e7ddc8] sm:grid-cols-3">
                <InfoTile label="공개" value="검색 가능" />
                <InfoTile label="비공개" value="비밀번호" />
                <InfoTile label="가족관" value="별도 보호" />
              </div>
            </div>
          </div>
        </section>

        <section
          id="faith-memorials"
          className="scroll-mt-20 border-b bg-white py-14 md:py-20"
          style={{ borderColor: line }}
        >
          <div className="container">
            <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p
                  className="text-[11px] font-semibold uppercase"
                  style={{ letterSpacing: "0.18em", color: yellow }}
                >
                  Registered People
                </p>
                <h2
                  className="mt-4 text-3xl font-normal leading-tight md:text-5xl"
                  style={serifStyle}
                >
                  등록된 신앙기념관
                </h2>
              </div>
              <p className="max-w-md text-sm leading-7" style={{ color: muted }}>
                인물 카드를 통해 이름, 직분, 사진을 확인하고 각 신앙기념관으로
                바로 이동할 수 있습니다.
              </p>
            </div>

            <div className="mb-8 grid gap-3 md:grid-cols-[minmax(0,440px)_1fr] md:items-center">
              <label
                className="flex h-12 items-center gap-3 rounded-full border bg-white px-5"
                style={{ borderColor: line }}
              >
                <Search className="h-4 w-4 shrink-0" style={{ color: green }} />
                <input
                  value={query}
                  onChange={event => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder="이름, 직분, 교회로 검색"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#9c968b]"
                />
              </label>
              <p className="text-sm md:text-right" style={{ color: muted }}>
                등록 인물 {filtered.length}명 · 한 페이지 12명
              </p>
            </div>

            {memorialsQuery.isLoading ? (
              <StatePanel text="등록된 인물을 불러오고 있습니다." />
            ) : filtered.length === 0 ? (
              <StatePanel text={memorials.length ? "검색 결과가 없습니다." : "아직 공개된 신앙기념관이 없습니다."} />
            ) : (
              <>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {people.map(memorial => (
                    <Link key={memorial.id} href={memorial.href}>
                      <article
                        className="group h-full overflow-hidden rounded-[8px] border bg-white transition hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(55,66,44,0.12)]"
                        style={{ borderColor: line }}
                      >
                        <div className="aspect-[4/3] overflow-hidden bg-[#f7f4ec]">
                          {memorial.photoUrl ? (
                            <img
                              src={toImgUrl(memorial.photoUrl)}
                              alt={memorial.photoCaption || memorial.name}
                              className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.02]"
                              style={{ filter: "saturate(1.04) brightness(1.02)" }}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-[#f6f8ed]">
                              <UserRound className="h-12 w-12" style={{ color: green }} strokeWidth={1.3} />
                            </div>
                          )}
                        </div>
                        <div className="p-5">
                          <p
                            className="truncate text-[11px] font-semibold uppercase"
                            style={{ letterSpacing: "0.14em", color: yellow }}
                          >
                            {memorial.church}
                          </p>
                          <div className="mt-3 flex items-end justify-between gap-4">
                            <div className="min-w-0">
                              <h3
                                className="truncate text-2xl font-normal"
                                style={serifStyle}
                              >
                                {memorial.name}
                              </h3>
                              <p className="mt-1 truncate text-sm" style={{ color: muted }}>
                                {memorial.role}
                              </p>
                              <p className="mt-2 line-clamp-2 text-xs leading-5" style={{ color: muted }}>
                                {memorial.summary}
                              </p>
                            </div>
                            <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                    <PageButton
                      disabled={currentPage === 1}
                      onClick={() => setPage(value => Math.max(1, value - 1))}
                      label="이전"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </PageButton>
                    {Array.from({ length: totalPages }, (_, index) => index + 1).map(number => (
                      <button
                        key={number}
                        type="button"
                        onClick={() => setPage(number)}
                        className="h-10 min-w-10 rounded-full border px-3 text-sm font-semibold transition"
                        style={{
                          borderColor: currentPage === number ? green : line,
                          background: currentPage === number ? green : "#ffffff",
                          color: currentPage === number ? "#ffffff" : ink,
                        }}
                      >
                        {number}
                      </button>
                    ))}
                    <PageButton
                      disabled={currentPage === totalPages}
                      onClick={() =>
                        setPage(value => Math.min(totalPages, value + 1))
                      }
                      label="다음"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </PageButton>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <section className="border-b py-14 md:py-20" style={{ borderColor: line, background: ivory }}>
          <div className="container">
            <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p className="text-[11px] font-semibold uppercase" style={{ letterSpacing: "0.18em", color: coral }}>
                  Functions
                </p>
                <h2 className="mt-4 text-3xl font-normal md:text-5xl" style={serifStyle}>
                  기쁨이 있는교회를 위한 기록 방식
                </h2>
              </div>
              <p className="max-w-md text-sm leading-7" style={{ color: muted }}>
                신앙기념관은 밝게 기록하고, 추모관으로 전환된 인물은 차분한 추모
                톤과 하늘로 보내는 편지를 사용합니다.
              </p>
            </div>

            <div className="grid gap-px overflow-hidden rounded-[8px] border bg-[#e7ddc8] md:grid-cols-3" style={{ borderColor: line }}>
              {FEATURES.map(feature => {
                const Icon = feature.icon;
                return (
                  <article key={feature.title} className="bg-white p-6">
                    <Icon className="h-5 w-5" style={{ color: green }} strokeWidth={1.6} />
                    <h3 className="mt-8 text-xl font-normal" style={serifStyle}>
                      {feature.title}
                    </h3>
                    <p className="mt-4 text-sm leading-7" style={{ color: muted }}>
                      {feature.desc}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-[#263026] py-14 text-white md:py-20">
          <div className="container grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase text-white/60" style={{ letterSpacing: "0.18em" }}>
                Memorial Mode
              </p>
              <h2 className="mt-4 text-3xl font-normal md:text-5xl" style={serifStyle}>
                추모관 전환
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/70">
                소천 이후에는 신앙기념관을 추모관으로 전환해 소천일, 추도일,
                하늘로 보내는 편지를 별도로 사용할 수 있게 준비합니다.
              </p>
            </div>
            <Link href="/memorial/search">
              <button className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/24 px-5 text-sm font-semibold text-white">
                추모관 검색
                <LockKeyhole className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white px-4 py-4">
      <p className="text-xs" style={{ color: muted }}>
        {label}
      </p>
      <p className="mt-2 text-lg font-normal" style={serifStyle}>
        {value}
      </p>
    </div>
  );
}

function StatePanel({ text }: { text: string }) {
  return (
    <div
      className="rounded-[8px] border px-6 py-14 text-center text-sm"
      style={{ borderColor: line, background: ivory, color: muted }}
    >
      {text}
    </div>
  );
}

function PageButton({
  children,
  disabled,
  onClick,
  label,
}: {
  children: ReactNode;
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-10 w-10 items-center justify-center rounded-full border bg-white transition disabled:cursor-not-allowed disabled:opacity-40"
      style={{ borderColor: line, color: ink }}
      aria-label={label}
    >
      {children}
    </button>
  );
}
