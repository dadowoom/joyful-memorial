import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import type { User } from "../drizzle/schema";
import {
  createMemorial,
  createMemorialBook,
  createMemorialBookPage,
  createMemorialGalleryPhoto,
  createMemorialLetter,
  createLocalUser,
  createMemorialReminderSubscription,
  canReadMemorial,
  deleteMemorial,
  getAdminMemorialById,
  getAdminMemorialBySlug,
  getUserByEmail,
  getMemorialFamilyRoomStatus,
  getMemorialAccessStatus,
  getPublicMemorialBySlug,
  hashMemorialAccessPassword,
  listAdminMemorials,
  listMemorialLetters,
  listMemorialBooks,
  listPublicMemorials,
  listRecentMemorialLetters,
  listUserMemorials,
  normalizeEmail,
  searchPublicMemorials,
  updateMemorial,
  updateUserPassword,
  upsertMemorialFamilyRoomPassword,
  upsertUser,
  verifyUserPassword,
  verifyMemorialAccessPassword,
  verifyMemorialFamilyRoomPassword,
} from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { decodeImageDataUrl } from "./_core/imageUpload";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import {
  adminProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from "./_core/trpc";
import { bookRouter } from "./routers/book";
import { galleryRouter } from "./routers/gallery";
import { uploadRouter } from "./routers/upload";
import { videoRouter } from "./routers/video";
import { storagePut } from "./storage";

const bookPageCreateInput = z.object({
  year: z.string().trim().max(20).optional(),
  title: z.string().trim().max(300).optional(),
  content: z.string().trim().max(20000).optional(),
  dateYear: z.number().min(1800).max(2200).optional(),
  photo: z
    .object({
      dataUrl: z.string().max(8_500_000),
      fileName: z.string().trim().min(1).max(240),
    })
    .optional(),
});

const memorialCreateInput = z.object({
  name: z.string().trim().min(1).max(120),
  role: z.string().trim().min(1).max(80),
  birthDate: z.string().trim().min(1).max(20),
  deathDate: z.string().trim().max(20).default(""),
  recordType: z.enum(["faith", "memorial"]).default("faith"),
  church: z.string().trim().max(160).default("우리 가족"),
  familyContact: z.string().trim().max(120).optional(),
  familyPhone: z.string().trim().max(80).optional(),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: "주소는 영문 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다.",
    })
    .optional(),
  verse: z.string().trim().max(1000).optional(),
  verseRef: z.string().trim().max(120).optional(),
  summary: z.string().trim().min(1).max(255),
  story: z.string().trim().min(1).max(10000),
  servicePlace: z.string().trim().max(255).optional(),
  serviceTime: z.string().trim().max(40).optional(),
  memorialDay: z.string().trim().max(40).optional(),
  visibility: z.enum(["public", "private"]).default("public"),
  accessPassword: z.string().trim().max(80).optional(),
  managerMemo: z.string().trim().max(2000).optional(),
  timeline: z
    .array(
      z.object({
        year: z.string().trim().max(20),
        title: z.string().trim().max(160),
        description: z.string().trim().max(1000),
      })
    )
    .max(200)
    .default([]),
  photos: z
    .array(
      z.object({
        dataUrl: z.string().max(8_500_000),
        fileName: z.string().trim().min(1).max(240),
        caption: z.string().trim().max(500).optional(),
        year: z.string().trim().max(20).optional(),
        isRepresentative: z.boolean().optional(),
      })
    )
    .max(25)
    .default([]),
  bookPages: z.array(bookPageCreateInput).max(80).default([]),
  books: z
    .array(
      z.object({
        title: z.string().trim().max(300).optional(),
        subtitle: z.string().trim().max(300).optional(),
        pages: z.array(bookPageCreateInput).max(80).default([]),
      })
    )
    .max(20)
    .default([]),
});

const letterCreateInput = z
  .object({
    memorialSlug: z.string().trim().min(1).max(120).optional(),
    accessToken: z.string().trim().max(128).optional(),
    recipientName: z.string().trim().min(1).max(120).optional(),
    recipientRole: z.string().trim().max(80).optional(),
    author: z.string().trim().min(1).max(80),
    content: z.string().trim().min(1).max(2000),
  })
  .superRefine((value, ctx) => {
    if (value.memorialSlug || value.recipientName) return;
    ctx.addIssue({
      code: "custom",
      path: ["recipientName"],
      message: "받는 분을 입력해주세요.",
    });
  });

const familyRoomVerifyInput = z.object({
  memorialSlug: z.string().trim().min(1).max(120),
  password: z.string().trim().min(1).max(100),
});

const reminderSubscribeInput = z.object({
  memorialSlug: z.string().trim().min(1).max(120),
  phone: z
    .string()
    .trim()
    .min(10)
    .max(20)
    .regex(/^[0-9\-\s+()]+$/, "휴대폰 번호 형식으로 입력해주세요."),
  consent: z.literal(true),
});

const authSignupInput = z.object({
  name: z.string().trim().min(2, "성함을 입력해주세요.").max(80),
  email: z.string().trim().email("이메일 형식으로 입력해주세요.").max(320),
  phone: z
    .string()
    .trim()
    .max(30)
    .regex(/^[0-9\-\s+()]*$/, "휴대폰 번호 형식으로 입력해주세요.")
    .optional(),
  password: z.string().min(8, "비밀번호는 8자 이상 입력해주세요.").max(100),
});

const authLoginInput = z.object({
  email: z.string().trim().email("이메일 형식으로 입력해주세요.").max(320),
  password: z.string().min(1, "비밀번호를 입력해주세요.").max(100),
});

const authChangePasswordInput = z.object({
  currentPassword: z.string().min(1, "현재 비밀번호를 입력해주세요.").max(100),
  newPassword: z
    .string()
    .min(8, "새 비밀번호는 8자 이상 입력해주세요.")
    .max(100),
});

const textDisplaySizeSchema = z.enum(["auto", "small", "normal", "large"]);

const memorialUpdateInput = z.object({
  id: z.number(),
  name: z.string().trim().min(1).max(120).optional(),
  role: z.string().trim().min(1).max(80).optional(),
  birthDate: z.string().trim().min(1).max(20).optional(),
  deathDate: z.string().trim().max(20).optional(),
  recordType: z.enum(["faith", "memorial"]).optional(),
  church: z.string().trim().min(1).max(160).optional(),
  familyContact: z.string().trim().max(120).nullable().optional(),
  familyPhone: z.string().trim().max(80).nullable().optional(),
  verse: z.string().trim().max(1000).nullable().optional(),
  verseRef: z.string().trim().max(120).nullable().optional(),
  summary: z.string().trim().min(1).max(255).optional(),
  summaryDisplaySize: textDisplaySizeSchema.optional(),
  story: z.string().trim().min(1).max(10000).optional(),
  storyDisplaySize: textDisplaySizeSchema.optional(),
  servicePlace: z.string().trim().max(255).nullable().optional(),
  serviceTime: z.string().trim().max(40).nullable().optional(),
  memorialDay: z.string().trim().max(40).nullable().optional(),
  visibility: z.enum(["public", "private"]).optional(),
  accessPassword: z.string().trim().max(80).optional(),
  status: z.enum(["published", "private"]).optional(),
  managerMemo: z.string().trim().max(2000).nullable().optional(),
  timeline: z
    .array(
      z.object({
        year: z.string().trim().max(20),
        title: z.string().trim().max(160),
        description: z.string().trim().max(1000),
      })
    )
    .max(30)
    .optional(),
});

const withLetterLinks = <T extends { memorialSlug: string | null }>(
  letter: T
) => ({
  ...letter,
  memorialHref: letter.memorialSlug ? `/memorial/${letter.memorialSlug}` : null,
});

const toPublicUser = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  loginMethod: user.loginMethod,
  role: user.role,
  approvalStatus: user.approvalStatus,
  approvedAt: user.approvedAt,
  createdAt: user.createdAt,
  lastSignedIn: user.lastSignedIn,
});

const parseTimelineJson = (timelineJson?: string | null) => {
  if (!timelineJson) return [];

  try {
    const timeline = JSON.parse(timelineJson);
    if (!Array.isArray(timeline)) return [];
    return timeline.filter(
      item =>
        typeof item === "object" &&
        item !== null &&
        typeof item.year === "string" &&
        typeof item.title === "string" &&
        typeof item.description === "string"
    );
  } catch {
    return [];
  }
};

type EditableMemorial = NonNullable<
  Awaited<ReturnType<typeof getAdminMemorialBySlug>>
>;

const toEditableMemorial = (
  memorial: EditableMemorial,
  options: { includeManagerMemo?: boolean } = {}
) => {
  const { accessPasswordHash, ...safeMemorial } = memorial;

  return {
    ...safeMemorial,
    managerMemo: options.includeManagerMemo ? memorial.managerMemo : null,
    timeline: parseTimelineJson(memorial.timelineJson),
    hasAccessPassword: Boolean(accessPasswordHash),
    href:
      memorial.visibility !== "private" && memorial.recordType === "faith"
        ? `/memorial/${memorial.slug}/archive`
        : `/memorial/${memorial.slug}`,
  };
};

const ensureOwnMemorial = async (slug: string, user: User) => {
  const memorial = await getAdminMemorialBySlug(slug);
  if (!memorial) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "기념관을 찾을 수 없습니다.",
    });
  }

  if (memorial.ownerUserId !== user.id) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "이 기념관을 관리할 권한이 없습니다.",
    });
  }

  return memorial;
};

const makeMemorialUpdateData = (
  input: z.infer<typeof memorialUpdateInput>,
  existing: Pick<EditableMemorial, "accessPasswordHash">,
  options: { allowManagerMemo: boolean; allowStatus: boolean }
) => {
  const {
    id: _id,
    accessPassword,
    timeline,
    visibility,
    status,
    managerMemo,
    ...data
  } = input;

  const updateData: Parameters<typeof updateMemorial>[1] = {
    ...data,
  };

  if (options.allowManagerMemo && managerMemo !== undefined) {
    updateData.managerMemo = managerMemo;
  }

  if (data.recordType === "faith") {
    updateData.deathDate = "";
    updateData.memorialDay = null;
  }

  if (visibility) {
    updateData.visibility = visibility;
    updateData.status = visibility === "private" ? "private" : "published";
  } else if (options.allowStatus && status) {
    updateData.status = status;
  }

  if (timeline) {
    const cleanedTimeline = timeline.filter(
      item => item.year || item.title || item.description
    );
    updateData.timelineJson = JSON.stringify(cleanedTimeline);
  }

  if (visibility === "public") {
    updateData.accessPasswordHash = null;
  } else if (accessPassword?.trim()) {
    updateData.accessPasswordHash = hashMemorialAccessPassword(accessPassword);
  } else if (visibility === "private" && !existing.accessPasswordHash) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "비공개 기념관은 입장 비밀번호가 필요합니다.",
    });
  }

  return updateData;
};

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts =>
      opts.ctx.user ? toPublicUser(opts.ctx.user) : null
    ),
    signup: publicProcedure
      .input(authSignupInput)
      .mutation(async ({ ctx, input }) => {
        const created = await createLocalUser({
          name: input.name,
          email: input.email,
          phone: input.phone,
          password: input.password,
        });

        if (!created) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "이미 가입된 이메일입니다.",
          });
        }

        if (created.approvalStatus === "approved") {
          const sessionToken = await sdk.createSessionToken(created.openId, {
            name: created.name || normalizeEmail(input.email),
            expiresInMs: ONE_YEAR_MS,
          });
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, {
            ...cookieOptions,
            maxAge: ONE_YEAR_MS,
          });
        }

        return {
          user: toPublicUser(created),
          approvalStatus: created.approvalStatus,
          firstAdmin: created.role === "admin",
        };
      }),
    login: publicProcedure
      .input(authLoginInput)
      .mutation(async ({ ctx, input }) => {
        const user = await getUserByEmail(input.email);
        if (
          !user?.passwordHash ||
          !verifyUserPassword(input.password, user.passwordHash)
        ) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "이메일 또는 비밀번호가 맞지 않습니다.",
          });
        }

        const signedInAt = new Date();
        await upsertUser({
          openId: user.openId,
          approvalStatus: "approved",
          approvedAt: user.approvedAt ?? signedInAt,
          lastSignedIn: signedInAt,
        });

        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || normalizeEmail(input.email),
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });

        return {
          user: toPublicUser({
            ...user,
            approvalStatus: "approved",
            approvedAt: user.approvedAt ?? signedInAt,
            lastSignedIn: signedInAt,
          }),
        };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    changePassword: protectedProcedure
      .input(authChangePasswordInput)
      .mutation(async ({ ctx, input }) => {
        if (
          !ctx.user.passwordHash ||
          !verifyUserPassword(input.currentPassword, ctx.user.passwordHash)
        ) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "현재 비밀번호가 맞지 않습니다.",
          });
        }

        await updateUserPassword(ctx.user.id, input.newPassword);
        return { success: true };
      }),
  }),

  memorial: router({
    adminList: adminProcedure.query(async () => {
      const memorials = await listAdminMemorials();
      return memorials.map(memorial => ({
        ...memorial,
        isPrivate: memorial.visibility === "private",
        href:
          memorial.visibility !== "private" && memorial.recordType === "faith"
            ? `/memorial/${memorial.slug}/archive`
            : `/memorial/${memorial.slug}`,
        editHref: `/admin/memorials/${memorial.slug}/edit`,
      }));
    }),

    adminBySlug: adminProcedure
      .input(z.object({ slug: z.string().trim().min(1).max(120) }))
      .query(async ({ input }) => {
        const memorial = await getAdminMemorialBySlug(input.slug);
        if (!memorial) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "기념관을 찾을 수 없습니다.",
          });
        }

        return toEditableMemorial(memorial, { includeManagerMemo: true });
      }),

    myList: protectedProcedure.query(async ({ ctx }) => {
      const memorials = await listUserMemorials(ctx.user.id);
      return memorials.map(memorial => ({
        ...memorial,
        isPrivate: memorial.visibility === "private",
        href:
          memorial.visibility !== "private" && memorial.recordType === "faith"
            ? `/memorial/${memorial.slug}/archive`
            : `/memorial/${memorial.slug}`,
        editHref: `/mypage/memorials/${memorial.slug}/edit`,
      }));
    }),

    manageBySlug: protectedProcedure
      .input(z.object({ slug: z.string().trim().min(1).max(120) }))
      .query(async ({ ctx, input }) => {
        const memorial = await ensureOwnMemorial(input.slug, ctx.user);
        return toEditableMemorial(memorial, { includeManagerMemo: false });
      }),

    list: publicProcedure.query(async () => {
      const memorials = await listPublicMemorials();

      return memorials.map(memorial => ({
        ...memorial,
        href:
          memorial.recordType === "faith"
            ? `/memorial/${memorial.slug}/archive`
            : `/memorial/${memorial.slug}`,
      }));
    }),

    search: publicProcedure
      .input(z.object({ keyword: z.string().trim().min(2).max(80) }))
      .query(async ({ input }) => {
        const memorials = await searchPublicMemorials(input.keyword);

        return memorials.map(memorial => ({
          ...memorial,
          isPrivate: memorial.visibility === "private",
          href:
            memorial.visibility !== "private" && memorial.recordType === "faith"
              ? `/memorial/${memorial.slug}/archive`
              : `/memorial/${memorial.slug}`,
        }));
      }),

    accessStatus: publicProcedure
      .input(z.object({ slug: z.string().trim().min(1).max(120) }))
      .query(async ({ input }) => {
        const status = await getMemorialAccessStatus(input.slug);
        if (!status) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "기념관을 찾을 수 없습니다.",
          });
        }

        return status;
      }),

    verifyAccess: publicProcedure
      .input(
        z.object({
          slug: z.string().trim().min(1).max(120),
          password: z.string().trim().min(1).max(80),
        })
      )
      .mutation(async ({ input }) => {
        const access = await verifyMemorialAccessPassword(input);
        if (access === null) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "기념관을 찾을 수 없습니다.",
          });
        }

        if (access === false) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "비밀번호가 맞지 않습니다.",
          });
        }

        return access;
      }),

    bySlug: publicProcedure
      .input(
        z.object({
          slug: z.string().trim().min(1).max(120),
          accessToken: z.string().trim().max(128).optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        const memorial = await getPublicMemorialBySlug(input.slug);
        if (!memorial) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "기념관을 찾을 수 없습니다.",
          });
        }

        const canManage =
          ctx.user?.role === "admin" || memorial.ownerUserId === ctx.user?.id;

        if (!canManage && !canReadMemorial(memorial, input.accessToken)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "비공개 기념관입니다.",
          });
        }

        let timeline: Array<{
          year: string;
          title: string;
          description: string;
        }> = [];

        if (memorial.timelineJson) {
          try {
            timeline = JSON.parse(memorial.timelineJson);
          } catch {
            timeline = [];
          }
        }

        const { accessPasswordHash, ownerUserId, ...safeMemorial } = memorial;

        return {
          ...safeMemorial,
          timeline,
          href: `/memorial/${safeMemorial.slug}`,
          canManage,
        };
      }),

    create: protectedProcedure
      .input(memorialCreateInput)
      .mutation(async ({ ctx, input }) => {
        if (input.visibility === "private" && !input.accessPassword?.trim()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "비공개 기념관은 입장 비밀번호가 필요합니다.",
          });
        }

        const timeline = input.timeline.filter(
          item => item.year || item.title || item.description
        );

        const created = await createMemorial({
          ownerUserId: ctx.user.id,
          name: input.name,
          role: input.role,
          birthDate: input.birthDate,
          deathDate: input.recordType === "memorial" ? input.deathDate : "",
          recordType: input.recordType,
          church: input.church || "우리 가족",
          familyContact: input.familyContact || null,
          familyPhone: input.familyPhone || null,
          slug: input.slug || input.name,
          verse: input.verse || null,
          verseRef: input.verseRef || null,
          summary: input.summary,
          story: input.story,
          servicePlace: input.servicePlace || null,
          serviceTime: input.serviceTime || null,
          memorialDay:
            input.recordType === "memorial" ? input.memorialDay || null : null,
          visibility: input.visibility,
          accessPasswordHash:
            input.visibility === "private" && input.accessPassword
              ? hashMemorialAccessPassword(input.accessPassword)
              : null,
          status: "published",
          timelineJson: JSON.stringify(timeline),
          managerMemo: input.managerMemo || null,
        });

        await Promise.all(
          input.photos.map(async (photo, index) => {
            const { buffer, mimeType, ext } = decodeImageDataUrl(photo.dataUrl);
            const key = `gallery/${created.id}/${nanoid()}.${ext}`;
            const { url } = await storagePut(key, buffer, mimeType);

            await createMemorialGalleryPhoto({
              memorialId: created.id,
              photoUrl: url,
              photoKey: key,
              caption: photo.caption || null,
              year: photo.year || null,
              sortOrder: index,
              isRepresentative: photo.isRepresentative ? 1 : 0,
            });
          })
        );

        const hasBookPageContent = (page: (typeof input.bookPages)[number]) =>
          Boolean(
            page.year?.trim() ||
              page.title?.trim() ||
              page.content?.trim() ||
              page.photo
          );

        const legacyBookPages = input.bookPages.filter(hasBookPageContent);
        const inputBooks = input.books
          .map((book, index) => ({
            title: book.title?.trim() || `책 ${index + 1}`,
            subtitle: book.subtitle?.trim() || null,
            pages: book.pages.filter(
              page =>
                page.year?.trim() ||
                page.title?.trim() ||
                page.content?.trim() ||
                page.photo
            ),
          }))
          .filter(book => book.pages.length > 0);

        const booksToCreate =
          inputBooks.length > 0
            ? inputBooks
            : legacyBookPages.length > 0
              ? [
                  {
                    title: `${created.name}의 인생 이야기`,
                    subtitle: "사진과 글로 남기는 가족의 기록",
                    pages: legacyBookPages,
                  },
                ]
              : [];

        for (
          let bookIndex = 0;
          bookIndex < booksToCreate.length;
          bookIndex += 1
        ) {
          const bookInput = booksToCreate[bookIndex];

          const uploadedPagePhotos = await Promise.all(
            bookInput.pages.map(async page => {
              if (!page.photo) return { url: null, key: null };

              const { buffer, mimeType, ext } = decodeImageDataUrl(
                page.photo.dataUrl
              );
              const key = `book-pages/${created.id}/${nanoid()}.${ext}`;
              const { url } = await storagePut(key, buffer, mimeType);
              return { url, key };
            })
          );
          const coverPhoto =
            uploadedPagePhotos.find(photo => photo.url && photo.key) ?? null;

          await createMemorialBook({
            memorialId: created.id,
            title: bookInput.title,
            subtitle: bookInput.subtitle,
            coverPhotoUrl: coverPhoto?.url ?? null,
            coverPhotoKey: coverPhoto?.key ?? null,
            publishedYear: new Date().getFullYear().toString(),
            sortOrder: bookIndex,
          });

          const createdBooks = await listMemorialBooks(created.id);
          const book =
            createdBooks.find(item => item.sortOrder === bookIndex) ??
            createdBooks[createdBooks.length - 1];

          if (!book) continue;

          await Promise.all(
            bookInput.pages.map(async (page, index) => {
              const pagePhoto = uploadedPagePhotos[index];

              const yearFromText =
                page.year?.trim().match(/^\d{4}$/)?.[0] ?? null;

              await createMemorialBookPage({
                bookId: book.id,
                title: page.title || "삶의 한 장",
                content: page.content || null,
                photoUrl: pagePhoto?.url ?? null,
                photoKey: pagePhoto?.key ?? null,
                dateYear:
                  page.dateYear ?? (yearFromText ? Number(yearFromText) : null),
                dateMonth: null,
                dateDay: null,
                sortOrder: index,
              });
            })
          );
        }

        return {
          id: created.id,
          slug: created.slug,
          status: created.status,
          href:
            input.visibility !== "private" && created.recordType === "faith"
              ? `/memorial/${created.slug}/archive`
              : `/memorial/${created.slug}`,
        };
      }),

    update: adminProcedure
      .input(memorialUpdateInput)
      .mutation(async ({ input }) => {
        const existing = await getAdminMemorialById(input.id);
        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "기념관을 찾을 수 없습니다.",
          });
        }

        const updateData = makeMemorialUpdateData(input, existing, {
          allowManagerMemo: true,
          allowStatus: true,
        });
        await updateMemorial(input.id, updateData);
        return { success: true };
      }),

    updateMine: protectedProcedure
      .input(memorialUpdateInput)
      .mutation(async ({ ctx, input }) => {
        const existing = await getAdminMemorialById(input.id);
        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "기념관을 찾을 수 없습니다.",
          });
        }

        if (existing.ownerUserId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "이 기념관을 관리할 권한이 없습니다.",
          });
        }

        const updateData = makeMemorialUpdateData(input, existing, {
          allowManagerMemo: false,
          allowStatus: false,
        });
        await updateMemorial(input.id, updateData);
        return { success: true };
      }),

    updateAccessPassword: protectedProcedure
      .input(
        z.object({
          slug: z.string().trim().min(1).max(120),
          password: z.string().trim().min(4).max(80),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const memorial = await ensureOwnMemorial(input.slug, ctx.user);
        await updateMemorial(memorial.id, {
          visibility: "private",
          status: "private",
          accessPasswordHash: hashMemorialAccessPassword(input.password),
        });

        return { success: true };
      }),

    updateFamilyPassword: protectedProcedure
      .input(
        z.object({
          slug: z.string().trim().min(1).max(120),
          password: z.string().trim().min(4).max(80),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const memorial = await ensureOwnMemorial(input.slug, ctx.user);
        const result = await upsertMemorialFamilyRoomPassword(
          memorial.id,
          input.password
        );
        if (!result) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "기념관을 찾을 수 없습니다.",
          });
        }

        return { success: true };
      }),

    deleteMine: protectedProcedure
      .input(
        z.object({
          slug: z.string().trim().min(1).max(120),
          confirmName: z.string().trim().min(1).max(120),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const memorial = await ensureOwnMemorial(input.slug, ctx.user);
        if (input.confirmName !== memorial.name) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "삭제 확인을 위해 성함을 정확히 입력해주세요.",
          });
        }

        await deleteMemorial(memorial.id);
        return { success: true };
      }),
  }),

  letter: router({
    recent: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(100).default(100) }))
      .query(async ({ input }) => {
        const letters = await listRecentMemorialLetters(input.limit);
        return letters.map(withLetterLinks);
      }),

    byMemorial: publicProcedure
      .input(
        z.object({
          memorialSlug: z.string().trim().min(1).max(120),
          accessToken: z.string().trim().max(128).optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        const memorial = await getPublicMemorialBySlug(input.memorialSlug);
        if (!memorial) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "기념관을 찾을 수 없습니다.",
          });
        }
        const canManage =
          ctx.user?.role === "admin" || memorial.ownerUserId === ctx.user?.id;
        if (!canManage && !canReadMemorial(memorial, input.accessToken)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "비공개 기념관입니다.",
          });
        }

        const letters = await listMemorialLetters(input.memorialSlug);
        return letters.map(withLetterLinks);
      }),

    create: publicProcedure
      .input(letterCreateInput)
      .mutation(async ({ ctx, input }) => {
        if (input.memorialSlug) {
          const memorial = await getPublicMemorialBySlug(input.memorialSlug);
          if (!memorial) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "기념관을 찾을 수 없습니다.",
            });
          }
          const canManage =
            ctx.user?.role === "admin" || memorial.ownerUserId === ctx.user?.id;
          if (!canManage && !canReadMemorial(memorial, input.accessToken)) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "비공개 기념관입니다.",
            });
          }
        }

        const created = await createMemorialLetter(input);
        if (!created) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: input.memorialSlug
              ? "기념관을 찾을 수 없습니다."
              : "마음글을 남길 수 없습니다.",
          });
        }

        return withLetterLinks(created);
      }),
  }),

  familyRoom: router({
    status: publicProcedure
      .input(z.object({ memorialSlug: z.string().trim().min(1).max(120) }))
      .query(async ({ input }) => {
        const status = await getMemorialFamilyRoomStatus(input.memorialSlug);
        if (!status) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "기념관을 찾을 수 없습니다.",
          });
        }

        return status;
      }),

    verify: publicProcedure
      .input(familyRoomVerifyInput)
      .mutation(async ({ input }) => {
        const room = await verifyMemorialFamilyRoomPassword(
          input.memorialSlug,
          input.password
        );

        if (room === null) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "가족관을 찾을 수 없습니다.",
          });
        }

        if (room === false) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "비밀번호가 맞지 않습니다.",
          });
        }

        return room;
      }),
  }),

  reminder: router({
    subscribe: publicProcedure
      .input(reminderSubscribeInput)
      .mutation(async ({ input }) => {
        const subscribed = await createMemorialReminderSubscription({
          memorialSlug: input.memorialSlug,
          phone: input.phone,
        });

        if (!subscribed) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "기념관을 찾을 수 없습니다.",
          });
        }

        return subscribed;
      }),
  }),

  gallery: galleryRouter,
  video: videoRouter,
  book: bookRouter,
  upload: uploadRouter,

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
