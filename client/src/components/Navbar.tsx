import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Menu, PenLine, Plus, Search, X } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

const navItems = [
  { label: "추모관", href: "/memorial/search" },
  { label: "추모관 만들기", href: "/memorial/create" },
  { label: "하늘로 보내는 편지", href: "/letters" },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-[#ded7c8] bg-white/95 backdrop-blur">
      <div className="container">
        <div className="flex h-16 items-center justify-between">
          <Link href="/">
            <div className="flex cursor-pointer items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center bg-[#6f7658] text-white">
                <Plus className="h-4 w-4" strokeWidth={1.7} />
              </span>
              <div className="leading-tight">
                <span
                  className="block text-sm font-normal text-[#121212]"
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
          </Link>

          <nav className="hidden items-center gap-5 md:flex lg:gap-8">
            {navItems.map(item => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm text-[#686257] transition-colors hover:text-[#29251d]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link href="/memorial/search">
              <button className="inline-flex h-9 items-center justify-center gap-2 border border-[#ded7c8] bg-white px-4 text-xs font-medium text-[#29251d] transition-colors hover:bg-[#fbfaf6]">
                <Search className="h-3.5 w-3.5" />
                추모관
              </button>
            </Link>
            <Link href="/memorial/create">
              <button className="inline-flex h-9 items-center justify-center gap-2 bg-[#29251d] px-4 text-xs font-medium text-white transition-opacity hover:opacity-90">
                <PenLine className="h-3.5 w-3.5" />
                만들기
              </button>
            </Link>
            {isAuthenticated ? (
              <>
                {user?.role === "admin" && (
                  <Link href="/admin">
                    <span className="text-sm text-[#686257] transition-colors hover:text-[#29251d]">
                      관리
                    </span>
                  </Link>
                )}
                <Link href="/">
                  <span className="text-sm text-[#686257] transition-colors hover:text-[#29251d]">
                    {user?.name || "계정"}
                  </span>
                </Link>
                <button
                  onClick={() => logout()}
                  className="h-9 border border-[#ded7c8] bg-white px-4 text-xs font-medium text-[#686257] transition-colors hover:bg-[#fbfaf6] hover:text-[#29251d]"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <button className="h-9 bg-[#29251d] px-4 text-xs font-medium text-white transition-opacity hover:opacity-90">
                  로그인
                </button>
              </a>
            )}
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center border border-[#ded7c8] bg-white text-[#29251d] md:hidden"
            onClick={() => setMobileOpen(open => !open)}
            aria-label={mobileOpen ? "메뉴 닫기" : "메뉴 열기"}
          >
            {mobileOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-[#ded7c8] bg-white md:hidden">
          <div className="container flex flex-col gap-1 py-4">
            {navItems.map(item => (
              <a
                key={item.href}
                href={item.href}
                onClick={closeMobile}
                className="py-3 text-sm text-[#29251d]"
              >
                {item.label}
              </a>
            ))}
            {user?.role === "admin" && (
              <Link href="/admin">
                <span
                  onClick={closeMobile}
                  className="py-3 text-sm text-[#29251d]"
                >
                  관리
                </span>
              </Link>
            )}
            <div className="mt-3 border-t border-[#ded7c8] pt-4">
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    logout();
                    closeMobile();
                  }}
                  className="h-10 w-full border border-[#ded7c8] bg-white text-sm text-[#29251d]"
                >
                  로그아웃
                </button>
              ) : (
                <a href={getLoginUrl()} onClick={closeMobile}>
                  <button className="h-10 w-full bg-[#29251d] text-sm font-medium text-white">
                    로그인
                  </button>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
