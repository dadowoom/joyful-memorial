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
  await ensureBookPages(bookId);
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

async function ensureBookPages(bookId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available.");

  await db.delete(memorialBookPages).where(eq(memorialBookPages.bookId, bookId));

  await db.insert(memorialBookPages).values([
    {
      bookId,
      title: "젊은 날, 포항 항구에서",
      content:
        "젊은 시절의 정기쁨 어머니는 포항 항구의 바람처럼 부지런하고 단단했습니다. 가족을 위해 하루를 세우고, 작은 약속도 허투루 넘기지 않던 태도가 이후의 삶을 오래 지탱했습니다.",
      photoUrl: "/sample-gallery/jung-young-pohang-harbor.jpg",
      photoKey: "seed/jung-gippeum/young-pohang-harbor",
      dateYear: 1981,
      dateMonth: null,
      dateDay: null,
      sortOrder: 0,
    },
    {
      bookId,
      title: "밥상에 모인 가족",
      content:
        "가족이 한자리에 모이는 날이면 어머니의 손길은 늘 식탁 위에 먼저 닿았습니다. 특별한 말보다 따뜻한 밥 한 끼로 서로의 안부를 챙기게 했고, 그 시간이 가족의 중심이 되었습니다.",
      photoUrl: "/sample-gallery/jung-family-table.jpg",
      photoKey: "seed/jung-gippeum/family-table",
      dateYear: 2024,
      dateMonth: null,
      dateDay: null,
      sortOrder: 1,
    },
    {
      bookId,
      title: "죽도시장의 평범한 하루",
      content:
        "죽도시장을 걷던 하루에는 어머니의 생활 감각이 고스란히 묻어 있습니다. 좋은 것을 고르고, 필요한 만큼 나누고, 집으로 돌아와 가족을 위해 다시 하루를 차리는 평범함이 삶의 기록이 되었습니다.",
      photoUrl: "/sample-gallery/jung-jukdo-market.jpg",
      photoKey: "seed/jung-gippeum/jukdo-market",
      dateYear: 2021,
      dateMonth: null,
      dateDay: null,
      sortOrder: 2,
    },
    {
      bookId,
      title: "함께 담근 김장",
      content:
        "김장하던 날의 사진에는 이웃과 가족이 함께 움직이던 계절의 온도가 남아 있습니다. 어머니는 손이 많이 가는 일도 웃으며 나누었고, 그 넉넉함은 오래 기억되는 생활의 지혜가 되었습니다.",
      photoUrl: "/sample-gallery/jung-kimchi-day.jpg",
      photoKey: "seed/jung-gippeum/kimchi-day",
      dateYear: 2019,
      dateMonth: null,
      dateDay: null,
      sortOrder: 3,
    },
    {
      bookId,
      title: "손주와 돌본 작은 텃밭",
      content:
        "집 앞 텃밭은 손주와 이야기를 나누는 작은 교실이었습니다. 씨앗을 심고 기다리는 법, 자란 것을 아끼는 법, 함께 돌보는 기쁨을 어머니는 말보다 행동으로 알려주었습니다.",
      photoUrl: "/sample-gallery/jung-garden-grandchild.jpg",
      photoKey: "seed/jung-gippeum/garden-grandchild",
      dateYear: 2020,
      dateMonth: null,
      dateDay: null,
      sortOrder: 4,
    },
    {
      bookId,
      title: "포항 바닷길을 걷다",
      content:
        "딸과 손주와 함께 걸었던 바닷길은 가족에게 조용한 선물처럼 남아 있습니다. 바람을 맞으며 나란히 걷던 시간 속에서, 가족은 어머니의 곁이 얼마나 든든했는지 다시 느꼈습니다.",
      photoUrl: "/sample-gallery/jung-pohang-seaside.jpg",
      photoKey: "seed/jung-gippeum/pohang-seaside",
      dateYear: 2022,
      dateMonth: null,
      dateDay: null,
      sortOrder: 5,
    },
    {
      bookId,
      title: "호미곶의 아침",
      content:
        "호미곶에서 맞이한 아침은 가족이 함께 바라본 새로운 시작의 장면입니다. 어머니가 남긴 성실함과 다정함은 오늘의 가족에게도 하루를 잘 살아가게 하는 힘으로 이어지고 있습니다.",
      photoUrl: "/sample-gallery/jung-pohang-homigot.jpg",
      photoKey: "seed/jung-gippeum/pohang-homigot",
      dateYear: 2023,
      dateMonth: null,
      dateDay: null,
      sortOrder: 6,
    },
  ]);
}

async function ensureLetter(memorialId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available.");

  const content =
    "어머니, 함께 먹던 밥상과 조용히 건네주시던 따뜻한 말들을 기억합니다. 감사한 마음이 우리 안에 오래 이어지기를 바랍니다.";
  await db
    .delete(memorialLetters)
    .where(eq(memorialLetters.memorialId, memorialId));

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
