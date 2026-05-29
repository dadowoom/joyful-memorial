import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  canReadMemorial,
  createMemorialBook,
  createMemorialBookPage,
  deleteMemorialBook,
  deleteMemorialBookPage,
  getAdminMemorialById,
  getMemorialBookById,
  getMemorialBookPageById,
  listMemorialBookPages,
  listMemorialBooks,
  updateMemorialBook,
  updateMemorialBookPage,
} from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import type { User } from "../../drizzle/schema";

const nullableText = z.string().trim().nullable().optional();
const bookListInput = z.object({
  memorialId: z.number(),
  accessToken: z.string().trim().max(128).optional(),
});
const bookGetInput = z.object({
  id: z.number(),
  accessToken: z.string().trim().max(128).optional(),
});

async function assertCanManageMemorial(memorialId: number, user: User) {
  const memorial = await getAdminMemorialById(memorialId);
  if (!memorial) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "기념관을 찾을 수 없습니다.",
    });
  }

  if (user.role !== "admin" && memorial.ownerUserId !== user.id) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "이 기념관을 관리할 권한이 없습니다.",
    });
  }
}

async function assertCanManageBook(bookId: number, user: User) {
  const book = await getMemorialBookById(bookId);
  if (!book) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "책을 찾을 수 없습니다.",
    });
  }

  await assertCanManageMemorial(book.memorialId, user);
  return book;
}

async function assertCanManagePage(pageId: number, user: User) {
  const page = await getMemorialBookPageById(pageId);
  if (!page) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "페이지를 찾을 수 없습니다.",
    });
  }

  await assertCanManageBook(page.bookId, user);
  return page;
}

async function assertCanReadMemorialBooks(
  memorialId: number,
  user?: User | null,
  accessToken?: string
) {
  const memorial = await getAdminMemorialById(memorialId);
  if (!memorial) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "기념관을 찾을 수 없습니다.",
    });
  }

  if (
    user?.role === "admin" ||
    memorial.ownerUserId === user?.id ||
    canReadMemorial(memorial, accessToken)
  ) {
    return;
  }

  throw new TRPCError({
    code: "FORBIDDEN",
    message: "비공개 기념관입니다.",
  });
}

export const bookRouter = router({
  listByMemorial: publicProcedure
    .input(bookListInput)
    .query(async ({ ctx, input }) => {
      await assertCanReadMemorialBooks(
        input.memorialId,
        ctx.user,
        input.accessToken
      );
      const books = await listMemorialBooks(input.memorialId);
      return Promise.all(
        books.map(async book => ({
          ...book,
          pages: await listMemorialBookPages(book.id),
        }))
      );
    }),

  getById: publicProcedure
    .input(bookGetInput)
    .query(async ({ ctx, input }) => {
      const book = await getMemorialBookById(input.id);
      if (!book) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "책을 찾을 수 없습니다.",
        });
      }
      await assertCanReadMemorialBooks(
        book.memorialId,
        ctx.user,
        input.accessToken
      );
      return { ...book, pages: await listMemorialBookPages(book.id) };
    }),

  create: protectedProcedure
    .input(
      z.object({
        memorialId: z.number(),
        title: z.string().trim().min(1).max(300),
        subtitle: z.string().trim().max(300).optional(),
        coverPhotoUrl: z.string().trim().optional(),
        coverPhotoKey: z.string().trim().optional(),
        publishedYear: z.string().trim().max(20).optional(),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertCanManageMemorial(input.memorialId, ctx.user);
      await createMemorialBook({
        memorialId: input.memorialId,
        title: input.title,
        subtitle: input.subtitle || null,
        coverPhotoUrl: input.coverPhotoUrl || null,
        coverPhotoKey: input.coverPhotoKey || null,
        publishedYear: input.publishedYear || null,
        sortOrder: input.sortOrder ?? 0,
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().trim().min(1).max(300).optional(),
        subtitle: nullableText,
        coverPhotoUrl: nullableText,
        coverPhotoKey: nullableText,
        publishedYear: nullableText,
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await assertCanManageBook(id, ctx.user);
      await updateMemorialBook(id, data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await assertCanManageBook(input.id, ctx.user);
      await deleteMemorialBook(input.id);
      return { success: true };
    }),

  addPage: protectedProcedure
    .input(
      z.object({
        bookId: z.number(),
        title: z.string().trim().max(300).optional(),
        content: z.string().trim().max(20000).optional(),
        photoUrl: z.string().trim().optional(),
        photoKey: z.string().trim().optional(),
        dateYear: z.number().min(1800).max(2200).optional(),
        dateMonth: z.number().min(1).max(12).optional(),
        dateDay: z.number().min(1).max(31).optional(),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertCanManageBook(input.bookId, ctx.user);
      await createMemorialBookPage({
        bookId: input.bookId,
        title: input.title || null,
        content: input.content || null,
        photoUrl: input.photoUrl || null,
        photoKey: input.photoKey || null,
        dateYear: input.dateYear || null,
        dateMonth: input.dateMonth || null,
        dateDay: input.dateDay || null,
        sortOrder: input.sortOrder ?? 0,
      });
      return { success: true };
    }),

  updatePage: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: nullableText,
        content: nullableText,
        photoUrl: nullableText,
        photoKey: nullableText,
        dateYear: z.number().min(1800).max(2200).nullable().optional(),
        dateMonth: z.number().min(1).max(12).nullable().optional(),
        dateDay: z.number().min(1).max(31).nullable().optional(),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await assertCanManagePage(id, ctx.user);
      await updateMemorialBookPage(id, data);
      return { success: true };
    }),

  deletePage: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await assertCanManagePage(input.id, ctx.user);
      await deleteMemorialBookPage(input.id);
      return { success: true };
    }),
});
