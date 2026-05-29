import { useAuth } from "@/_core/hooks/useAuth";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  Eye,
  KeyRound,
  LockKeyhole,
  PencilLine,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Link } from "wouter";

type MyMemorial = {
  id: number;
  slug: string;
  name: string;
  role: string;
  birthDate: string;
  deathDate: string;
  recordType: "faith" | "memorial";
  church: string;
  visibility: string;
  updatedAt: Date | string;
  photoUrl: string | null;
  hasAccessPassword: boolean;
  hasFamilyRoom: boolean;
  href: string;
  editHref: string;
};

type MemorialForm = {
  accessPassword: string;
  familyPassword: string;
  deleteName: string;
};

const serifStyle = { fontFamily: "'Noto Serif KR', serif" } as const;

const inputClass =
  "h-11 w-full rounded-full border border-[#e6ddcc] bg-white px-4 text-sm text-[#29251d] outline-none transition-colors placeholder:text-[#a39a8c] focus:border-[#7a835f]";

const emptyMemorialForm: MemorialForm = {
  accessPassword: "",
  familyPassword: "",
  deleteName: "",
};

export default function MyPage() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  const utils = trpc.useUtils();
  const memorialsQuery = trpc.memorial.myList.useQuery(undefined, {
    enabled: Boolean(user),
  });
  const changePassword = trpc.auth.changePassword.useMutation();
  const updateAccessPassword = trpc.memorial.updateAccessPassword.useMutation();
  const updateFamilyPassword = trpc.memorial.updateFamilyPassword.useMutation();
  const deleteMemorial = trpc.memorial.deleteMine.useMutation();

  const [accountForm, setAccountForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [forms, setForms] = useState<Record<string, MemorialForm>>({});
  const [notice, setNotice] = useState("");

  const memorials = (memorialsQuery.data ?? []) as MyMemorial[];
  const stats = useMemo(
    () => ({
      total: memorials.length,
      public: memorials.filter(memorial => memorial.visibility === "public")
        .length,
      private: memorials.filter(memorial => memorial.visibility === "private")
        .length,
      family: memorials.filter(memorial => memorial.hasFamilyRoom).length,
    }),
    [memorials]
  );

  const setMemorialForm = (
    slug: string,
    key: keyof MemorialForm,
    value: string
  ) => {
    setForms(current => ({
      ...current,
      [slug]: {
        ...(current[slug] ?? emptyMemorialForm),
        [key]: value,
      },
    }));
    setNotice("");
  };

  const resetMemorialField = (slug: string, key: keyof MemorialForm) => {
    setForms(current => ({
      ...current,
      [slug]: {
        ...(current[slug] ?? emptyMemorialForm),
        [key]: "",
      },
    }));
  };

  const handleAccountPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice("");

    if (accountForm.newPassword !== accountForm.confirmPassword) {
      setNotice("새 비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    try {
      await changePassword.mutateAsync({
        currentPassword: accountForm.currentPassword,
        newPassword: accountForm.newPassword,
      });
      setAccountForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setNotice("계정 비밀번호가 변경되었습니다.");
    } catch (error) {
      setNotice(getErrorMessage(error, "계정 비밀번호를 변경하지 못했습니다."));
    }
  };

  const handleAccessPassword = async (memorial: MyMemorial) => {
    const password = forms[memorial.slug]?.accessPassword.trim() ?? "";
    if (password.length < 4) {
      setNotice("기념관 입장 비밀번호는 4자 이상 입력해주세요.");
      return;
    }

    try {
      await updateAccessPassword.mutateAsync({
        slug: memorial.slug,
        password,
      });
      resetMemorialField(memorial.slug, "accessPassword");
      await utils.memorial.myList.invalidate();
      setNotice(`${memorial.name} 기념관의 입장 비밀번호가 변경되었습니다.`);
    } catch (error) {
      setNotice(getErrorMessage(error, "입장 비밀번호를 변경하지 못했습니다."));
    }
  };

  const handleFamilyPassword = async (memorial: MyMemorial) => {
    const password = forms[memorial.slug]?.familyPassword.trim() ?? "";
    if (password.length < 4) {
      setNotice("가족관 비밀번호는 4자 이상 입력해주세요.");
      return;
    }

    try {
      await updateFamilyPassword.mutateAsync({
        slug: memorial.slug,
        password,
      });
      resetMemorialField(memorial.slug, "familyPassword");
      await utils.memorial.myList.invalidate();
      setNotice(`${memorial.name} 가족관 비밀번호가 변경되었습니다.`);
    } catch (error) {
      setNotice(
        getErrorMessage(error, "가족관 비밀번호를 변경하지 못했습니다.")
      );
    }
  };

  const handleDelete = async (memorial: MyMemorial) => {
    const confirmName = forms[memorial.slug]?.deleteName.trim() ?? "";
    if (confirmName !== memorial.name) {
      setNotice("삭제하려면 성함을 정확히 입력해주세요.");
      return;
    }

    const confirmed = window.confirm(
      `${memorial.name} 기념관을 삭제할까요? 사진, 영상, 책장, 마음글도 함께 삭제됩니다.`
    );
    if (!confirmed) return;

    try {
      await deleteMemorial.mutateAsync({
        slug: memorial.slug,
        confirmName,
      });
      await utils.memorial.myList.invalidate();
      setNotice(`${memorial.name} 기념관이 삭제되었습니다.`);
    } catch (error) {
      setNotice(getErrorMessage(error, "기념관을 삭제하지 못했습니다."));
    }
  };

  if (loading) {
    return <StateScreen text="내 계정을 확인하고 있습니다." />;
  }

  return (
    <div className="min-h-screen bg-[#fffdf8] text-[#29251d]">
      <Navbar />

      <main className="pt-16">
        <section className="border-b border-[#e6ddcc] bg-white">
          <div className="container grid gap-8 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.28em] text-[#7a835f]">
                My Page
              </p>
              <h1
                className="text-4xl font-normal leading-tight md:text-6xl"
                style={serifStyle}
              >
                마이페이지
              </h1>
              <p className="mt-6 max-w-2xl text-sm leading-7 text-[#6d665a]">
                내가 만든 인생기념관을 수정하고 공개 범위, 입장 비밀번호, 가족관
                비밀번호를 관리합니다.
              </p>
            </div>

            <div className="rounded-2xl border border-[#e6ddcc] bg-[#fffdf8] p-5">
              <p className="text-sm font-medium text-[#29251d]">
                {user?.name || "회원"}님
              </p>
              <p className="mt-2 break-all text-sm leading-6 text-[#6d665a]">
                {user?.email || "로그인 계정"}
              </p>
              {notice && (
                <p className="mt-4 rounded-xl bg-white px-4 py-3 text-sm leading-6 text-[#5f6f44]">
                  {notice}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="py-8 md:py-12">
          <div className="container grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="space-y-6">
              <form
                onSubmit={handleAccountPassword}
                className="rounded-2xl border border-[#e6ddcc] bg-white p-5 md:p-6"
              >
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5e8c9] text-[#66512a]">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-base font-medium">계정 비밀번호</h2>
                    <p className="mt-1 text-xs text-[#7b7468]">
                      로그인 비밀번호를 변경합니다.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <input
                    className={inputClass}
                    type="password"
                    value={accountForm.currentPassword}
                    onChange={event =>
                      setAccountForm(current => ({
                        ...current,
                        currentPassword: event.target.value,
                      }))
                    }
                    placeholder="현재 비밀번호"
                    autoComplete="current-password"
                  />
                  <input
                    className={inputClass}
                    type="password"
                    value={accountForm.newPassword}
                    onChange={event =>
                      setAccountForm(current => ({
                        ...current,
                        newPassword: event.target.value,
                      }))
                    }
                    placeholder="새 비밀번호"
                    autoComplete="new-password"
                  />
                  <input
                    className={inputClass}
                    type="password"
                    value={accountForm.confirmPassword}
                    onChange={event =>
                      setAccountForm(current => ({
                        ...current,
                        confirmPassword: event.target.value,
                      }))
                    }
                    placeholder="새 비밀번호 확인"
                    autoComplete="new-password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={changePassword.isPending}
                  className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#29251d] px-5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {changePassword.isPending ? "변경 중" : "비밀번호 변경"}
                  <KeyRound className="h-4 w-4" />
                </button>
              </form>

              <div className="grid grid-cols-2 gap-3">
                <Stat label="전체" value={stats.total} />
                <Stat label="공개" value={stats.public} />
                <Stat label="비공개" value={stats.private} />
                <Stat label="가족관" value={stats.family} />
              </div>
            </aside>

            <section className="min-w-0">
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-normal" style={serifStyle}>
                    내 인생기념관
                  </h2>
                  <p className="mt-2 text-sm text-[#6d665a]">
                    기본 정보 수정, 비밀번호 변경, 삭제를 이곳에서 진행합니다.
                  </p>
                </div>
                <Link href="/memorial/create">
                  <button className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#7a835f] px-5 text-sm font-medium text-white transition-opacity hover:opacity-90">
                    <Plus className="h-4 w-4" />새 기념관
                  </button>
                </Link>
              </div>

              {memorialsQuery.isLoading ? (
                <Panel text="기념관 목록을 불러오고 있습니다." />
              ) : memorialsQuery.isError ? (
                <Panel text="내 기념관 목록을 불러오지 못했습니다." />
              ) : memorials.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="space-y-5">
                  {memorials.map(memorial => (
                    <article
                      key={memorial.id}
                      className="overflow-hidden rounded-2xl border border-[#e6ddcc] bg-white"
                    >
                      <div className="grid gap-5 p-5 md:grid-cols-[112px_minmax(0,1fr)] md:p-6">
                        <div className="h-28 w-full overflow-hidden rounded-2xl bg-[#f4efe5] md:h-32">
                          {memorial.photoUrl ? (
                            <img
                              src={memorial.photoUrl}
                              alt={`${memorial.name} 대표 사진`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-[#8a8173]">
                              사진 없음
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <VisibilityBadge
                                  visibility={memorial.visibility}
                                />
                                <span className="rounded-full bg-[#f5e8c9] px-3 py-1 text-xs text-[#66512a]">
                                  {memorial.recordType === "memorial"
                                    ? "추모 기록"
                                    : "인생기념관"}
                                </span>
                              </div>
                              <h3
                                className="mt-3 text-2xl font-normal"
                                style={serifStyle}
                              >
                                {memorial.name}
                              </h3>
                              <p className="mt-1 text-sm text-[#6d665a]">
                                {memorial.role} · {memorial.church}
                              </p>
                              <p className="mt-2 text-xs text-[#8a8173]">
                                최근 수정 {formatDate(memorial.updatedAt)}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2 sm:justify-end">
                              <Link href={memorial.href}>
                                <button className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#e6ddcc] bg-white px-4 text-sm text-[#29251d] transition-colors hover:bg-[#fffdf8]">
                                  <Eye className="h-4 w-4" />
                                  보기
                                </button>
                              </Link>
                              <Link href={memorial.editHref}>
                                <button className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#29251d] px-4 text-sm text-white transition-opacity hover:opacity-90">
                                  <PencilLine className="h-4 w-4" />
                                  수정
                                </button>
                              </Link>
                            </div>
                          </div>

                          <div className="mt-6 grid gap-4 lg:grid-cols-2">
                            <PasswordControl
                              title="기념관 입장 비밀번호"
                              description="입력하면 비공개 기념관으로 전환되고 새 비밀번호가 적용됩니다."
                              value={forms[memorial.slug]?.accessPassword ?? ""}
                              pending={updateAccessPassword.isPending}
                              buttonLabel={
                                memorial.hasAccessPassword ? "변경" : "설정"
                              }
                              onChange={value =>
                                setMemorialForm(
                                  memorial.slug,
                                  "accessPassword",
                                  value
                                )
                              }
                              onSubmit={() => handleAccessPassword(memorial)}
                            />
                            <PasswordControl
                              title="가족관 비밀번호"
                              description="가족 전용 공간 입장 비밀번호를 설정하거나 변경합니다."
                              value={forms[memorial.slug]?.familyPassword ?? ""}
                              pending={updateFamilyPassword.isPending}
                              buttonLabel={
                                memorial.hasFamilyRoom ? "변경" : "설정"
                              }
                              onChange={value =>
                                setMemorialForm(
                                  memorial.slug,
                                  "familyPassword",
                                  value
                                )
                              }
                              onSubmit={() => handleFamilyPassword(memorial)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-[#eee5d5] bg-[#fffaf0] p-5 md:p-6">
                        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                          <div>
                            <p className="text-sm font-medium text-[#7b332b]">
                              기념관 삭제
                            </p>
                            <p className="mt-1 text-xs leading-5 text-[#8a6b63]">
                              삭제하려면 성함을 정확히 입력해주세요. 삭제 후에는
                              연결된 사진, 영상, 책장, 마음글이 함께 사라집니다.
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <input
                              className="h-10 w-full rounded-full border border-[#e1c8be] bg-white px-4 text-sm outline-none placeholder:text-[#ad9186] focus:border-[#9f5547] sm:w-44"
                              value={forms[memorial.slug]?.deleteName ?? ""}
                              onChange={event =>
                                setMemorialForm(
                                  memorial.slug,
                                  "deleteName",
                                  event.target.value
                                )
                              }
                              placeholder={memorial.name}
                            />
                            <button
                              type="button"
                              disabled={deleteMemorial.isPending}
                              onClick={() => handleDelete(memorial)}
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#9f5547] px-4 text-sm text-[#7b332b] transition-colors hover:bg-[#9f5547] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              삭제
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function PasswordControl({
  title,
  description,
  value,
  pending,
  buttonLabel,
  onChange,
  onSubmit,
}: {
  title: string;
  description: string;
  value: string;
  pending: boolean;
  buttonLabel: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[#eee5d5] bg-[#fffdf8] p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#7a835f]">
          <KeyRound className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#29251d]">{title}</p>
          <p className="mt-1 text-xs leading-5 text-[#7b7468]">{description}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          className={inputClass}
          type="password"
          value={value}
          onChange={event => onChange(event.target.value)}
          placeholder="새 비밀번호"
          autoComplete="new-password"
        />
        <button
          type="button"
          disabled={pending}
          onClick={onSubmit}
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[#7a835f] px-5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "저장 중" : buttonLabel}
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#e6ddcc] bg-white p-4">
      <p className="text-xs text-[#7b7468]">{label}</p>
      <p className="mt-2 text-2xl font-light text-[#29251d]">{value}</p>
    </div>
  );
}

function VisibilityBadge({ visibility }: { visibility: string }) {
  const privateMemorial = visibility === "private";
  return (
    <span className="inline-flex w-fit items-center gap-1 rounded-full border border-[#e6ddcc] bg-white px-3 py-1 text-xs text-[#6d665a]">
      {privateMemorial && <LockKeyhole className="h-3 w-3" />}
      {privateMemorial ? "비공개" : "전체 공개"}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-[#e6ddcc] bg-white p-10 text-center">
      <p className="text-lg font-medium text-[#29251d]">
        아직 만든 기념관이 없습니다.
      </p>
      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#6d665a]">
        가족의 사진과 이야기를 모아 첫 인생기념관을 만들어보세요.
      </p>
      <Link href="/memorial/create">
        <button className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#29251d] px-5 text-sm font-medium text-white transition-opacity hover:opacity-90">
          기념관 만들기
          <ArrowRight className="h-4 w-4" />
        </button>
      </Link>
    </div>
  );
}

function Panel({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-[#e6ddcc] bg-white py-20 text-center">
      <p className="text-sm text-[#6d665a]">{text}</p>
    </div>
  );
}

function StateScreen({ text }: { text: string }) {
  return (
    <div className="min-h-screen bg-[#fffdf8] text-[#29251d]">
      <Navbar />
      <main className="container pt-32">
        <Panel text={text} />
      </main>
    </div>
  );
}

function formatDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
