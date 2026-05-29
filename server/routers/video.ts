import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  canReadMemorial,
  createMemorialVideo,
  deleteMemorialVideo,
  getAdminMemorialById,
  getMemorialVideoById,
  listMemorialVideos,
  updateMemorialVideo,
} from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import type { User } from "../../drizzle/schema";

const videoListInput = z.object({
  memorialId: z.number(),
  accessToken: z.string().trim().max(128).optional(),
});

async function canManageMemorial(memorialId: number, user?: User | null) {
  if (!user) return false;
  if (user.role === "admin") return true;
  const memorial = await getAdminMemorialById(memorialId);
  return memorial?.ownerUserId === user.id;
}

async function assertCanManageMemorial(memorialId: number, user: User) {
  if (await canManageMemorial(memorialId, user)) return;

  throw new TRPCError({
    code: "FORBIDDEN",
    message: "이 기념관을 관리할 권한이 없습니다.",
  });
}

async function assertCanManageVideo(videoId: number, user: User) {
  const video = await getMemorialVideoById(videoId);
  if (!video) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "영상을 찾을 수 없습니다.",
    });
  }

  await assertCanManageMemorial(video.memorialId, user);
  return video;
}

async function getMemorialReadAccess(
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

  const canManage = user?.role === "admin" || memorial.ownerUserId === user?.id;
  if (canManage || canReadMemorial(memorial, accessToken)) {
    return { canManage };
  }

  throw new TRPCError({
    code: "FORBIDDEN",
    message: "비공개 기념관입니다.",
  });
}

export const videoRouter = router({
  listByMemorial: publicProcedure
    .input(videoListInput)
    .query(async ({ ctx, input }) => {
      const access = await getMemorialReadAccess(
        input.memorialId,
        ctx.user,
        input.accessToken
      );
      const videos = await listMemorialVideos(input.memorialId);
      if (access.canManage) return videos;
      return videos.filter(video => video.isVisible !== 0);
    }),

  create: protectedProcedure
    .input(
      z.object({
        memorialId: z.number(),
        title: z.string().trim().min(1).max(300),
        description: z.string().trim().max(2000).optional(),
        youtubeVideoId: z.string().trim().min(1).max(50),
        isVisible: z.boolean().optional(),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertCanManageMemorial(input.memorialId, ctx.user);
      await createMemorialVideo({
        memorialId: input.memorialId,
        title: input.title,
        description: input.description || null,
        youtubeVideoId: input.youtubeVideoId,
        isVisible: input.isVisible === false ? 0 : 1,
        sortOrder: input.sortOrder ?? 0,
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().trim().min(1).max(300).optional(),
        description: z.string().trim().max(2000).nullable().optional(),
        youtubeVideoId: z.string().trim().max(50).optional(),
        isVisible: z.boolean().optional(),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, isVisible, ...rest } = input;
      await assertCanManageVideo(id, ctx.user);
      await updateMemorialVideo(id, {
        ...rest,
        ...(isVisible === undefined ? {} : { isVisible: isVisible ? 1 : 0 }),
      });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await assertCanManageVideo(input.id, ctx.user);
      await deleteMemorialVideo(input.id);
      return { success: true };
    }),
});
