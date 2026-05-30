import { useAuth } from "@/_core/hooks/useAuth";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import {
  compressImageFile,
  type CompressedImage,
} from "@/lib/imageCompression";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

type SelectedPhoto = CompressedImage & {
  caption?: string;
  year?: string;
};

type TimelineItem = {
  id: string;
  year: string;
  title: string;
  description: string;
  photo?: SelectedPhoto | null;
};

type BookDraft = {
  id: string;
  title: string;
  subtitle: string;
  pages: TimelineItem[];
};

type Visibility = "public" | "private";

type MemorialForm = {
  name: string;
  role: string;
  birthDate: string;
  deathDate: string;
  recordType: "faith";
  church: string;
  familyContact: string;
  familyPhone: string;
  slug: string;
  verse: string;
  verseRef: string;
  summary: string;
  story: string;
  serviceTime: string;
  memorialDay: string;
  visibility: Visibility;
  accessPassword: string;
};

type CreatedMemorial = {
  id: number;
  slug: string;
  status: string;
  href: string;
};

const draftKey = "joyful.memorialCreateDraft";

const initialForm: MemorialForm = {
  name: "",
  role: "",
  birthDate: "",
  deathDate: "",
  recordType: "faith",
  church: "우리 가족",
  familyContact: "",
  familyPhone: "",
  slug: "",
  verse: "",
  verseRef: "",
  summary: "",
  story: "",
  serviceTime: "",
  memorialDay: "",
  visibility: "public",
  accessPassword: "",
};

const requiredFields: Array<{ key: keyof MemorialForm; label: string }> = [
  { key: "name", label: "성함" },
  { key: "role", label: "호칭" },
  { key: "birthDate", label: "출생일" },
  { key: "slug", label: "인생기념관 주소(URL)" },
  { key: "summary", label: "한 줄 소개" },
  { key: "story", label: "삶의 기록" },
];

const visibilityOptions: Array<{
  value: Visibility;
  label: string;
  desc: string;
}> = [
  {
    value: "public",
    label: "전체 공개",
    desc: "누구나 인생기념관에 들어갈 수 있습니다.",
  },
  {
    value: "private",
    label: "비공개",
    desc: "비밀번호를 아는 분만 들어갈 수 있습니다.",
  },
];

const roleSuggestions = [
  "아버지",
  "어머니",
  "할아버지",
  "할머니",
  "큰아버지",
  "큰어머니",
  "외할아버지",
  "외할머니",
  "선생님",
  "가족",
];

const inputClass =
  "h-12 w-full border-0 border-b border-[#dbdad7] bg-transparent px-0 text-sm text-[#121212] outline-none transition-colors placeholder:text-[#9a9a9a] focus:border-[#18181b]";
const textAreaClass =
  "min-h-36 w-full resize-y border border-[#dbdad7] bg-transparent p-4 text-sm leading-7 text-[#121212] outline-none transition-colors placeholder:text-[#9a9a9a] focus:border-[#18181b]";
const labelClass = "mb-2 block text-xs font-medium text-[#616161]";
const errorClass = "mt-2 text-xs text-[#9f2a2a]";
const MAX_GALLERY_PHOTOS = 24;
const GALLERY_PHOTO_MAX_BYTES = 1_200_000;
const GALLERY_PHOTO_MAX_DIMENSION = 1800;

const makeId = () => {
  const nativeUuid = globalThis.crypto?.randomUUID;
  if (typeof nativeUuid === "function") {
    try {
      return nativeUuid.call(globalThis.crypto);
    } catch {
      // Plain HTTP origins can expose crypto without allowing randomUUID.
    }
  }

  return `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const makeTimelineItem = (): TimelineItem => ({
  id: makeId(),
  year: "",
  title: "",
  description: "",
  photo: null,
});

const makeBookDraft = (index = 1): BookDraft => ({
  id: makeId(),
  title: index === 1 ? "우리 가족의 첫 번째 책" : `새 책 ${index}`,
  subtitle: "",
  pages: [makeTimelineItem(), makeTimelineItem()],
});

const sanitizeSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+/g, "");

const isValidSlug = (value: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);

const toBookPageYear = (year: string) => {
  const match = year.trim().match(/^\d{4}$/);
  return match ? Number(match[0]) : undefined;
};

export default function MemorialCreate() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth({
    redirectOnUnauthenticated: true,
  });
  const [form, setForm] = useState<MemorialForm>(initialForm);
  const [books, setBooks] = useState<BookDraft[]>(() => [makeBookDraft(1)]);
  const [activeBookIndex, setActiveBookIndex] = useState(0);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [portraitPhoto, setPortraitPhoto] = useState<SelectedPhoto | null>(
    null
  );
  const [galleryPhotos, setGalleryPhotos] = useState<SelectedPhoto[]>([]);
  const [errors, setErrors] = useState<
    Partial<Record<keyof MemorialForm, string>>
  >({});
  const [notice, setNotice] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [createdMemorial, setCreatedMemorial] =
    useState<CreatedMemorial | null>(null);
  const createMemorialMutation = trpc.memorial.create.useMutation();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (!saved) return;

      const parsed = JSON.parse(saved) as {
        form?: Partial<MemorialForm>;
        books?: BookDraft[];
        timeline?: TimelineItem[];
      };

      if (parsed.form) {
        const { managerMemo: _managerMemo, ...savedForm } = parsed.form as
          | (Partial<MemorialForm> & { managerMemo?: string })
          | Record<string, never>;

        setForm({ ...initialForm, ...savedForm });
      }

      if (Array.isArray(parsed.books) && parsed.books.length > 0) {
        setBooks(
          parsed.books.map((book, index) => ({
            id: book.id || makeId(),
            title:
              book.title ||
              (index === 0 ? "우리 가족의 첫 번째 책" : `새 책 ${index + 1}`),
            subtitle: book.subtitle || "",
            pages:
              Array.isArray(book.pages) && book.pages.length > 0
                ? book.pages.map(item => ({
                    id: item.id || makeId(),
                    year: item.year || "",
                    title: item.title || "",
                    description: item.description || "",
                    photo: null,
                  }))
                : [makeTimelineItem()],
          }))
        );
      } else if (Array.isArray(parsed.timeline) && parsed.timeline.length > 0) {
        setBooks([
          {
            ...makeBookDraft(1),
            pages: parsed.timeline.map(item => ({
              id: item.id || makeId(),
              year: item.year || "",
              title: item.title || "",
              description: item.description || "",
              photo: null,
            })),
          },
        ]);
      }
    } catch {
      localStorage.removeItem(draftKey);
    }
  }, []);

  const completion = useMemo(() => {
    const filled = requiredFields.filter(({ key }) => form[key].trim()).length;
    return {
      filled,
      total: requiredFields.length,
      percent: Math.round((filled / requiredFields.length) * 100),
    };
  }, [form]);

  const slugPreview = useMemo(() => {
    if (form.slug.trim()) return form.slug.trim();
    return "life-story-url";
  }, [form.slug]);

  const missingLabels = useMemo(
    () =>
      requiredFields
        .filter(({ key }) => !form[key].trim())
        .map(({ label }) => label),
    [form]
  );
  const activeBookPosition = Math.min(
    activeBookIndex,
    Math.max(books.length - 1, 0)
  );
  const activeBook = books[activeBookPosition] ?? books[0];
  const activeBookPages = activeBook?.pages ?? [];
  const activePagePosition = Math.min(
    activePageIndex,
    Math.max(activeBookPages.length - 1, 0)
  );
  const activePage = activeBookPages[activePagePosition] ?? activeBookPages[0];
  const allBookPages = useMemo(
    () => books.flatMap(book => book.pages),
    [books]
  );

  useEffect(() => {
    setActiveBookIndex(current =>
      Math.min(current, Math.max(books.length - 1, 0))
    );
  }, [books.length]);

  useEffect(() => {
    setActivePageIndex(current =>
      Math.min(current, Math.max(activeBookPages.length - 1, 0))
    );
  }, [activeBookPosition, activeBookPages.length]);

  const updateField = (key: keyof MemorialForm, value: string) => {
    const nextValue = key === "slug" ? sanitizeSlug(value) : value;
    setForm(current => ({ ...current, [key]: nextValue }));
    setErrors(current => ({ ...current, [key]: undefined }));
    setSubmitted(false);
    setCreatedMemorial(null);
  };

  const updateVisibility = (visibility: Visibility) => {
    setForm(current => ({
      ...current,
      visibility,
      accessPassword: visibility === "private" ? current.accessPassword : "",
    }));
    setErrors(current => ({
      ...current,
      accessPassword: undefined,
      visibility: undefined,
    }));
    setSubmitted(false);
    setCreatedMemorial(null);
  };

  const updateBook = (
    id: string,
    field: "title" | "subtitle",
    value: string
  ) => {
    setBooks(items =>
      items.map(book => (book.id === id ? { ...book, [field]: value } : book))
    );
    setSubmitted(false);
    setCreatedMemorial(null);
  };

  const updateBookPage = (
    bookId: string,
    pageId: string,
    field: "year" | "title" | "description",
    value: string
  ) => {
    setBooks(items =>
      items.map(book =>
        book.id === bookId
          ? {
              ...book,
              pages: book.pages.map(page =>
                page.id === pageId ? { ...page, [field]: value } : page
              ),
            }
          : book
      )
    );
    setSubmitted(false);
    setCreatedMemorial(null);
  };

  const updateBookPagePhoto = async (
    bookId: string,
    pageId: string,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const photo = await compressImageFile(file, { maxBytes: 2_500_000 });
    setBooks(items =>
      items.map(book =>
        book.id === bookId
          ? {
              ...book,
              pages: book.pages.map(page =>
                page.id === pageId ? { ...page, photo } : page
              ),
            }
          : book
      )
    );
    setSubmitted(false);
    setCreatedMemorial(null);
  };

  const clearBookPagePhoto = (bookId: string, pageId: string) => {
    setBooks(items =>
      items.map(book =>
        book.id === bookId
          ? {
              ...book,
              pages: book.pages.map(page =>
                page.id === pageId ? { ...page, photo: null } : page
              ),
            }
          : book
      )
    );
    setSubmitted(false);
    setCreatedMemorial(null);
  };

  const addBook = () => {
    const nextBook = makeBookDraft(books.length + 1);
    setBooks(items => [...items, nextBook]);
    setActiveBookIndex(books.length);
    setActivePageIndex(0);
    setSubmitted(false);
    setCreatedMemorial(null);
  };

  const removeBook = (id: string) => {
    if (books.length <= 1) return;

    const nextLength = Math.max(books.length - 1, 1);
    setBooks(items => items.filter(book => book.id !== id));
    setActiveBookIndex(current => Math.min(current, nextLength - 1));
    setActivePageIndex(0);
    setSubmitted(false);
    setCreatedMemorial(null);
  };

  const addBookPage = () => {
    if (!activeBook) return;

    const nextItem = makeTimelineItem();
    setBooks(items =>
      items.map(book =>
        book.id === activeBook.id
          ? { ...book, pages: [...book.pages, nextItem] }
          : book
      )
    );
    setActivePageIndex(activeBookPages.length);
    setSubmitted(false);
    setCreatedMemorial(null);
  };

  const removeBookPage = (bookId: string, pageId: string) => {
    const targetBook = books.find(book => book.id === bookId);
    const itemExists = Boolean(
      targetBook?.pages.some(page => page.id === pageId)
    );
    const nextLength = itemExists
      ? Math.max((targetBook?.pages.length ?? 1) - 1, 1)
      : (targetBook?.pages.length ?? 1);

    setBooks(items =>
      items.map(book => {
        if (book.id !== bookId) return book;

        const nextPages = book.pages.filter(page => page.id !== pageId);
        return {
          ...book,
          pages: nextPages.length ? nextPages : [makeTimelineItem()],
        };
      })
    );
    setActivePageIndex(current =>
      Math.min(current, Math.max(nextLength - 1, 0))
    );
    setSubmitted(false);
    setCreatedMemorial(null);
  };

  const handlePortraitChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPortraitPhoto({
      ...(await compressImageFile(file, { maxBytes: 2_500_000 })),
      caption: "대표 사진",
    });
    setSubmitted(false);
    setCreatedMemorial(null);
  };

  const handleGalleryChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";
    if (selectedFiles.length === 0) return;

    const remainingCount = MAX_GALLERY_PHOTOS - galleryPhotos.length;
    if (remainingCount <= 0) {
      setNotice(
        `활동 사진은 최대 ${MAX_GALLERY_PHOTOS}장까지 올릴 수 있습니다.`
      );
      return;
    }

    const files = selectedFiles.slice(0, remainingCount);
    const compressedPhotos = await Promise.all(
      files.map(file =>
        compressImageFile(file, {
          maxBytes: GALLERY_PHOTO_MAX_BYTES,
          maxDimension: GALLERY_PHOTO_MAX_DIMENSION,
        })
      )
    );

    setGalleryPhotos(current =>
      [...current, ...compressedPhotos].slice(0, MAX_GALLERY_PHOTOS)
    );
    if (selectedFiles.length > remainingCount) {
      setNotice(`활동 사진은 최대 ${MAX_GALLERY_PHOTOS}장까지만 추가했습니다.`);
    } else {
      setNotice(`활동 사진 ${files.length}장을 추가했습니다.`);
    }
    setSubmitted(false);
    setCreatedMemorial(null);
  };

  const clearGalleryPhotos = () => {
    setGalleryPhotos([]);
    setSubmitted(false);
    setCreatedMemorial(null);
  };

  const removeGalleryPhoto = (index: number) => {
    setGalleryPhotos(current =>
      current.filter((_, itemIndex) => itemIndex !== index)
    );
    setSubmitted(false);
    setCreatedMemorial(null);
  };

  const saveDraft = () => {
    localStorage.setItem(
      draftKey,
      JSON.stringify({
        form,
        books: books.map(book => ({
          ...book,
          pages: book.pages.map(({ photo: _photo, ...item }) => item),
        })),
        timeline: allBookPages.map(({ photo: _photo, ...item }) => item),
      })
    );
    setNotice(
      "임시저장되었습니다. 이 브라우저에서 다시 이어서 작성할 수 있습니다."
    );
    setSubmitted(false);
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof MemorialForm, string>> = {};

    requiredFields.forEach(({ key, label }) => {
      if (!form[key].trim()) {
        nextErrors[key] = `${label}을 입력해 주세요.`;
      }
    });

    if (form.visibility === "private" && !form.accessPassword.trim()) {
      nextErrors.accessPassword =
        "비공개 인생기념관 입장 비밀번호를 입력해 주세요.";
    }

    if (form.slug.trim() && !isValidSlug(form.slug.trim())) {
      nextErrors.slug =
        "주소는 영문 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      setNotice("필수 항목을 먼저 채워 주세요.");
      setSubmitted(false);
      document
        .getElementById("basic")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    try {
      setNotice("인생기념관을 생성하고 있습니다.");
      const created = await createMemorialMutation.mutateAsync({
        ...form,
        slug: slugPreview,
        timeline: allBookPages.map(({ year, title, description }) => ({
          year,
          title,
          description,
        })),
        books: books.map((book, index) => ({
          title: book.title.trim() || `책 ${index + 1}`,
          subtitle: book.subtitle,
          pages: book.pages
            .filter(
              ({ year, title, description, photo }) =>
                year.trim() ||
                title.trim() ||
                description.trim() ||
                Boolean(photo)
            )
            .map(({ year, title, description, photo }) => ({
              year,
              title,
              content: description,
              dateYear: toBookPageYear(year),
              photo: photo
                ? {
                    dataUrl: photo.dataUrl,
                    fileName: photo.fileName,
                  }
                : undefined,
            })),
        })),
        photos: [
          ...(portraitPhoto
            ? [
                {
                  dataUrl: portraitPhoto.dataUrl,
                  fileName: portraitPhoto.fileName,
                  caption: portraitPhoto.caption,
                  isRepresentative: true,
                },
              ]
            : []),
          ...galleryPhotos.map((photo, index) => ({
            dataUrl: photo.dataUrl,
            fileName: photo.fileName,
            caption: photo.caption || `활동 사진 ${index + 1}`,
            year: photo.year,
            isRepresentative: false,
          })),
        ],
      });

      localStorage.removeItem(draftKey);
      setCreatedMemorial(created);
      setNotice("인생기념관이 생성되었습니다. 바로 확인할 수 있습니다.");
      setSubmitted(true);
      setLocation(created.href || `/memorial/${created.slug}/archive`);
    } catch (error) {
      console.error("[Memorial Create] Failed to save", error);
      setNotice("저장 중 문제가 생겼습니다. 잠시 뒤 다시 시도해 주세요.");
      setSubmitted(false);
      setCreatedMemorial(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-[#121212]">
        <Navbar />
        <main className="container pt-32">
          <div className="border border-[#dbdad7] py-20 text-center">
            <p className="text-sm text-[#616161]">
              로그인 상태를 확인하고 있습니다.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white text-[#121212]">
        <Navbar />
        <main className="container pt-32">
          <div className="border border-[#dbdad7] py-20 text-center">
            <p className="text-sm text-[#616161]">
              회원가입 또는 로그인 후 인생기념관을 생성할 수 있습니다.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#121212]">
      <Navbar />

      <main className="pt-16">
        <section className="border-b border-[#dbdad7]">
          <div className="container grid gap-10 py-12 md:py-16 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)]">
            <div>
              <p className="mb-5 text-xs font-medium text-[#616161]">
                인생기념관 만들기
              </p>
              <h1
                className="text-4xl font-normal leading-tight md:text-6xl"
                style={{ fontFamily: "'Noto Serif KR', serif" }}
              >
                기쁨의 삶을
                <br />
                기록하세요
              </h1>
              <p className="mt-6 max-w-md text-sm leading-7 text-[#616161]">
                <span className="block">
                  사진과 글을 더하면 한 권의 책처럼 정리됩니다.
                </span>
                <span className="block">
                  가족과 가까운 사람들이 함께 읽는 인생기념관을 남겨보세요.
                </span>
              </p>
            </div>

            <aside className="border border-[#dbdad7] p-5 md:p-6">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-sm font-medium text-[#121212]">
                    작성 상태
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#616161]">
                    필수 항목 {completion.filled}/{completion.total}
                  </p>
                </div>
                <span className="text-3xl font-light text-[#121212]">
                  {completion.percent}%
                </span>
              </div>

              <div className="mt-6 h-px bg-[#dbdad7]">
                <div
                  className="h-px bg-[#18181b] transition-all"
                  style={{ width: `${completion.percent}%` }}
                />
              </div>

              <div className="mt-6 grid gap-px bg-[#dbdad7] sm:grid-cols-3">
                {["정보 입력", "책장 작성", "등록 완료"].map((step, index) => (
                  <div key={step} className="bg-white p-4">
                    <p className="text-xs text-[#616161]">
                      {String(index + 1).padStart(2, "0")}
                    </p>
                    <p className="mt-3 text-sm text-[#121212]">{step}</p>
                  </div>
                ))}
              </div>

              {missingLabels.length > 0 && (
                <div className="mt-5">
                  <p className="text-sm text-[#616161]">남은 필수 항목</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {missingLabels.map(label => (
                      <span
                        key={label}
                        className="border border-[#dbdad7] px-2 py-1 text-xs text-[#616161]"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="py-8 md:py-12">
          <div className="container grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="hidden lg:block">
              <div className="sticky top-24 border border-[#dbdad7] p-5">
                <p className="text-sm font-medium text-[#121212]">입력 항목</p>
                <nav className="mt-5 space-y-3 text-sm text-[#616161]">
                  <a
                    href="#basic"
                    className="block transition-colors hover:text-[#121212]"
                  >
                    기본 정보
                  </a>
                  <a
                    href="#story"
                    className="block transition-colors hover:text-[#121212]"
                  >
                    삶의 이야기
                  </a>
                  <a
                    href="#timeline"
                    className="block transition-colors hover:text-[#121212]"
                  >
                    책과 페이지
                  </a>
                  <a
                    href="#photos"
                    className="block transition-colors hover:text-[#121212]"
                  >
                    사진
                  </a>
                  <a
                    href="#settings"
                    className="block transition-colors hover:text-[#121212]"
                  >
                    공개 설정
                  </a>
                </nav>

                <div className="mt-8 border-t border-[#dbdad7] pt-5">
                  <p className="text-xs text-[#616161]">예상 주소</p>
                  <p className="mt-2 break-all text-sm text-[#121212]">
                    /memorial/{slugPreview}/archive
                  </p>
                </div>
              </div>
            </aside>

            <div className="space-y-8">
              <section
                id="basic"
                className="scroll-mt-24 border border-[#dbdad7] p-5 md:p-8"
              >
                <SectionHeader number="01" title="기본 정보" />

                <div className="grid gap-6 md:grid-cols-2">
                  <Field label="성함" error={errors.name} required>
                    <input
                      className={inputClass}
                      value={form.name}
                      onChange={event =>
                        updateField("name", event.target.value)
                      }
                      placeholder="김영수"
                      aria-invalid={Boolean(errors.name)}
                    />
                  </Field>

                  <Field label="호칭" error={errors.role} required>
                    <input
                      className={inputClass}
                      list="role-suggestions"
                      value={form.role}
                      onChange={event =>
                        updateField("role", event.target.value)
                      }
                      placeholder="아버지, 할머니, 큰아빠 등"
                      aria-invalid={Boolean(errors.role)}
                    />
                    <datalist id="role-suggestions">
                      {roleSuggestions.map(role => (
                        <option key={role} value={role} />
                      ))}
                    </datalist>
                  </Field>

                  <Field label="출생일" error={errors.birthDate} required>
                    <input
                      type="date"
                      className={inputClass}
                      value={form.birthDate}
                      onChange={event =>
                        updateField("birthDate", event.target.value)
                      }
                      aria-invalid={Boolean(errors.birthDate)}
                    />
                  </Field>

                  <Field
                    label="인생기념관 주소(URL)"
                    error={errors.slug}
                    required
                  >
                    <input
                      className={inputClass}
                      value={form.slug}
                      onChange={event =>
                        updateField("slug", event.target.value)
                      }
                      placeholder="lee-insik"
                      inputMode="url"
                      autoCapitalize="none"
                      spellCheck={false}
                      aria-invalid={Boolean(errors.slug)}
                    />
                    <p className="mt-2 text-xs leading-5 text-[#8a8a8a]">
                      영문 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다. 예:
                      /memorial/{slugPreview}/archive
                    </p>
                  </Field>

                  <Field label="가족 대표 성함">
                    <input
                      className={inputClass}
                      value={form.familyContact}
                      onChange={event =>
                        updateField("familyContact", event.target.value)
                      }
                      placeholder="홍길동"
                    />
                  </Field>

                  <Field label="연락처">
                    <input
                      className={inputClass}
                      value={form.familyPhone}
                      onChange={event =>
                        updateField("familyPhone", event.target.value)
                      }
                      placeholder="010-0000-0000"
                    />
                  </Field>
                </div>
              </section>

              <section
                id="story"
                className="scroll-mt-24 border border-[#dbdad7] p-5 md:p-8"
              >
                <SectionHeader number="02" title="삶의 이야기" />

                <div className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_180px]">
                    <Field label="대표 문장">
                      <input
                        className={inputClass}
                        value={form.verse}
                        onChange={event =>
                          updateField("verse", event.target.value)
                        }
                        placeholder="늘 괜찮다 말하며 우리를 먼저 챙기던 사람"
                      />
                    </Field>

                    <Field label="문장 메모">
                      <input
                        className={inputClass}
                        value={form.verseRef}
                        onChange={event =>
                          updateField("verseRef", event.target.value)
                        }
                        placeholder="가족이 기억하는 말"
                      />
                    </Field>
                  </div>

                  <Field label="한 줄 소개" error={errors.summary} required>
                    <input
                      className={inputClass}
                      value={form.summary}
                      onChange={event =>
                        updateField("summary", event.target.value)
                      }
                      placeholder="사랑과 성실함으로 가족의 중심이 되어준 분"
                      aria-invalid={Boolean(errors.summary)}
                    />
                  </Field>

                  <Field label="삶의 기록" error={errors.story} required>
                    <textarea
                      className={textAreaClass}
                      value={form.story}
                      onChange={event =>
                        updateField("story", event.target.value)
                      }
                      placeholder="삶의 여정과 가족이 함께 기억하고 싶은 이야기를 간결하게 적어 주세요."
                      aria-invalid={Boolean(errors.story)}
                    />
                  </Field>
                </div>
              </section>

              <section
                id="timeline"
                className="scroll-mt-24 border border-[#dbdad7] p-5 md:p-8"
              >
                <SectionHeader number="03" title="책과 페이지" />
                <p className="mb-6 text-sm leading-7 text-[#616161]">
                  책을 먼저 만들고, 그 안에 사진과 글을 한 장씩 채워 주세요.
                  저장하면 책장 보기와 연표 보기에 함께 정리됩니다.
                </p>

                <div className="border border-[#dbdad7] bg-[#fffefa] p-4 md:p-5">
                  <div className="flex flex-col gap-4 border-b border-[#dbdad7] pb-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#121212]">
                        책 목록
                      </p>
                      <p className="mt-1 text-xs text-[#616161]">
                        {books.length}권 · 총 {allBookPages.length}페이지
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addBook}
                      className="inline-flex h-10 items-center justify-center gap-2 border border-[#7b8a61] bg-[#7b8a61] px-4 text-sm text-white transition-colors hover:bg-[#66734f]"
                    >
                      <Plus className="h-4 w-4" strokeWidth={1.7} />책 만들기
                    </button>
                  </div>

                  <div className="-mx-1 mt-4 flex gap-3 overflow-x-auto px-1 pb-2">
                    {books.map((book, index) => (
                      <button
                        key={book.id}
                        type="button"
                        onClick={() => {
                          setActiveBookIndex(index);
                          setActivePageIndex(0);
                        }}
                        className={`min-h-28 border p-4 text-left transition-colors ${
                          index === activeBookPosition
                            ? "border-[#18181b] bg-white"
                            : "border-[#dbdad7] bg-[#fbfaf7] hover:border-[#9d927f]"
                        } w-[230px] flex-none`}
                      >
                        <span className="text-[11px] font-medium text-[#9b6b2f]">
                          책 {index + 1}
                        </span>
                        <strong className="mt-2 block truncate text-base font-medium text-[#121212]">
                          {book.title || `책 ${index + 1}`}
                        </strong>
                        <span className="mt-3 block text-xs text-[#616161]">
                          {book.pages.length}페이지
                        </span>
                      </button>
                    ))}
                  </div>

                  {activeBook && (
                    <div className="mt-6 border-t border-[#dbdad7] pt-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="grid flex-1 gap-4 md:grid-cols-2">
                          <label>
                            <span className={labelClass}>책 제목</span>
                            <input
                              className={inputClass}
                              value={activeBook.title}
                              onChange={event =>
                                updateBook(
                                  activeBook.id,
                                  "title",
                                  event.target.value
                                )
                              }
                              placeholder="예: 엄마의 봄날 이야기"
                            />
                          </label>
                          <label>
                            <span className={labelClass}>책 설명</span>
                            <input
                              className={inputClass}
                              value={activeBook.subtitle}
                              onChange={event =>
                                updateBook(
                                  activeBook.id,
                                  "subtitle",
                                  event.target.value
                                )
                              }
                              placeholder="예: 가족이 함께 기억하고 싶은 순간들"
                            />
                          </label>
                        </div>

                        {books.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeBook(activeBook.id)}
                            className="inline-flex h-10 items-center gap-2 self-start px-1 text-sm text-[#616161] transition-colors hover:text-[#121212]"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={1.6} />책
                            삭제
                          </button>
                        )}
                      </div>

                      <div className="mt-6 flex flex-col gap-3 border-y border-[#dbdad7] py-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-medium text-[#121212]">
                            현재 페이지
                          </p>
                          <p className="mt-1 text-xs text-[#616161]">
                            {activePagePosition + 1} / {activeBookPages.length}
                          </p>
                        </div>

                        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
                          <button
                            type="button"
                            onClick={() =>
                              setActivePageIndex(index =>
                                Math.max(index - 1, 0)
                              )
                            }
                            disabled={activePagePosition === 0}
                            className="inline-flex h-10 items-center gap-1 border border-[#dbdad7] bg-white px-3 text-sm text-[#616161] transition-colors hover:text-[#121212] disabled:opacity-40"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            이전
                          </button>
                          <select
                            value={activePagePosition}
                            onChange={event =>
                              setActivePageIndex(Number(event.target.value))
                            }
                            className="h-10 min-w-[150px] max-w-full flex-1 border border-[#dbdad7] bg-white px-3 text-sm text-[#121212] outline-none focus:border-[#18181b] sm:flex-none"
                            aria-label="편집할 페이지 선택"
                          >
                            {activeBookPages.map((page, index) => (
                              <option key={page.id} value={index}>
                                페이지 {index + 1}
                                {page.title ? ` · ${page.title}` : ""}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() =>
                              setActivePageIndex(index =>
                                Math.min(index + 1, activeBookPages.length - 1)
                              )
                            }
                            disabled={
                              activePagePosition >= activeBookPages.length - 1
                            }
                            className="inline-flex h-10 items-center gap-1 border border-[#dbdad7] bg-white px-3 text-sm text-[#616161] transition-colors hover:text-[#121212] disabled:opacity-40"
                          >
                            다음
                            <ChevronRight className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={addBookPage}
                            className="inline-flex h-10 items-center gap-2 border border-[#dbdad7] bg-white px-3 text-sm text-[#121212] transition-colors hover:bg-[#f6f5f2]"
                          >
                            <Plus className="h-4 w-4" strokeWidth={1.6} />
                            페이지 추가
                          </button>
                          {activeBookPages.length > 1 && activePage && (
                            <button
                              type="button"
                              onClick={() =>
                                removeBookPage(activeBook.id, activePage.id)
                              }
                              className="inline-flex h-10 items-center gap-2 px-1 text-sm text-[#616161] transition-colors hover:text-[#121212]"
                            >
                              <Trash2 className="h-4 w-4" strokeWidth={1.6} />
                              페이지 삭제
                            </button>
                          )}
                        </div>
                      </div>

                      {activePage && (
                        <div className="mt-5 grid overflow-hidden border border-[#dbdad7] bg-white lg:grid-cols-[minmax(220px,0.82fr)_minmax(0,1fr)]">
                          <div className="border-b border-[#dbdad7] bg-[#fffdf7] p-5 lg:border-b-0 lg:border-r">
                            <label className={labelClass}>사진</label>
                            <label className="flex aspect-[4/3] w-full flex-col items-center justify-center overflow-hidden border border-dashed border-[#dbdad7] bg-white text-center text-sm text-[#616161] transition-colors hover:border-[#18181b] hover:text-[#121212]">
                              {activePage.photo ? (
                                <img
                                  src={activePage.photo.dataUrl}
                                  alt={`페이지 ${activePagePosition + 1} 사진`}
                                  className="h-full w-full object-cover saturate-[1.05] contrast-[1.01] brightness-[1.02]"
                                />
                              ) : (
                                <>
                                  <ImagePlus
                                    className="mb-2 h-5 w-5"
                                    strokeWidth={1.5}
                                  />
                                  사진 넣기
                                </>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={event =>
                                  updateBookPagePhoto(
                                    activeBook.id,
                                    activePage.id,
                                    event
                                  )
                                }
                                className="sr-only"
                              />
                            </label>
                            {activePage.photo && (
                              <button
                                type="button"
                                onClick={() =>
                                  clearBookPagePhoto(
                                    activeBook.id,
                                    activePage.id
                                  )
                                }
                                className="mt-2 text-xs text-[#616161] underline-offset-4 hover:text-[#121212] hover:underline"
                              >
                                사진 빼기
                              </button>
                            )}
                          </div>

                          <div className="space-y-4 p-5">
                            <div className="grid gap-4 md:grid-cols-[120px_minmax(0,1fr)]">
                              <input
                                className={inputClass}
                                value={activePage.year}
                                onChange={event =>
                                  updateBookPage(
                                    activeBook.id,
                                    activePage.id,
                                    "year",
                                    event.target.value
                                  )
                                }
                                placeholder="연도"
                              />
                              <input
                                className={inputClass}
                                value={activePage.title}
                                onChange={event =>
                                  updateBookPage(
                                    activeBook.id,
                                    activePage.id,
                                    "title",
                                    event.target.value
                                  )
                                }
                                placeholder="페이지 제목"
                              />
                            </div>

                            <textarea
                              className="min-h-40 w-full resize-y border border-[#dbdad7] bg-white p-4 text-sm leading-7 text-[#121212] outline-none transition-colors placeholder:text-[#9a9a9a] focus:border-[#18181b]"
                              value={activePage.description}
                              onChange={event =>
                                updateBookPage(
                                  activeBook.id,
                                  activePage.id,
                                  "description",
                                  event.target.value
                                )
                              }
                              placeholder="사진에 담긴 일, 그때의 마음, 가족이 기억하고 싶은 내용을 적어 주세요."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>

              <section
                id="photos"
                className="scroll-mt-24 border border-[#dbdad7] p-5 md:p-8"
              >
                <SectionHeader number="04" title="사진" />

                <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
                  <div>
                    <label className={labelClass}>대표 사진</label>
                    <label className="flex aspect-[4/5] w-full flex-col items-center justify-center border border-dashed border-[#dbdad7] bg-[#fafafa] text-center text-sm text-[#616161] transition-colors hover:border-[#18181b] hover:text-[#121212]">
                      {portraitPhoto ? (
                        <img
                          src={portraitPhoto.dataUrl}
                          alt="대표 사진 미리보기"
                          className="h-full w-full object-cover saturate-[1.05] contrast-[1.01] brightness-[1.02]"
                        />
                      ) : (
                        <>
                          <Upload className="mb-3 h-6 w-6" strokeWidth={1.5} />
                          사진 선택
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePortraitChange}
                        className="sr-only"
                      />
                    </label>
                    {portraitPhoto && (
                      <p className="mt-3 break-all text-xs text-[#616161]">
                        {portraitPhoto.fileName}
                        {portraitPhoto.compressed ? " · 압축됨" : ""}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>활동 사진</label>
                    <label className="flex min-h-36 w-full flex-col items-center justify-center gap-3 border border-dashed border-[#dbdad7] text-center text-sm text-[#616161] transition-colors hover:border-[#18181b] hover:text-[#121212]">
                      <ImagePlus className="h-6 w-6" strokeWidth={1.5} />
                      <span>
                        사진 추가 ({galleryPhotos.length}/{MAX_GALLERY_PHOTOS})
                      </span>
                      <span className="text-xs text-[#8a8172]">
                        여러 장을 나눠서 계속 추가할 수 있습니다.
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleGalleryChange}
                        className="sr-only"
                      />
                    </label>

                    {galleryPhotos.length > 0 && (
                      <>
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <p className="text-xs text-[#616161]">
                            선택한 활동 사진 {galleryPhotos.length}장
                          </p>
                          <button
                            type="button"
                            onClick={clearGalleryPhotos}
                            className="text-xs text-[#616161] underline-offset-4 hover:text-[#121212] hover:underline"
                          >
                            전체 비우기
                          </button>
                        </div>
                        <div className="mt-3 max-h-[420px] overflow-y-auto border border-[#dbdad7] bg-[#f6f5f2] p-1">
                          <div className="grid grid-cols-4 gap-1 sm:grid-cols-6 lg:grid-cols-8">
                            {galleryPhotos.map((photo, index) => (
                              <div
                                key={`${photo.fileName}-${index}`}
                                className="group relative border border-white bg-white"
                              >
                                <img
                                  src={photo.dataUrl}
                                  alt={`활동 사진 ${index + 1}`}
                                  className="aspect-square w-full object-cover saturate-[1.05] contrast-[1.01] brightness-[1.02]"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeGalleryPhoto(index)}
                                  className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center bg-white/92 text-[#121212] shadow-sm transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                                  aria-label={`활동 사진 ${index + 1} 삭제`}
                                >
                                  <Trash2
                                    className="h-3.5 w-3.5"
                                    strokeWidth={1.7}
                                  />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </section>

              <section
                id="settings"
                className="scroll-mt-24 border border-[#dbdad7] p-5 md:p-8"
              >
                <SectionHeader number="05" title="공개 설정" />

                <div className="grid gap-6 md:grid-cols-2">
                  <Field label="공개 범위">
                    <div className="grid gap-px border border-[#dbdad7] bg-[#dbdad7] sm:grid-cols-2">
                      {visibilityOptions.map(option => {
                        const selected = form.visibility === option.value;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => updateVisibility(option.value)}
                            aria-pressed={selected}
                            className={`min-h-24 bg-white p-4 text-left transition-colors ${
                              selected
                                ? "text-[#121212] ring-1 ring-inset ring-[#18181b]"
                                : "text-[#616161] hover:bg-[#faf9f6]"
                            }`}
                          >
                            <span className="block text-base font-medium">
                              {option.label}
                            </span>
                            <span className="mt-2 block text-xs leading-5">
                              {option.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-3 text-xs leading-6 text-[#616161]">
                      기본 정보는 검색 결과에 표시됩니다. 비공개로 설정하면
                      비밀번호를 아는 분만 인생기념관에 들어갈 수 있습니다.
                    </p>
                  </Field>

                  {form.visibility === "private" && (
                    <Field
                      label="인생기념관 입장 비밀번호"
                      error={errors.accessPassword}
                      required
                    >
                      <input
                        type="password"
                        className={inputClass}
                        value={form.accessPassword}
                        onChange={event =>
                          updateField("accessPassword", event.target.value)
                        }
                        placeholder="비밀번호를 입력해 주세요"
                        aria-invalid={Boolean(errors.accessPassword)}
                      />
                    </Field>
                  )}
                </div>
              </section>

              <section className="border border-[#dbdad7] p-5 md:p-6">
                <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <div>
                    <p className="text-sm font-medium text-[#121212]">
                      {submitted
                        ? "인생기념관이 생성되었습니다."
                        : "입력 내용을 확인해 주세요."}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#616161]">
                      {notice ||
                        "작성한 내용은 인생기념관으로 저장됩니다. 이후 필요한 내용은 이어서 보완할 수 있습니다."}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={saveDraft}
                      className="inline-flex h-11 items-center justify-center gap-2 border border-[#dbdad7] px-5 text-sm transition-colors hover:bg-[#f6f5f2]"
                    >
                      <Save className="h-4 w-4" strokeWidth={1.6} />
                      임시저장
                    </button>
                    <Link href="/">
                      <button
                        type="button"
                        className="h-11 w-full border border-[#dbdad7] px-5 text-sm transition-colors hover:bg-[#f6f5f2] sm:w-auto"
                      >
                        홈으로
                      </button>
                    </Link>
                    <button
                      type="submit"
                      disabled={createMemorialMutation.isPending}
                      className="inline-flex h-11 items-center justify-center gap-2 bg-[#18181b] px-5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                    >
                      {createMemorialMutation.isPending
                        ? "저장 중"
                        : "인생기념관 생성"}
                      <ArrowRight className="h-4 w-4" strokeWidth={1.6} />
                    </button>
                  </div>
                </div>
              </section>

              {submitted && (
                <section className="border border-[#18181b] p-5 md:p-6">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center bg-[#18181b] text-white">
                      <Check className="h-4 w-4" strokeWidth={1.7} />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-[#121212]">
                        생성 완료
                      </p>
                      <dl className="mt-4 grid gap-3 text-sm text-[#616161] sm:grid-cols-2">
                        <SummaryItem label="성함" value={form.name} />
                        <SummaryItem label="호칭" value={form.role} />
                        <SummaryItem
                          label="인생기념관 주소(URL)"
                          value={
                            createdMemorial?.href || `/memorial/${slugPreview}`
                          }
                        />
                        <SummaryItem
                          label="상태"
                          value={
                            createdMemorial?.status === "published"
                              ? "등록 완료"
                              : createdMemorial?.status || "등록 완료"
                          }
                        />
                      </dl>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="mb-8 flex items-baseline justify-between gap-4 border-b border-[#dbdad7] pb-5">
      <h2
        className="text-2xl font-normal"
        style={{ fontFamily: "'Noto Serif KR', serif" }}
      >
        {title}
      </h2>
      <span className="text-xs text-[#616161]">{number}</span>
    </div>
  );
}

function Field({
  label,
  children,
  error,
  required,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className={labelClass}>
        {label}
        {required && <span className="ml-1 text-[#121212]">*</span>}
      </label>
      {children}
      {error && <p className={errorClass}>{error}</p>}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-[#dbdad7] pt-3">
      <dt className="text-xs text-[#616161]">{label}</dt>
      <dd className="mt-1 break-all text-[#121212]">{value || "-"}</dd>
    </div>
  );
}
