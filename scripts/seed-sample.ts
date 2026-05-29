import { and, eq } from "drizzle-orm";
import {
  memorialBookPages,
  memorialBooks,
  memorialFamilyRooms,
  memorialGalleryPhotos,
  memorialLetters,
  memorialVideos,
  memorials,
} from "../drizzle/schema";
import { getDb, hashFamilyRoomPassword } from "../server/db";

const LEGACY_SAMPLE_SLUG = ["jung", "gippeum", "kwon" + "sa"].join("-");
const SAMPLE_SLUG = "jung-gippeum-mother";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed sample data.");
  }

  const db = await getDb();
  if (!db) throw new Error("Database is not available.");

  const [legacySample] = await db
    .select({ id: memorials.id })
    .from(memorials)
    .where(eq(memorials.slug, LEGACY_SAMPLE_SLUG))
    .limit(1);
  const [currentSample] = await db
    .select({ id: memorials.id })
    .from(memorials)
    .where(eq(memorials.slug, SAMPLE_SLUG))
    .limit(1);

  if (legacySample && !currentSample) {
    await db
      .update(memorials)
      .set({ slug: SAMPLE_SLUG, updatedAt: new Date() })
      .where(eq(memorials.id, legacySample.id));
  }

  await db
    .insert(memorials)
    .values({
      slug: SAMPLE_SLUG,
      name: "정기쁨",
      role: "어머니",
      birthDate: "1941-04-18",
      deathDate: "",
      recordType: "faith",
      church: "정하은 가족",
      familyContact: "정하은",
      familyPhone: null,
      verse:
        "가족의 하루가 평안하기를 바라며, 작은 일에도 고맙다는 말을 아끼지 않던 사람",
      verseRef: "가족이 기억하는 말",
      summary:
        "성실함과 다정함으로 가족의 중심이 되어준 어머니",
      story:
        "정기쁨 어머니는 집 안의 작은 일들을 허투루 넘기지 않고, 가족이 편안히 하루를 보낼 수 있도록 늘 먼저 움직이던 분입니다.\n\n화려한 말보다 따뜻한 밥상과 조용한 배려로 마음을 전했고, 자녀와 손주들에게는 성실하게 살아가는 태도를 몸으로 보여주었습니다. 가족은 어머니의 사진과 말, 함께 보낸 계절들을 이곳에 천천히 모아가고 있습니다.",
      servicePlace: null,
      serviceTime: null,
      memorialDay: null,
      visibility: "public",
      status: "published",
      timelineJson: JSON.stringify([
        {
          year: "1941",
          title: "출생",
          description: "가족의 사랑 안에서 삶을 시작했습니다.",
        },
        {
          year: "1978",
          title: "가정을 꾸리다",
          description: "가족의 일상을 돌보며 단단한 집의 시간을 만들어 갔습니다.",
        },
        {
          year: "2004",
          title: "손주들과 보낸 계절",
          description: "손주들의 이름을 하나하나 불러주며 다정한 추억을 남겼습니다.",
        },
        {
          year: "현재",
          title: "이어지는 인생 기록",
          description: "가족과 가까운 사람들이 감사의 마음을 함께 기록합니다.",
        },
      ]),
      managerMemo: "일반 가족 기록 콘셉트 확인용 샘플 인물입니다.",
    })
    .onDuplicateKeyUpdate({
      set: {
        role: "어머니",
        church: "정하은 가족",
        verse:
          "가족의 하루가 평안하기를 바라며, 작은 일에도 고맙다는 말을 아끼지 않던 사람",
        verseRef: "가족이 기억하는 말",
        summary: "성실함과 다정함으로 가족의 중심이 되어준 어머니",
        story:
          "정기쁨 어머니는 집 안의 작은 일들을 허투루 넘기지 않고, 가족이 편안히 하루를 보낼 수 있도록 늘 먼저 움직이던 분입니다.\n\n화려한 말보다 따뜻한 밥상과 조용한 배려로 마음을 전했고, 자녀와 손주들에게는 성실하게 살아가는 태도를 몸으로 보여주었습니다. 가족은 어머니의 사진과 말, 함께 보낸 계절들을 이곳에 천천히 모아가고 있습니다.",
        timelineJson: JSON.stringify([
          {
            year: "1941",
            title: "출생",
            description: "가족의 사랑 안에서 삶을 시작했습니다.",
          },
          {
            year: "1978",
            title: "가정을 꾸리다",
            description: "가족의 일상을 돌보며 단단한 집의 시간을 만들어 갔습니다.",
          },
          {
            year: "2004",
            title: "손주들과 보낸 계절",
            description: "손주들의 이름을 하나하나 불러주며 다정한 추억을 남겼습니다.",
          },
          {
            year: "현재",
            title: "이어지는 인생 기록",
            description: "가족과 가까운 사람들이 감사의 마음을 함께 기록합니다.",
          },
        ]),
        recordType: "faith",
        deathDate: "",
        servicePlace: null,
        serviceTime: null,
        memorialDay: null,
        visibility: "public",
        status: "published",
        managerMemo: "일반 가족 기록 콘셉트 확인용 샘플 인물입니다.",
        updatedAt: new Date(),
      },
    });

  const [memorial] = await db
    .select()
    .from(memorials)
    .where(eq(memorials.slug, SAMPLE_SLUG))
    .limit(1);

  if (!memorial) throw new Error("Failed to load seeded memorial.");

  await ensureGalleryPhoto(memorial.id, {
    photoUrl: "/sample-jung-gippeum.png",
    photoKey: "seed/jung-gippeum/portrait",
    caption: "정기쁨 어머니",
    year: "2026",
    sortOrder: 0,
    isRepresentative: 1,
  });
  await Promise.all(
    [
      {
        photoUrl: "/sample-gallery/jung-family-table.jpg",
        photoKey: "seed/jung-gippeum/family-table",
        caption: "가족이 함께 모인 저녁 식탁",
        year: "2024",
      },
      {
        photoUrl: "/sample-gallery/jung-pohang-homigot.jpg",
        photoKey: "seed/jung-gippeum/pohang-homigot",
        caption: "포항 호미곶에서 맞이한 아침",
        year: "2023",
      },
      {
        photoUrl: "/sample-gallery/jung-pohang-seaside.jpg",
        photoKey: "seed/jung-gippeum/pohang-seaside",
        caption: "딸과 손주와 걸었던 포항 바닷길",
        year: "2022",
      },
      {
        photoUrl: "/sample-gallery/jung-jukdo-market.jpg",
        photoKey: "seed/jung-gippeum/jukdo-market",
        caption: "죽도시장에서 장을 보던 평범한 하루",
        year: "2021",
      },
      {
        photoUrl: "/sample-gallery/jung-kimchi-day.jpg",
        photoKey: "seed/jung-gippeum/kimchi-day",
        caption: "이웃들과 함께한 김장하던 날",
        year: "2019",
      },
      {
        photoUrl: "/sample-gallery/jung-young-pohang-harbor.jpg",
        photoKey: "seed/jung-gippeum/young-pohang-harbor",
        caption: "젊은 시절 포항 항구에서 남긴 가족사진",
        year: "1981",
      },
      {
        photoUrl: "/sample-gallery/jung-garden-grandchild.jpg",
        photoKey: "seed/jung-gippeum/garden-grandchild",
        caption: "손주와 함께 돌보던 집 앞 작은 텃밭",
        year: "2020",
      },
    ].map((photo, index) =>
      ensureGalleryPhoto(memorial.id, {
        ...photo,
        sortOrder: index + 1,
        isRepresentative: 0,
      })
    )
  );

  await ensureVideo(memorial.id);
  const bookId = await ensureBook(memorial.id);
  await ensureBookPage(bookId);
  await ensureLetter(memorial.id);

  if (process.env.SAMPLE_FAMILY_ROOM_PASSWORD) {
    await db
      .insert(memorialFamilyRooms)
      .values({
        memorialId: memorial.id,
        passwordHash: hashFamilyRoomPassword(
          process.env.SAMPLE_FAMILY_ROOM_PASSWORD
        ),
        title: "정기쁨 어머니 가족관",
        intro:
          "가족이 함께 나누는 비공개 기록 공간입니다. 공개 인생기념관에 담기 어려운 사진과 이야기를 차분히 이어갈 수 있습니다.",
      })
      .onDuplicateKeyUpdate({
        set: {
          passwordHash: hashFamilyRoomPassword(
            process.env.SAMPLE_FAMILY_ROOM_PASSWORD
          ),
          updatedAt: new Date(),
        },
      });
  }

  console.log(`Seeded sample memorial: /memorial/${SAMPLE_SLUG}`);
}

async function ensureGalleryPhoto(
  memorialId: number,
  photo: {
    photoUrl: string;
    photoKey: string;
    caption: string;
    year: string;
    sortOrder: number;
    isRepresentative: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available.");

  const [existing] = await db
    .select({ id: memorialGalleryPhotos.id })
    .from(memorialGalleryPhotos)
    .where(
      and(
        eq(memorialGalleryPhotos.memorialId, memorialId),
        eq(memorialGalleryPhotos.photoKey, photo.photoKey)
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(memorialGalleryPhotos)
      .set({
        photoUrl: photo.photoUrl,
        caption: photo.caption,
        year: photo.year,
        sortOrder: photo.sortOrder,
        isRepresentative: photo.isRepresentative,
        updatedAt: new Date(),
      })
      .where(eq(memorialGalleryPhotos.id, existing.id));
    return;
  }
  await db.insert(memorialGalleryPhotos).values({ memorialId, ...photo });
}

async function ensureVideo(memorialId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available.");

  const youtubeVideoId = "ysz5S6PUM-U";
  const [existing] = await db
    .select({ id: memorialVideos.id })
    .from(memorialVideos)
    .where(
      and(
        eq(memorialVideos.memorialId, memorialId),
        eq(memorialVideos.youtubeVideoId, youtubeVideoId)
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(memorialVideos)
      .set({
        title: "감사의 기억",
        description: "가족이 직접 등록할 영상을 위한 샘플 항목입니다.",
        isVisible: 0,
        sortOrder: 0,
        updatedAt: new Date(),
      })
      .where(eq(memorialVideos.id, existing.id));
    return;
  }
  await db.insert(memorialVideos).values({
    memorialId,
    title: "감사의 기억",
    description: "가족이 직접 등록할 영상을 위한 샘플 항목입니다.",
    youtubeVideoId,
    isVisible: 0,
    sortOrder: 0,
  });
}

async function ensureBook(memorialId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available.");

  const title = "감사로 이어진 삶";
  const [existing] = await db
    .select({ id: memorialBooks.id })
    .from(memorialBooks)
    .where(
      and(
        eq(memorialBooks.memorialId, memorialId),
        eq(memorialBooks.title, title)
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(memorialBooks)
      .set({
        subtitle: "정기쁨 어머니의 삶과 이야기 기록",
        coverPhotoUrl: "/sample-jung-gippeum.png",
        coverPhotoKey: "seed/jung-gippeum/portrait",
        publishedYear: "2026",
        sortOrder: 0,
        updatedAt: new Date(),
      })
      .where(eq(memorialBooks.id, existing.id));
    return existing.id;
  }

  await db.insert(memorialBooks).values({
    memorialId,
    title,
    subtitle: "정기쁨 어머니의 삶과 이야기 기록",
    coverPhotoUrl: "/sample-jung-gippeum.png",
    coverPhotoKey: "seed/jung-gippeum/portrait",
    publishedYear: "2026",
    sortOrder: 0,
  });

  const [created] = await db
    .select({ id: memorialBooks.id })
    .from(memorialBooks)
    .where(
      and(
        eq(memorialBooks.memorialId, memorialId),
        eq(memorialBooks.title, title)
      )
    )
    .limit(1);

  if (!created) throw new Error("Failed to create sample book.");
  return created.id;
}

async function ensureBookPage(bookId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available.");

  const title = "가족과 함께한 감사";
  const [existing] = await db
    .select({ id: memorialBookPages.id })
    .from(memorialBookPages)
    .where(
      and(
        eq(memorialBookPages.bookId, bookId),
        eq(memorialBookPages.title, title)
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(memorialBookPages)
      .set({
        content:
          "정기쁨 어머니는 늘 조용한 환대와 꾸준한 돌봄으로 가족 곁에 있었습니다. 그 기억은 가족에게 감사의 언어로 남아 있습니다.",
        photoUrl: "/sample-jung-gippeum.png",
        photoKey: "seed/jung-gippeum/portrait",
        dateYear: 2004,
        updatedAt: new Date(),
      })
      .where(eq(memorialBookPages.id, existing.id));
    return;
  }
  await db.insert(memorialBookPages).values({
    bookId,
    title,
    content:
      "정기쁨 어머니는 늘 조용한 환대와 꾸준한 돌봄으로 가족 곁에 있었습니다. 그 기억은 가족에게 감사의 언어로 남아 있습니다.",
    photoUrl: "/sample-jung-gippeum.png",
    photoKey: "seed/jung-gippeum/portrait",
    dateYear: 2004,
    dateMonth: null,
    dateDay: null,
    sortOrder: 0,
  });
}

async function ensureLetter(memorialId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available.");

  const content =
    "어머니, 함께 먹던 밥상과 조용히 건네주시던 따뜻한 말들을 기억합니다. 감사한 마음이 우리 안에 오래 이어지기를 바랍니다.";
  const [existing] = await db
    .select({ id: memorialLetters.id })
    .from(memorialLetters)
    .where(
      eq(memorialLetters.memorialId, memorialId)
    )
    .limit(1);

  if (existing) {
    await db
      .update(memorialLetters)
      .set({
        recipientName: "정기쁨",
        recipientRole: "어머니",
        author: "정하은",
        content,
        status: "published",
        updatedAt: new Date(),
      })
      .where(eq(memorialLetters.id, existing.id));
    return;
  }
  await db.insert(memorialLetters).values({
    memorialId,
    recipientName: "정기쁨",
    recipientRole: "어머니",
    author: "정하은",
    content,
    status: "published",
  });
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
