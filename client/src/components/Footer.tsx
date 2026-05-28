import { Plus } from "lucide-react";
import { Link } from "wouter";

const serviceLinks = [
  { label: "인생기념관", href: "/memorial-garden", type: "route" },
  { label: "추모 기록", href: "/memorial/search", type: "route" },
  { label: "인생기념관 만들기", href: "/memorial/create", type: "route" },
  { label: "가족의 마음글", href: "/letters", type: "route" },
  { label: "키오스크", href: "/kiosk", type: "route" },
];

export default function Footer() {
  return (
    <footer className="border-t border-[#e8decd] bg-white text-[#686257]">
      <div className="container py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7a835f] text-white">
                <Plus className="h-4 w-4" strokeWidth={1.7} />
              </span>
              <div className="leading-tight">
                <span
                  className="block text-sm font-normal text-[#29251d]"
                  style={{ fontFamily: "'Noto Serif KR', serif" }}
                >
                  기쁨이 있는 곳
                </span>
                <span
                  className="block text-[10px] text-[#686257]"
                  style={{ letterSpacing: "0.14em" }}
                >
                  기쁨이 있는 곳 인생기념관
                </span>
              </div>
            </div>
            <p className="max-w-sm text-sm leading-7">
              부모님의 삶과 가족의 기억을 사진, 글, 영상으로 차분히
              기록합니다.
            </p>
          </div>

          <div>
            <h2
              className="mb-4 text-xs font-medium text-[#29251d] uppercase"
              style={{ letterSpacing: "0.16em" }}
            >
              서비스
            </h2>
            <ul className="space-y-3 text-sm">
              {serviceLinks.map(link => (
                <li key={link.href}>
                  {link.type === "route" ? (
                    <Link href={link.href}>
                      <span className="cursor-pointer transition-colors hover:text-[#29251d]">
                        {link.label}
                      </span>
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="transition-colors hover:text-[#29251d]"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2
              className="mb-4 text-xs font-medium text-[#29251d] uppercase"
              style={{ letterSpacing: "0.16em" }}
            >
              기쁨이 있는 곳
            </h2>
            <ul className="space-y-3 text-sm">
              <li>인생기념관 전용 서비스</li>
              <li>기쁨, 감사, 삶의 이야기</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col justify-between gap-3 border-t border-[#e8decd] pt-6 text-xs md:flex-row">
          <p>© 2026 기쁨이 있는 곳. All rights reserved.</p>
          <p>기쁨이 있는 곳 인생기념관</p>
        </div>
      </div>
    </footer>
  );
}
