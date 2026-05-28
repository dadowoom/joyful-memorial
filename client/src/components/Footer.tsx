import { Plus } from "lucide-react";
import { Link } from "wouter";

const serviceLinks = [
  { label: "추모관", href: "/memorial/search", type: "route" },
  { label: "추모관 만들기", href: "/memorial/create", type: "route" },
  { label: "하늘로 보내는 편지", href: "/letters", type: "route" },
  { label: "키오스크", href: "/kiosk", type: "route" },
];

export default function Footer() {
  return (
    <footer className="border-t border-[#ded7c8] bg-white text-[#686257]">
      <div className="container py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center bg-[#6f7658] text-white">
                <Plus className="h-4 w-4" strokeWidth={1.7} />
              </span>
              <div className="leading-tight">
                <span
                  className="block text-sm font-normal text-[#29251d]"
                  style={{ fontFamily: "'Noto Serif KR', serif" }}
                >
                  기쁨의 기억
                </span>
                <span
                  className="block text-[10px] text-[#686257]"
                  style={{ letterSpacing: "0.14em" }}
                >
                  기쁨이 있는교회 추모관
                </span>
              </div>
            </div>
            <p className="max-w-sm text-sm leading-7">
              소중한 분의 삶과 신앙을 교회 공동체가 함께 기억합니다.
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
              기쁨이 있는교회
            </h2>
            <ul className="space-y-3 text-sm">
              <li>디지털추모관 전용 서비스</li>
              <li>기억, 감사, 위로, 부활의 기쁨</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col justify-between gap-3 border-t border-[#ded7c8] pt-6 text-xs md:flex-row">
          <p>© 2026 기쁨이 있는교회. All rights reserved.</p>
          <p>기쁨의 기억 - 온라인 추모 서비스</p>
        </div>
      </div>
    </footer>
  );
}
