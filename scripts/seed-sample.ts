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

const SAMPLE_SLUG = "jung-gippeum-kwonsa";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed sample data.");
  }

  const db = await getDb();
  if (!db) throw new Error("Database is not available.");

  await db
    .insert(memorials)
    .values({
      slug: SAMPLE_SLUG,
      name: "정기쁨",
      role: "권사",
      birthDate: "1941-04-18",
      deathDate: "",
      recordType: "faith",
      church: "기쁨이 있는교회",
      familyContact: "정하은",
      familyPhone: null,
      verse:
        "항상 기뻐하라 쉬지 말고 기도하라 범사에 감사하라 이것이 그리스도 예수 안에서 너희를 향하신 하나님의 뜻이니라",
      verseRef: "데살로니가전서 5:16-18",
      summary:
        "감사와 기도로 가족과 교회를 따뜻하게 섬기는 기쁨이 있는교회의 권사님",
      story:
        "정기쁨 권사님은 예배의 자리를 삶의 중심에 두고, 작은 섬김을 오래도록 이어가는 분입니다.\n\n가족에게는 매일의 기도로 든든한 울타리가 되어 주고, 교회 공동체에는 조용한 환대와 따뜻한 격려를 건넵니다. 권사님의 삶은 화려하지 않지만, 감사의 언어와 부활의 믿음으로 주변 사람들에게 깊은 위로와 기쁨을 전하고 있습니다.",
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
          title: "기쁨이 있는교회와 동행",
          description: "예배와 기도의 자리에서 신앙의 걸음을 이어갔습니다.",
        },
        {
          year: "2004",
          title: "권사 임직",
          description: "교회 공동체를 섬기는 일에 감사로 헌신했습니다.",
        },
        {
          year: "현재",
          title: "이어지는 신앙 기록",
          description: "가족과 교회가 감사와 응원의 마음을 함께 기록합니다.",
        },
      ]),
      managerMemo: "새 프로젝트 확인용 샘플 인물입니다.",
    })
    .onDuplicateKeyUpdate({
      set: {
        church: "기쁨이 있는교회",
        recordType: "faith",
        deathDate: "",
        servicePlace: null,
        serviceTime: null,
        memorialDay: null,
        visibility: "public",
        status: "published",
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
    caption: "정기쁨 권사",
    year: "2026",
    sortOrder: 0,
    isRepresentative: 1,
  });

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
        title: "정기쁨 권사님 가족관",
        intro:
          "가족이 함께 나누는 비공개 기록 공간입니다. 공개 신앙기념관에 담기 어려운 사진과 이야기를 차분히 이어갈 수 있습니다.",
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

  if (existing) return;
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

  if (existing) return;
  await db.insert(memorialVideos).values({
    memorialId,
    title: "감사의 기억",
    description: "가족이 함께 보는 샘플 신앙기념 영상입니다.",
    youtubeVideoId,
    isVisible: 1,
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

  if (existing) return existing.id;

  await db.insert(memorialBooks).values({
    memorialId,
    title,
    subtitle: "정기쁨 권사님의 삶과 신앙 기록",
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

  const title = "교회와 함께한 감사";
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

  if (existing) return;
  await db.insert(memorialBookPages).values({
    bookId,
    title,
    content:
      "기쁨이 있는교회 공동체 안에서 권사님은 늘 조용한 환대와 꾸준한 기도로 곁에 있었습니다. 그 기억은 가족과 성도들에게 감사의 언어로 남아 있습니다.",
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
    "권사님, 함께 드리는 예배와 조용히 건네주시는 따뜻한 말들을 기억합니다. 감사의 믿음이 우리 안에 오래 이어지기를 응원합니다.";
  const [existing] = await db
    .select({ id: memorialLetters.id })
    .from(memorialLetters)
    .where(
      and(
        eq(memorialLetters.memorialId, memorialId),
        eq(memorialLetters.content, content)
      )
    )
    .limit(1);

  if (existing) return;
  await db.insert(memorialLetters).values({
    memorialId,
    recipientName: "정기쁨",
    recipientRole: "권사",
    author: "기쁨이 있는교회 공동체",
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
