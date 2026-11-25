/**
 * Deterministic demo data for the mock API. Dates are relative to "today" so tours never expire.
 * This file is development/demo-only and is never imported by production code paths
 * unless VITE_API_MOCKING=enabled.
 */
import type {
  Difficulty,
  ItineraryItemType,
  TourBadge,
  TourCategory,
  TourStatus,
} from "@/features/tours/api/tour-schemas";

export interface DbUser {
  id: string;
  phone: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  city: string | null;
  bio: string | null;
  role: "user" | "admin";
  createdAt: string;
  rating: number | null;
  /** 'media:<id>' for uploaded files, a public path, or null. */
  avatarUrl: string | null;
  travelStyles: TourCategory[];
  languages: string[];
  interests: string[];
  budgetRange: string | null;
  blocked: boolean;
  favoritesPublic: boolean;
}

export type ItemStatus = "planned" | "done" | "cancelled" | "changed";

export interface DbItem {
  id: string;
  type: ItineraryItemType;
  title: string;
  location: string | null;
  startTime: string | null;
  note: string | null;
  costToman: number | null;
  link: string | null;
  status: ItemStatus;
}

export interface DbDay {
  id: string;
  dayNumber: number;
  title: string;
  items: DbItem[];
}

export interface DbTour {
  id: string;
  title: string;
  destination: string;
  province: string;
  coverImageUrl: string;
  gallery: string[];
  startDate: string;
  durationDays: number;
  priceToman: number;
  capacity: number;
  minParticipants: number;
  /** Members who joined outside the app (seed only); approved requests are added on top. */
  baseConfirmed: number;
  difficulty: Difficulty;
  categories: TourCategory[];
  badge: TourBadge | null;
  rating: number | null;
  reviewCount: number;
  status: TourStatus;
  description: string;
  highlights: string[];
  includes: string[];
  meetingPoint: string | null;
  requiresApproval: boolean;
  creatorId: string;
  featuredRank: number | null;
  createdAt: string;
  submittedAt: string | null;
  itinerary: DbDay[];
  cancelReason?: string | null;
}

export interface DbJoinRequest {
  id: string;
  tourId: string;
  userId: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  message: string;
  createdAt: string;
  decidedAt: string | null;
  /** Seats reserved by this request (checkout v0.7); missing = 1. */
  seats?: number;
}

export interface DbSession {
  id: string;
  userId: string;
  device: string;
  location: string | null;
  lastActiveAt: string;
}

export interface DbFavorite {
  userId: string;
  tourId: string;
  addedAt: string;
  label?: string | null;
  note?: string | null;
}

export interface DbComment {
  id: string;
  tourId: string;
  itemId: string;
  userId: string;
  text: string;
  createdAt: string;
}
export interface DbChange {
  id: string;
  tourId: string;
  at: string;
  text: string;
}
export type ExpenseCategory =
  "accommodation" | "transport" | "food" | "activity" | "other";
export interface DbExpense {
  id: string;
  tourId: string;
  title: string;
  category: ExpenseCategory;
  amountToman: number;
  paidByUserId: string;
  createdAt: string;
}
export interface DbPayment {
  id: string;
  tourId: string;
  userId: string;
  amountToman: number;
  status: "paid" | "pending" | "refunded";
  at: string;
  reference: string;
}
export interface DbMessage {
  id: string;
  tourId: string;
  userId: string;
  text: string;
  createdAt: string;
}
export interface DbReadMark {
  userId: string;
  tourId: string;
  lastReadAt: string;
}
export interface DbPoll {
  id: string;
  tourId: string;
  question: string;
  options: { id: string; text: string }[];
  deadline: string;
  createdAt: string;
}
export interface DbVote {
  pollId: string;
  userId: string;
  optionId: string;
}
export interface DbChecklistItem {
  id: string;
  tourId: string;
  title: string;
  required: boolean;
}
export interface DbChecklistDone {
  itemId: string;
  userId: string;
}
export interface DbPhoto {
  id: string;
  tourId: string;
  userId: string;
  url: string;
  caption: string;
  createdAt: string;
}
export type NotificationType =
  | "join_request"
  | "request_approved"
  | "request_rejected"
  | "quorum_reached"
  | "plan_changed"
  | "tour_cancelled"
  | "tour_approved"
  | "tour_rejected"
  | "new_message"
  | "system";
export interface DbNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  tourId: string | null;
  createdAt: string;
  read: boolean;
}
export interface DbReview {
  id: string;
  tourId: string;
  authorId: string;
  targetUserId: string;
  rating: number;
  comment: string;
  createdAt: string;
}
export interface DbReport {
  id: string;
  reporterId: string;
  targetType: "user" | "tour" | "comment";
  targetId: string;
  targetLabel: string;
  reason: string;
  status: "open" | "resolved" | "dismissed";
  decisionNote: string | null;
  decidedAt: string | null;
  decidedBy: string | null;
  createdAt: string;
}
export interface DbBlock {
  blockerId: string;
  blockedId: string;
}

export interface DbDestination {
  id: string;
  name: string;
  province: string;
  imageUrl: string;
  typicalDays: number;
  match: string[];
}

/** Single-use tour invite link. Status is derived at read time (see handlers-invites.ts). */
export interface DbInvite {
  token: string;
  tourId: string;
  createdById: string;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
  usedById: string | null;
  revokedAt: string | null;
}

export interface Db {
  version: number;
  /** Added after DB v4; created lazily for databases saved by older builds. */
  invites?: DbInvite[];
  /** userId → mock password hash (SHA-256). Real backends must use bcrypt/argon2. */
  passwords?: Record<string, string>;
  users: DbUser[];
  tours: DbTour[];
  requests: DbJoinRequest[];
  favorites: DbFavorite[];
  sessions: DbSession[];
  destinations: DbDestination[];
  /** Simulates the server-side session behind the HttpOnly cookie. */
  currentSessionId: string | null;
  otp: Record<
    string,
    { code: string; expiresAt: number; resendAt: number; attempts: number }
  >;
  contacts: { id: string; email: string; createdAt: string }[];
  newsletter: string[];
  comments: DbComment[];
  changes: DbChange[];
  expenses: DbExpense[];
  payments: DbPayment[];
  messages: DbMessage[];
  readMarks: DbReadMark[];
  polls: DbPoll[];
  votes: DbVote[];
  checklist: DbChecklistItem[];
  checklistDone: DbChecklistDone[];
  photos: DbPhoto[];
  notifications: DbNotification[];
  reviews: DbReview[];
  reports: DbReport[];
  blocks: DbBlock[];
}

export const DB_VERSION = 4;

const IMG = {
  mesr: "/images/tours/tour-mesr-desert.webp",
  shirom: "/images/tours/tour-shirom-canyon.webp",
  hyrcan: "/images/tours/tour-hyrcanian-forest.webp",
  gulf: "/images/tours/tour-persian-gulf.webp",
  damavand: "/images/tours/dest-damavand.webp",
  qeshm: "/images/tours/dest-qeshm.webp",
  isfahan: "/images/tours/dest-isfahan.webp",
  lake: "/images/tours/dest-lake.webp",
} as const;

export function isoDay(offsetDays: number, from = new Date()): string {
  const d = new Date(
    Date.UTC(
      from.getFullYear(),
      from.getMonth(),
      from.getDate() + offsetDays,
      12,
    ),
  );
  return d.toISOString().slice(0, 10);
}

function isoNow(offsetMinutes = 0): string {
  return new Date(Date.now() + offsetMinutes * 60_000).toISOString();
}

let itemSeq = 0;
function item(
  type: ItineraryItemType,
  title: string,
  startTime: string | null,
  location: string | null,
  note: string | null = null,
  costToman: number | null = null,
): DbItem {
  itemSeq += 1;
  return {
    id: `item-${itemSeq}`,
    type,
    title,
    location,
    startTime,
    note,
    costToman,
    link: null,
    status: "planned",
  };
}

type BaseUser = Omit<
  DbUser,
  | "avatarUrl"
  | "travelStyles"
  | "languages"
  | "interests"
  | "budgetRange"
  | "blocked"
  | "favoritesPublic"
> &
  Partial<DbUser>;
function withDefaults(u: BaseUser): DbUser {
  return {
    avatarUrl: null,
    travelStyles: [],
    languages: ["فارسی"],
    interests: [],
    budgetRange: null,
    blocked: false,
    favoritesPublic: false,
    ...u,
  };
}

function day(
  tourId: string,
  dayNumber: number,
  title: string,
  items: DbItem[],
): DbDay {
  return { id: `${tourId}-d${dayNumber}`, dayNumber, title, items };
}

export function createSeed(): Db {
  itemSeq = 0;
  const users: DbUser[] = (
    [
      {
        id: "u-parisa",
        phone: "09123456789",
        firstName: "پریسا",
        lastName: "هاشمی",
        email: "parisa@example.com",
        city: "تهران",
        bio: "عاشق سفرهای گروهی، عکاسی از طبیعت و غذاهای محلی.",
        role: "user",
        createdAt: isoNow(-60 * 24 * 200),
        rating: 4.9,
      },
      {
        id: "u-admin",
        phone: "09120000000",
        firstName: "مدیر",
        lastName: "سامانه",
        email: "admin@example.com",
        city: "تهران",
        bio: null,
        role: "admin",
        createdAt: isoNow(-60 * 24 * 400),
        rating: null,
      },
      {
        id: "u-amir",
        phone: "09121111111",
        firstName: "امیرعماد",
        lastName: "تیمورپور",
        email: null,
        city: "شیراز",
        bio: "راهنمای کوهستان و طبیعت‌گردی.",
        role: "user",
        createdAt: isoNow(-60 * 24 * 320),
        rating: 4.85,
      },
      {
        id: "u-fatemeh",
        phone: "09122222222",
        firstName: "فاطمه",
        lastName: "کردگاری",
        email: null,
        city: "یزد",
        bio: "کویرنورد و عاشق آسمان شب.",
        role: "user",
        createdAt: isoNow(-60 * 24 * 280),
        rating: 4.95,
      },
      {
        id: "u-reyhaneh",
        phone: "09123333333",
        firstName: "ریحانه",
        lastName: "ریاضی",
        email: null,
        city: "رشت",
        bio: "جنگل‌نورد و کمپینگ خانوادگی.",
        role: "user",
        createdAt: isoNow(-60 * 24 * 260),
        rating: 4.9,
      },
      {
        id: "u-ilia",
        phone: "09124444444",
        firstName: "سیدایلیا",
        lastName: "موسوی",
        email: null,
        city: "اصفهان",
        bio: null,
        role: "user",
        createdAt: isoNow(-60 * 24 * 120),
        rating: 4.7,
      },
      {
        id: "u-pari",
        phone: "09125555555",
        firstName: "پری",
        lastName: "قاسمی",
        email: null,
        city: "بندرعباس",
        bio: null,
        role: "user",
        createdAt: isoNow(-60 * 24 * 90),
        rating: 4.8,
      },
      {
        id: "u-mahsa",
        phone: "09131112233",
        firstName: "مهسا",
        lastName: "کریمی",
        email: null,
        city: "کرج",
        bio: null,
        role: "user",
        createdAt: isoNow(-60 * 24 * 30),
        rating: null,
      },
      {
        id: "u-reza",
        phone: "09135556677",
        firstName: "رضا",
        lastName: "ابراهیمی",
        email: null,
        city: "قم",
        bio: null,
        role: "user",
        createdAt: isoNow(-60 * 24 * 20),
        rating: null,
      },
    ] as BaseUser[]
  ).map(withDefaults);
  Object.assign(users[0] ?? {}, {
    travelStyles: ["nature", "adventure", "camping"],
    languages: ["فارسی", "انگلیسی"],
    interests: ["عکاسی شب", "کوهنوردی سبک", "غذاهای محلی"],
    budgetRange: "۳ تا ۷ میلیون تومان",
    favoritesPublic: true,
  });

  const base = {
    gallery: [] as string[],
    reviewCount: 0,
    featuredRank: null as number | null,
    createdAt: isoNow(-60 * 24 * 20),
    submittedAt: isoNow(-60 * 24 * 19),
    meetingPoint: "تهران، میدان آزادی" as string | null,
  };

  const tours: DbTour[] = [
    {
      ...base,
      id: "mesr-desert",
      title: "کویر مصر",
      destination: "روستای مصر، خور و بیابانک",
      province: "یزد",
      coverImageUrl: IMG.mesr,
      gallery: [IMG.mesr, IMG.isfahan],
      startDate: isoDay(18),
      durationDays: 3,
      priceToman: 3_200_000,
      capacity: 12,
      minParticipants: 8,
      baseConfirmed: 5,
      difficulty: "easy",
      categories: ["camping", "nature", "family"],
      badge: "special_offer",
      rating: 4.5,
      reviewCount: 38,
      status: "open",
      description:
        "سه روز در دل کویر مصر؛ تپه‌های شنی طلایی، قلعه‌های خشتی و آسمانی پر از ستاره. شب‌ها کنار آتش، موسیقی محلی و ستاره‌نگری با تلسکوپ داریم و روزها شترسواری، آفرود سبک و بازدید از روستای فرحزاد.",
      highlights: [
        "ستاره‌نگری با تلسکوپ",
        "غروب روی تپه‌های رملی",
        "اقامت در اقامتگاه بوم‌گردی",
        "آفرود سبک در کویر",
      ],
      includes: [
        "حمل‌ونقل رفت و برگشت",
        "اقامت ۲ شب بوم‌گردی",
        "صبحانه و شام",
        "راهنمای محلی",
      ],
      requiresApproval: true,
      creatorId: "u-fatemeh",
      featuredRank: 1,
      itinerary: [
        day("mesr-desert", 1, "حرکت از تهران و غروب در کویر", [
          item("transport", "حرکت با ون از میدان آزادی", "06:30", "تهران"),
          item(
            "restaurant",
            "ناهار در رستوران سنتی نائین",
            "13:00",
            "نائین",
            null,
            450_000,
          ),
          item(
            "accommodation",
            "اقامتگاه بوم‌گردی ریگ جن",
            "17:00",
            "روستای مصر",
          ),
          item(
            "activity",
            "تماشای غروب روی تپه‌های رملی",
            "18:30",
            "تپه‌های مصر",
          ),
        ]),
        day("mesr-desert", 2, "شترسواری و ستاره‌نگری", [
          item("activity", "شترسواری صبحگاهی", "07:30", "روستای مصر"),
          item(
            "attraction",
            "بازدید از روستای فرحزاد و نخلستان",
            "10:30",
            "فرحزاد",
          ),
          item(
            "activity",
            "ستاره‌نگری با تلسکوپ",
            "21:00",
            "کمپ کویری",
            "لباس گرم همراه داشته باشید",
          ),
        ]),
        day("mesr-desert", 3, "طلوع و بازگشت", [
          item("activity", "تماشای طلوع آفتاب", "05:45", "تپه‌های مصر"),
          item("transport", "حرکت به سمت تهران", "10:00", null),
        ]),
      ],
    },
    {
      ...base,
      id: "shirom-canyon",
      title: "دره‌نوردی و آبشار شیرم",
      destination: "پلدختر",
      province: "لرستان",
      coverImageUrl: IMG.shirom,
      gallery: [IMG.shirom, IMG.lake],
      startDate: isoDay(24),
      durationDays: 4,
      priceToman: 5_800_000,
      capacity: 10,
      minParticipants: 6,
      baseConfirmed: 4,
      difficulty: "moderate",
      categories: ["adventure", "nature", "camping"],
      badge: "new",
      rating: 4.6,
      reviewCount: 21,
      status: "open",
      description:
        "چهار روز ماجراجویی در زاگرس: دره‌نوردی در تنگه‌های پرآب، شنا زیر آبشار شیرم، کمپ کنار رودخانه و آشنایی با فرهنگ لرستان. مناسب کسانی که آمادگی جسمانی متوسط دارند.",
      highlights: [
        "دره‌نوردی با تجهیزات کامل",
        "آبشار شیرم و تنگه شیرز",
        "کمپ کنار رودخانه",
        "غذای محلی لری",
      ],
      includes: [
        "تجهیزات فنی دره‌نوردی",
        "بیمه سفر",
        "اقامت کمپ",
        "سه وعده غذا",
      ],
      requiresApproval: true,
      creatorId: "u-amir",
      featuredRank: 2,
      itinerary: [
        day("shirom-canyon", 1, "حرکت و برپایی کمپ", [
          item("transport", "حرکت با اتوبوس از تهران", "22:00", "تهران"),
          item("accommodation", "برپایی کمپ کنار رودخانه", "10:00", "پلدختر"),
        ]),
        day("shirom-canyon", 2, "آبشار شیرم", [
          item("activity", "پیمایش مسیر آبشار", "08:00", "آبشار شیرم"),
          item(
            "restaurant",
            "ناهار محلی در روستا",
            "13:30",
            "روستای شیرم",
            null,
            300_000,
          ),
        ]),
        day("shirom-canyon", 3, "دره‌نوردی تنگه شیرز", [
          item(
            "activity",
            "دره‌نوردی با راهنمای فنی",
            "07:00",
            "تنگه شیرز",
            "تجهیزات کامل تحویل داده می‌شود",
          ),
          item("attraction", "پل تاریخی کشکان", "17:00", "پلدختر"),
        ]),
        day("shirom-canyon", 4, "بازگشت", [
          item("transport", "حرکت به تهران", "09:00", null),
        ]),
      ],
    },
    {
      ...base,
      id: "hyrcanian-forest",
      title: "جنگل‌های هیرکانی",
      destination: "سوادکوه",
      province: "مازندران",
      coverImageUrl: IMG.hyrcan,
      gallery: [IMG.hyrcan, IMG.lake],
      startDate: isoDay(12),
      durationDays: 4,
      priceToman: 3_600_000,
      capacity: 14,
      minParticipants: 6,
      baseConfirmed: 2,
      difficulty: "easy",
      categories: ["nature", "family", "camping"],
      badge: "popular",
      rating: 4.7,
      reviewCount: 54,
      status: "confirmed",
      description:
        "جنگل‌های هزاران‌ساله هیرکانی را از نزدیک ببینید؛ پیاده‌روی سبک بین درختان راش و ممرز، اقامت در کلبه چوبی، صبحانه محلی و عصرهای مه‌آلود شمال. سفری آرام و خانوادگی.",
      highlights: [
        "کلبه چوبی در دل جنگل",
        "پیاده‌روی در جنگل راش",
        "دریاچه شورمست",
        "بازار محلی",
      ],
      includes: ["اقامت ۳ شب کلبه", "صبحانه", "راهنما", "حمل‌ونقل"],
      requiresApproval: false,
      creatorId: "u-reyhaneh",
      featuredRank: 3,
      itinerary: [
        day("hyrcanian-forest", 1, "رسیدن به سوادکوه", [
          item("transport", "حرکت از تهران از جاده فیروزکوه", "07:00", "تهران"),
          item("accommodation", "کلبه‌های چوبی جنگل", "13:00", "سوادکوه"),
        ]),
        day("hyrcanian-forest", 2, "جنگل راش", [
          item("activity", "پیاده‌روی جنگل راش", "08:30", "جنگل راش"),
        ]),
        day("hyrcanian-forest", 3, "دریاچه شورمست", [
          item("attraction", "دریاچه شورمست", "10:00", "شورمست"),
        ]),
        day("hyrcanian-forest", 4, "بازگشت", [
          item("transport", "حرکت به تهران", "11:00", null),
        ]),
      ],
    },
    {
      ...base,
      id: "persian-gulf",
      title: "ساحل زیبای خلیج فارس",
      destination: "بندرعباس و جزیره هرمز",
      province: "هرمزگان",
      coverImageUrl: IMG.gulf,
      gallery: [IMG.gulf, IMG.qeshm],
      startDate: isoDay(30),
      durationDays: 3,
      priceToman: 9_900_000,
      capacity: 10,
      minParticipants: 5,
      baseConfirmed: 3,
      difficulty: "easy",
      categories: ["beach", "family"],
      badge: "best_seller",
      rating: 4.8,
      reviewCount: 66,
      status: "open",
      description:
        "سواحل فیروزه‌ای خلیج فارس، خاک‌های رنگی جزیره هرمز، غروب در ساحل سرخ و غذاهای دریایی جنوبی. پرواز رفت و برگشت و اقامت در هتل ساحلی در قیمت تور لحاظ شده است.",
      highlights: [
        "ساحل سرخ هرمز",
        "دره رنگین‌کمان",
        "قایق‌سواری",
        "بازار سنتی بندر",
      ],
      includes: [
        "پرواز رفت و برگشت",
        "هتل ساحلی ۴ ستاره",
        "گشت دریایی",
        "بیمه",
      ],
      requiresApproval: false,
      creatorId: "u-pari",
      featuredRank: 4,
      meetingPoint: "فرودگاه مهرآباد، ترمینال ۴",
      itinerary: [
        day("persian-gulf", 1, "پرواز و ساحل", [
          item(
            "transport",
            "پرواز تهران به بندرعباس",
            "08:00",
            "فرودگاه مهرآباد",
          ),
          item("accommodation", "هتل ساحلی", "12:00", "بندرعباس"),
        ]),
        day("persian-gulf", 2, "جزیره هرمز", [
          item("transport", "شناور به هرمز", "08:30", "اسکله شهید حقانی"),
          item("attraction", "دره رنگین‌کمان و ساحل سرخ", "10:00", "هرمز"),
        ]),
        day("persian-gulf", 3, "بازار و بازگشت", [
          item("attraction", "بازار سنتی", "10:00", "بندرعباس"),
        ]),
      ],
    },
    {
      ...base,
      id: "damavand-summit",
      title: "صعود به قله دماوند از جبهه جنوبی",
      destination: "دماوند",
      province: "مازندران",
      coverImageUrl: IMG.damavand,
      gallery: [IMG.damavand],
      startDate: isoDay(40),
      durationDays: 3,
      priceToman: 6_500_000,
      capacity: 12,
      minParticipants: 8,
      baseConfirmed: 7,
      difficulty: "hard",
      categories: ["adventure", "nature"],
      badge: null,
      rating: 4.9,
      reviewCount: 19,
      status: "open",
      description:
        "صعود سه‌روزه به بام ایران با راهنمای فدراسیون؛ هم‌هوایی در بارگاه سوم و صعود شبانه به قله ۵۶۰۹ متری.",
      highlights: [
        "راهنمای دارای مجوز",
        "هم‌هوایی اصولی",
        "اقامت در بارگاه سوم",
      ],
      includes: ["راهنما", "حمل بار تا بارگاه سوم", "بیمه کوهنوردی"],
      requiresApproval: true,
      creatorId: "u-amir",
      itinerary: [
        day("damavand-summit", 1, "پلور تا بارگاه سوم", [
          item("activity", "صعود به بارگاه سوم", "07:00", "گوسفندسرا"),
        ]),
        day("damavand-summit", 2, "هم‌هوایی", [
          item("activity", "برنامه هم‌هوایی", "09:00", "بارگاه سوم"),
        ]),
        day("damavand-summit", 3, "صعود قله", [
          item("activity", "صعود به قله", "03:00", "قله دماوند"),
        ]),
      ],
    },
    {
      ...base,
      id: "qeshm-island",
      title: "جزیره قشم و دره ستارگان",
      destination: "جزیره قشم",
      province: "هرمزگان",
      coverImageUrl: IMG.qeshm,
      gallery: [IMG.qeshm, IMG.gulf],
      startDate: isoDay(21),
      durationDays: 4,
      priceToman: 7_400_000,
      capacity: 12,
      minParticipants: 6,
      baseConfirmed: 2,
      difficulty: "easy",
      categories: ["beach", "nature", "family"],
      badge: null,
      rating: 4.6,
      reviewCount: 31,
      status: "open",
      description:
        "چهار روز در بزرگ‌ترین جزیره خلیج فارس: دره ستارگان، جنگل حرا، تنگه چاهکوه و غروب‌های بی‌نظیر.",
      highlights: ["دره ستارگان", "قایق‌سواری در جنگل حرا", "تنگه چاهکوه"],
      includes: ["اقامت بوم‌گردی", "گشت روزانه", "صبحانه"],
      requiresApproval: false,
      creatorId: "u-pari",
      itinerary: [
        day("qeshm-island", 1, "رسیدن به قشم", [
          item("accommodation", "اقامتگاه بوم‌گردی ناخدا", "14:00", "قشم"),
        ]),
        day("qeshm-island", 2, "جنگل حرا", [
          item("activity", "قایق‌سواری بین درختان حرا", "09:00", "جنگل حرا"),
        ]),
        day("qeshm-island", 3, "دره ستارگان", [
          item("attraction", "دره ستارگان", "16:00", "قشم"),
        ]),
        day("qeshm-island", 4, "بازگشت", [
          item("transport", "پرواز بازگشت", "12:00", "فرودگاه قشم"),
        ]),
      ],
    },
    {
      ...base,
      id: "isfahan-heritage",
      title: "اصفهان؛ نصف جهان در سه روز",
      destination: "اصفهان",
      province: "اصفهان",
      coverImageUrl: IMG.isfahan,
      gallery: [IMG.isfahan],
      startDate: isoDay(15),
      durationDays: 3,
      priceToman: 4_200_000,
      capacity: 16,
      minParticipants: 8,
      baseConfirmed: 9,
      difficulty: "easy",
      categories: ["historic", "family"],
      badge: null,
      rating: 4.8,
      reviewCount: 72,
      status: "confirmed",
      description:
        "میدان نقش جهان، سی‌وسه‌پل، کاخ چهلستون و محله جلفا؛ سفری فرهنگی با راهنمای تاریخ و معماری.",
      highlights: ["میدان نقش جهان", "کلیسای وانک", "شب‌گردی کنار زاینده‌رود"],
      includes: ["هتل سنتی", "راهنمای تاریخ", "بلیت اماکن"],
      requiresApproval: false,
      creatorId: "u-ilia",
      itinerary: [
        day("isfahan-heritage", 1, "نقش جهان", [
          item(
            "attraction",
            "میدان نقش جهان و مسجد شیخ لطف‌الله",
            "10:00",
            "اصفهان",
          ),
        ]),
        day("isfahan-heritage", 2, "جلفا", [
          item("attraction", "کلیسای وانک", "10:00", "جلفا"),
        ]),
        day("isfahan-heritage", 3, "پل‌ها", [
          item("attraction", "سی‌وسه‌پل و پل خواجو", "17:00", "اصفهان"),
        ]),
      ],
    },
    {
      ...base,
      id: "gahar-lake",
      title: "کمپینگ خانوادگی کنار دریاچه گهر",
      destination: "دریاچه گهر",
      province: "لرستان",
      coverImageUrl: IMG.lake,
      gallery: [IMG.lake],
      startDate: isoDay(35),
      durationDays: 5,
      priceToman: 3_900_000,
      capacity: 14,
      minParticipants: 6,
      baseConfirmed: 3,
      difficulty: "moderate",
      categories: ["camping", "family", "nature"],
      badge: null,
      rating: 4.7,
      reviewCount: 27,
      status: "open",
      description:
        "پیمایش جنگل‌های بلوط تا دریاچه فیروزه‌ای گهر و کمپ دو شبه کنار آب. قاطر برای حمل بار در نظر گرفته شده است.",
      highlights: ["دریاچه گهر", "جنگل بلوط زاگرس", "شب‌مانی کنار دریاچه"],
      includes: ["قاطر حمل بار", "راهنما", "غذای گرم"],
      requiresApproval: false,
      creatorId: "u-reyhaneh",
      itinerary: [
        day("gahar-lake", 1, "حرکت", [
          item("transport", "حرکت به دورود", "21:00", "تهران"),
        ]),
        day("gahar-lake", 2, "پیمایش", [
          item("activity", "پیمایش تا دریاچه", "08:00", "دریاچه گهر"),
        ]),
      ],
    },
    {
      ...base,
      id: "maranjab-stars",
      title: "کمپینگ ستاره‌نگری در کویر مرنجاب",
      destination: "کویر مرنجاب، کاشان",
      province: "اصفهان",
      coverImageUrl: IMG.mesr,
      gallery: [IMG.mesr],
      startDate: isoDay(9),
      durationDays: 2,
      priceToman: 2_100_000,
      capacity: 8,
      minParticipants: 5,
      baseConfirmed: 2,
      difficulty: "easy",
      categories: ["camping", "nature"],
      badge: null,
      rating: null,
      reviewCount: 0,
      status: "open",
      description:
        "آخر هفته‌ای کوتاه در کویر مرنجاب؛ کاروانسرای شاه‌عباسی، دریاچه نمک و شبی پر از ستاره.",
      highlights: ["کاروانسرای مرنجاب", "دریاچه نمک", "ستاره‌نگری"],
      includes: ["حمل‌ونقل آفرود", "شام", "چادر"],
      requiresApproval: true,
      creatorId: "u-parisa",
      itinerary: [
        day("maranjab-stars", 1, "کاروانسرا و غروب", [
          item("attraction", "کاروانسرای مرنجاب", "15:00", "مرنجاب"),
        ]),
        day("maranjab-stars", 2, "دریاچه نمک", [
          item("attraction", "دریاچه نمک", "07:00", "آران و بیدگل"),
        ]),
      ],
    },
    {
      ...base,
      id: "yazd-old-city",
      title: "شب‌گردی در بافت تاریخی یزد",
      destination: "یزد",
      province: "یزد",
      coverImageUrl: IMG.mesr,
      gallery: [IMG.mesr],
      startDate: isoDay(50),
      durationDays: 3,
      priceToman: 2_800_000,
      capacity: 10,
      minParticipants: 5,
      baseConfirmed: 0,
      difficulty: "easy",
      categories: ["historic"],
      badge: null,
      rating: null,
      reviewCount: 0,
      status: "pending_review",
      description:
        "بادگیرها، کوچه‌های خشتی، زورخانه و شیرینی‌های یزدی؛ تور فرهنگی سه‌روزه در شهر جهانی یزد.",
      highlights: ["باغ دولت‌آباد", "مسجد جامع", "زورخانه"],
      includes: ["اقامتگاه سنتی", "راهنما"],
      requiresApproval: false,
      creatorId: "u-ilia",
      submittedAt: isoNow(-60 * 5),
      itinerary: [
        day("yazd-old-city", 1, "بافت تاریخی", [
          item("attraction", "مسجد جامع یزد", "17:00", "یزد"),
        ]),
      ],
    },
    {
      ...base,
      id: "alborz-weekend",
      title: "آخر هفته در ییلاقات البرز",
      destination: "فیلبند",
      province: "مازندران",
      coverImageUrl: IMG.hyrcan,
      gallery: [IMG.hyrcan],
      startDate: isoDay(28),
      durationDays: 2,
      priceToman: 1_900_000,
      capacity: 12,
      minParticipants: 6,
      baseConfirmed: 0,
      difficulty: "easy",
      categories: ["nature", "camping"],
      badge: null,
      rating: null,
      reviewCount: 0,
      status: "pending_review",
      description:
        "دو روز روی دریای ابر فیلبند؛ کمپ در ارتفاع و طلوع آفتاب بالای ابرها.",
      highlights: ["دریای ابر", "کمپ ارتفاع"],
      includes: ["حمل‌ونقل", "چادر"],
      requiresApproval: false,
      creatorId: "u-reyhaneh",
      submittedAt: isoNow(-60 * 30),
      itinerary: [
        day("alborz-weekend", 1, "فیلبند", [
          item("activity", "برپایی کمپ", "16:00", "فیلبند"),
        ]),
      ],
    },
    {
      ...base,
      id: "kish-past",
      title: "سفر نوروزی به کیش",
      destination: "کیش",
      province: "هرمزگان",
      coverImageUrl: IMG.gulf,
      gallery: [IMG.gulf],
      startDate: isoDay(-120),
      durationDays: 4,
      priceToman: 8_500_000,
      capacity: 10,
      minParticipants: 5,
      baseConfirmed: 5,
      difficulty: "easy",
      categories: ["beach", "family"],
      badge: null,
      rating: 4.6,
      reviewCount: 12,
      status: "completed",
      description: "سفر نوروزی گذشته به جزیره کیش.",
      highlights: ["ساحل مرجان"],
      includes: ["هتل"],
      requiresApproval: false,
      creatorId: "u-pari",
      itinerary: [],
    },
  ];

  const hyrcanItem = (i: number) =>
    tours.find((t) => t.id === "hyrcanian-forest")?.itinerary[0]?.items[i]
      ?.id ?? "item-0";

  const requests: DbJoinRequest[] = [
    {
      id: "req-1",
      tourId: "hyrcanian-forest",
      userId: "u-parisa",
      status: "approved",
      message: "با خواهرم می‌آیم.",
      createdAt: isoNow(-60 * 24 * 6),
      decidedAt: isoNow(-60 * 24 * 6),
    },
    {
      id: "req-1b",
      tourId: "hyrcanian-forest",
      userId: "u-mahsa",
      status: "approved",
      message: "",
      createdAt: isoNow(-60 * 24 * 5),
      decidedAt: isoNow(-60 * 24 * 5),
    },
    {
      id: "req-1c",
      tourId: "hyrcanian-forest",
      userId: "u-reza",
      status: "approved",
      message: "",
      createdAt: isoNow(-60 * 24 * 4),
      decidedAt: isoNow(-60 * 24 * 4),
    },
    {
      id: "req-1d",
      tourId: "hyrcanian-forest",
      userId: "u-ilia",
      status: "approved",
      message: "",
      createdAt: isoNow(-60 * 24 * 3),
      decidedAt: isoNow(-60 * 24 * 3),
    },
    {
      id: "req-2",
      tourId: "kish-past",
      userId: "u-parisa",
      status: "approved",
      message: "",
      createdAt: isoNow(-60 * 24 * 150),
      decidedAt: isoNow(-60 * 24 * 150),
    },
    {
      id: "req-2b",
      tourId: "kish-past",
      userId: "u-mahsa",
      status: "approved",
      message: "",
      createdAt: isoNow(-60 * 24 * 149),
      decidedAt: isoNow(-60 * 24 * 149),
    },
    {
      id: "req-2c",
      tourId: "kish-past",
      userId: "u-reza",
      status: "approved",
      message: "",
      createdAt: isoNow(-60 * 24 * 149),
      decidedAt: isoNow(-60 * 24 * 149),
    },
    {
      id: "req-3",
      tourId: "maranjab-stars",
      userId: "u-mahsa",
      status: "pending",
      message: "تجربه کمپینگ کویری دارم و دوربین عکاسی هم می‌آورم.",
      createdAt: isoNow(-60 * 20),
      decidedAt: null,
    },
    {
      id: "req-4",
      tourId: "maranjab-stars",
      userId: "u-reza",
      status: "pending",
      message: "اولین سفر کویری‌ام است؛ امکان کرایه کیسه‌خواب هست؟",
      createdAt: isoNow(-60 * 8),
      decidedAt: null,
    },
  ];

  const destinations: DbDestination[] = [
    {
      id: "damavand",
      name: "دماوند",
      province: "مازندران",
      imageUrl: IMG.damavand,
      typicalDays: 3,
      match: ["دماوند"],
    },
    {
      id: "qeshm",
      name: "جزیره قشم",
      province: "هرمزگان",
      imageUrl: IMG.qeshm,
      typicalDays: 4,
      match: ["قشم"],
    },
    {
      id: "isfahan",
      name: "اصفهان",
      province: "اصفهان",
      imageUrl: IMG.isfahan,
      typicalDays: 3,
      match: ["اصفهان"],
    },
    {
      id: "gahar",
      name: "دریاچه گهر",
      province: "لرستان",
      imageUrl: IMG.lake,
      typicalDays: 5,
      match: ["گهر"],
    },
    {
      id: "yazd",
      name: "کویر یزد",
      province: "یزد",
      imageUrl: IMG.mesr,
      typicalDays: 3,
      match: ["یزد", "مصر"],
    },
    {
      id: "hormozgan",
      name: "خلیج فارس",
      province: "هرمزگان",
      imageUrl: IMG.gulf,
      typicalDays: 3,
      match: ["بندرعباس", "هرمز"],
    },
    {
      id: "mazandaran",
      name: "جنگل‌های شمال",
      province: "مازندران",
      imageUrl: IMG.hyrcan,
      typicalDays: 4,
      match: ["سوادکوه", "فیلبند"],
    },
    {
      id: "lorestan",
      name: "زاگرس و لرستان",
      province: "لرستان",
      imageUrl: IMG.shirom,
      typicalDays: 4,
      match: ["پلدختر"],
    },
  ];

  return {
    version: DB_VERSION,
    users,
    tours,
    requests,
    favorites: [
      {
        userId: "u-parisa",
        tourId: "mesr-desert",
        addedAt: isoNow(-60 * 24 * 2),
      },
    ],
    sessions: [
      {
        id: "sess-old-phone",
        userId: "u-parisa",
        device: "Chrome · Android",
        location: "تهران",
        lastActiveAt: isoNow(-60 * 26),
      },
    ],
    destinations,
    currentSessionId: null,
    otp: {},
    contacts: [],
    newsletter: [],
    comments: [
      {
        id: "c-1",
        tourId: "hyrcanian-forest",
        itemId: hyrcanItem(0),
        userId: "u-mahsa",
        text: "برای کلبه‌ها کیسه‌خواب لازم است؟",
        createdAt: isoNow(-60 * 20),
      },
      {
        id: "c-2",
        tourId: "hyrcanian-forest",
        itemId: hyrcanItem(0),
        userId: "u-reyhaneh",
        text: "نه، رختخواب کامل هست؛ فقط لباس گرم بیاورید.",
        createdAt: isoNow(-60 * 18),
      },
    ],
    changes: [
      {
        id: "ch-1",
        tourId: "hyrcanian-forest",
        at: isoNow(-60 * 24),
        text: "ساعت حرکت روز اول از ۶:۳۰ به ۷:۰۰ تغییر کرد.",
      },
    ],
    expenses: [
      {
        id: "ex-1",
        tourId: "hyrcanian-forest",
        title: "بیعانه کلبه‌های جنگلی",
        category: "accommodation",
        amountToman: 6_000_000,
        paidByUserId: "u-reyhaneh",
        createdAt: isoNow(-60 * 24 * 3),
      },
      {
        id: "ex-2",
        tourId: "hyrcanian-forest",
        title: "اجاره مینی‌بوس رفت و برگشت",
        category: "transport",
        amountToman: 4_500_000,
        paidByUserId: "u-reyhaneh",
        createdAt: isoNow(-60 * 24 * 2),
      },
      {
        id: "ex-3",
        tourId: "hyrcanian-forest",
        title: "خرید مواد غذایی شام اول",
        category: "food",
        amountToman: 1_500_000,
        paidByUserId: "u-reyhaneh",
        createdAt: isoNow(-60 * 24),
      },
    ],
    payments: [
      {
        id: "pay-1",
        tourId: "hyrcanian-forest",
        userId: "u-mahsa",
        amountToman: 2_400_000,
        status: "paid",
        at: isoNow(-60 * 20),
        reference: "TEST-41022",
      },
    ],
    messages: [
      {
        id: "m-1",
        tourId: "hyrcanian-forest",
        userId: "u-reyhaneh",
        text: "سلام به همه! تور قطعی شد 🎉 لیست وسایل رو در بخش چک‌لیست گذاشتم.",
        createdAt: isoNow(-60 * 30),
      },
      {
        id: "m-2",
        tourId: "hyrcanian-forest",
        userId: "u-mahsa",
        text: "عالیه! کسی از کرج حرکت می‌کنه؟",
        createdAt: isoNow(-60 * 26),
      },
      {
        id: "m-3",
        tourId: "hyrcanian-forest",
        userId: "u-reza",
        text: "من از قم میام، میدان آزادی می‌بینمتون.",
        createdAt: isoNow(-60 * 3),
      },
    ],
    readMarks: [
      {
        userId: "u-parisa",
        tourId: "hyrcanian-forest",
        lastReadAt: isoNow(-60 * 27),
      },
    ],
    polls: [
      {
        id: "poll-1",
        tourId: "hyrcanian-forest",
        question: "شام شب دوم کجا باشیم؟",
        options: [
          { id: "o1", text: "رستوران محلی کنار رودخانه" },
          { id: "o2", text: "باربیکیو کنار کلبه" },
          { id: "o3", text: "غذای خانگی روستا" },
        ],
        deadline: isoNow(60 * 24 * 4),
        createdAt: isoNow(-60 * 10),
      },
    ],
    votes: [
      { pollId: "poll-1", userId: "u-mahsa", optionId: "o2" },
      { pollId: "poll-1", userId: "u-reza", optionId: "o2" },
      { pollId: "poll-1", userId: "u-ilia", optionId: "o1" },
    ],
    checklist: [
      {
        id: "cl-1",
        tourId: "hyrcanian-forest",
        title: "کارت ملی",
        required: true,
      },
      {
        id: "cl-2",
        tourId: "hyrcanian-forest",
        title: "کفش مناسب پیاده‌روی",
        required: true,
      },
      {
        id: "cl-3",
        tourId: "hyrcanian-forest",
        title: "بارانی و لباس گرم",
        required: true,
      },
      {
        id: "cl-4",
        tourId: "hyrcanian-forest",
        title: "چراغ‌قوه یا هدلامپ",
        required: false,
      },
    ],
    checklistDone: [{ itemId: "cl-1", userId: "u-parisa" }],
    photos: [
      {
        id: "ph-1",
        tourId: "kish-past",
        userId: "u-mahsa",
        url: IMG.gulf,
        caption: "غروب ساحل مرجان",
        createdAt: isoNow(-60 * 24 * 115),
      },
      {
        id: "ph-2",
        tourId: "kish-past",
        userId: "u-pari",
        url: IMG.qeshm,
        caption: "آخرین شب سفر",
        createdAt: isoNow(-60 * 24 * 115),
      },
    ],
    notifications: [
      {
        id: "n-1",
        userId: "u-parisa",
        type: "request_approved",
        title: "درخواست شما تأیید شد",
        body: "به تور «جنگل‌های هیرکانی» پیوستید.",
        tourId: "hyrcanian-forest",
        createdAt: isoNow(-60 * 24 * 6),
        read: true,
      },
      {
        id: "n-2",
        userId: "u-parisa",
        type: "quorum_reached",
        title: "تور قطعی شد",
        body: "تور «جنگل‌های هیرکانی» به حد نصاب رسید.",
        tourId: "hyrcanian-forest",
        createdAt: isoNow(-60 * 24 * 3),
        read: false,
      },
      {
        id: "n-3",
        userId: "u-parisa",
        type: "plan_changed",
        title: "تغییر در برنامه",
        body: "ساعت حرکت روز اول تغییر کرد.",
        tourId: "hyrcanian-forest",
        createdAt: isoNow(-60 * 24),
        read: false,
      },
      {
        id: "n-4",
        userId: "u-parisa",
        type: "join_request",
        title: "درخواست پیوستن جدید",
        body: "دو نفر برای «کمپینگ ستاره‌نگری در کویر مرنجاب» درخواست داده‌اند.",
        tourId: "maranjab-stars",
        createdAt: isoNow(-60 * 8),
        read: false,
      },
    ],
    reviews: [
      {
        id: "rv-1",
        tourId: "kish-past",
        authorId: "u-mahsa",
        targetUserId: "u-parisa",
        rating: 5,
        comment: "همسفر خوش‌برخورد و منظم؛ عکس‌های فوق‌العاده‌ای گرفت.",
        createdAt: isoNow(-60 * 24 * 110),
      },
      {
        id: "rv-2",
        tourId: "kish-past",
        authorId: "u-pari",
        targetUserId: "u-parisa",
        rating: 5,
        comment: "سر وقت و همراه؛ دوباره باهاش سفر می‌کنم.",
        createdAt: isoNow(-60 * 24 * 110),
      },
    ],
    reports: [
      {
        id: "rp-1",
        reporterId: "u-reza",
        targetType: "tour",
        targetId: "alborz-weekend",
        targetLabel: "آخر هفته در ییلاقات البرز",
        reason: "قیمت اعلام‌شده با توضیحات هم‌خوانی ندارد.",
        status: "open",
        decisionNote: null,
        decidedAt: null,
        decidedBy: null,
        createdAt: isoNow(-60 * 40),
      },
    ],
    blocks: [],
  };
}
