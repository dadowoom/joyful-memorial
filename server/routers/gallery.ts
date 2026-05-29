import { z } from "zod";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import {
  createMemorialGalleryPhoto,
  deleteMemorialGalleryPhoto,
  getAdminMemorialById,
  getMemorialGalleryPhotoById,
  listMemorialGalleryPhotos,
  setRepresentativeMemorialPhoto,
  updateMemorialGalleryPhoto,
} from "../db";
import { decodeImageDataUrl } from "../_core/imageUpload";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import type { User } from "../../drizzle/schema";

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

async function assertCanManagePhoto(photoId: number, user: User) {
  const photo = await getMemorialGalleryPhotoById(photoId);
  if (!photo) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "사진을 찾을 수 없습니다.",
    });
  }

  await assertCanManageMemorial(photo.memorialId, user);
  return photo;
}

export const galleryRouter = router({
  listByMemorial: publicProcedure
    .input(z.object({ memorialId: z.number() }))
    .query(({ input }) => listMemorialGalleryPhotos(input.memorialId)),

  upload: protectedProcedure
    .input(
      z.object({
        memorialId: z.number(),
        dataUrl: z.string(),
        fileName: z.string(),
        caption: z.string().max(500).optional(),
        year: z.string().max(20).optional(),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertCanManageMemorial(input.memorialId, ctx.user);
      const { buffer, mimeType, ext } = decodeImageDataUrl(input.dataUrl);
      const key = `gallery/${input.memorialId}/${nanoid()}.${ext}`;
      const { url } = await storagePut(key, buffer, mimeType);

      await createMemorialGalleryPhoto({
        memorialId: input.memorialId,
        photoUrl: url,
        photoKey: key,
        caption: input.caption || null,
        year: input.year || null,
        sortOrder: input.sortOrder ?? 0,
        isRepresentative: 0,
      });

      return { success: true, url, key };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        caption: z.string().max(500).nullable().optional(),
        year: z.string().max(20).nullable().optional(),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await assertCanManagePhoto(id, ctx.user);
      await updateMemorialGalleryPhoto(id, data);
      return { success: true };
    }),

  setRepresentative: protectedProcedure
    .input(z.object({ memorialId: z.number(), id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await assertCanManageMemorial(input.memorialId, ctx.user);
      const photo = await assertCanManagePhoto(input.id, ctx.user);
      if (photo.memorialId !== input.memorialId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "기념관과 사진 정보가 일치하지 않습니다.",
        });
      }
      await setRepresentativeMemorialPhoto(input.memorialId, input.id);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await assertCanManagePhoto(input.id, ctx.user);
      await deleteMemorialGalleryPhoto(input.id);
      return { success: true };
    }),
});
