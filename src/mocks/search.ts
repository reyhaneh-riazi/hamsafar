/* Mock implementation of the descriptive search endpoint (rule-based Persian parsing).
   The real backend owns ranking; the UI only displays `understood` chips and `matchReasons`. */
import type {
  Difficulty,
  TourCategory,
} from "@/features/tours/api/tour-schemas";
import {
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
} from "@/features/tours/model/labels";
import { toLatinDigits } from "@/shared/lib/digits";
import type { DbTour } from "./seed";

const normalize = (s: string) =>
  toLatinDigits(s)
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/‌/g, " ")
    .toLowerCase()
    .trim();

const REGIONS: { word: RegExp; label: string; provinces: string[] }[] = [
  {
    word: /شمال/,
    label: "شمال کشور",
    provinces: ["مازندران", "گیلان", "گلستان"],
  },
  {
    word: /جنوب|خلیج فارس/,
    label: "جنوب و خلیج فارس",
    provinces: ["هرمزگان", "بوشهر"],
  },
  {
    word: /نزدیک تهران|اطراف تهران/,
    label: "نزدیک تهران",
    provinces: ["تهران", "البرز", "مازندران", "سمنان", "اصفهان"],
  },
  {
    word: /زاگرس|لرستان/,
    label: "زاگرس",
    provinces: ["لرستان", "چهارمحال و بختیاری"],
  },
];

const CATEGORY_WORDS: { re: RegExp; category: TourCategory }[] = [
  { re: /جنگل|طبیعت|دریاچه|ییلاق|روستا/, category: "nature" },
  { re: /کمپ|چادر|کویر|ستاره|بیابان/, category: "camping" },
  { re: /تاریخ|فرهنگ|معماری|موزه|بافت/, category: "historic" },
  { re: /ماجرا|صعود|قله|دره|هیجان|آبشار/, category: "adventure" },
  { re: /ساحل|دریا|جزیره/, category: "beach" },
  { re: /خانواد|بچه|کودک/, category: "family" },
];

const NUMBER_WORDS: Record<string, number> = {
  یک: 1,
  دو: 2,
  سه: 3,
  چهار: 4,
  پنج: 5,
  شش: 6,
  هفت: 7,
};

interface Intent {
  provinces: string[];
  places: string[];
  categories: TourCategory[];
  maxPrice?: number;
  days?: number;
  difficulty?: Difficulty;
  understood: string[];
}

export function parseIntent(text: string, tours: DbTour[]): Intent {
  const q = normalize(text);
  const intent: Intent = {
    provinces: [],
    places: [],
    categories: [],
    understood: [],
  };

  REGIONS.forEach((r) => {
    if (r.word.test(q)) {
      intent.provinces.push(...r.provinces);
      intent.understood.push(`منطقه: ${r.label}`);
    }
  });

  const places = new Set<string>();
  tours.forEach((t) => {
    places.add(t.province);
    t.destination
      .split(/،|,| و /)
      .forEach((p) => p.trim().length >= 3 && places.add(p.trim()));
  });
  places.forEach((p) => {
    if (q.includes(normalize(p))) {
      intent.places.push(p);
      intent.understood.push(`مقصد: ${p}`);
    }
  });

  CATEGORY_WORDS.forEach(({ re, category }) => {
    if (re.test(q) && !intent.categories.includes(category)) {
      intent.categories.push(category);
      intent.understood.push(`سبک: ${CATEGORY_LABELS[category]}`);
    }
  });

  const million = q.match(/(\d+(?:[.,/]\d+)?)\s*میلیون/);
  if (million?.[1])
    intent.maxPrice = Math.round(
      parseFloat(million[1].replace(/[,/]/g, ".")) * 1_000_000,
    );
  else if (/ارزان|اقتصادی|دانشجویی|کم ?هزینه|بودجه مناسب|بودجه کم/.test(q))
    intent.maxPrice = 4_000_000;
  if (intent.maxPrice)
    intent.understood.push(
      `بودجه تا ${intent.maxPrice.toLocaleString("fa-IR")} تومان`,
    );

  const dayNum = q.match(/(\d+)\s*روز/);
  const dayWord = q.match(/(یک|دو|سه|چهار|پنج|شش|هفت)\s*روز/);
  if (dayNum?.[1]) intent.days = parseInt(dayNum[1], 10);
  else if (dayWord?.[1]) intent.days = NUMBER_WORDS[dayWord[1]];
  else if (/آخر ?هفته/.test(q)) intent.days = 2;
  if (intent.days)
    intent.understood.push(`مدت: ${intent.days.toLocaleString("fa-IR")} روز`);

  if (/آسان|راحت|سبک/.test(q)) intent.difficulty = "easy";
  else if (/سخت|حرفه ?ای|سنگین/.test(q)) intent.difficulty = "hard";
  if (intent.difficulty)
    intent.understood.push(`سختی: ${DIFFICULTY_LABELS[intent.difficulty]}`);

  return intent;
}

export function scoreTour(
  t: DbTour,
  intent: Intent,
  text: string,
): { score: number; reasons: string[] } {
  let possible = 0;
  let earned = 0;
  const reasons: string[] = [];
  const add = (weight: number, ok: boolean, reason: string, partial = 0) => {
    possible += weight;
    if (ok) {
      earned += weight;
      reasons.push(reason);
    } else earned += partial;
  };

  if (intent.places.length) {
    add(
      40,
      intent.places.some(
        (p) =>
          t.destination.includes(p) || t.province === p || t.title.includes(p),
      ),
      `مقصد: ${t.destination}`,
    );
  }
  if (intent.provinces.length)
    add(25, intent.provinces.includes(t.province), `در استان ${t.province}`);
  if (intent.categories.length) {
    const hits = intent.categories.filter((c) => t.categories.includes(c));
    add(
      20,
      hits.length > 0,
      `سبک ${hits.map((c) => CATEGORY_LABELS[c]).join("، ")}`,
    );
  }
  if (intent.maxPrice) {
    const over = t.priceToman - intent.maxPrice;
    add(
      15,
      over <= 0,
      "در محدوده بودجه",
      over <= intent.maxPrice * 0.2 ? 6 : 0,
    );
  }
  if (intent.days)
    add(
      10,
      t.durationDays === intent.days,
      `${t.durationDays.toLocaleString("fa-IR")} روزه`,
      Math.abs(t.durationDays - intent.days) === 1 ? 5 : 0,
    );
  if (intent.difficulty)
    add(
      5,
      t.difficulty === intent.difficulty,
      `سختی ${DIFFICULTY_LABELS[t.difficulty]}`,
    );

  // Free words also match places inside the itinerary (hotels, restaurants, attractions).
  const stop = new Set([
    "تور",
    "سفر",
    "برای",
    "با",
    "به",
    "از",
    "در",
    "که",
    "یک",
    "روزه",
    "روز",
    "نزدیک",
    "بودجه",
    "مناسب",
    "یه",
    "رو",
    "و",
  ]);
  const words = normalize(text)
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !stop.has(w) && !/^\d+$/.test(w));
  const hay = normalize(
    [
      t.title,
      t.description,
      ...t.highlights,
      ...t.itinerary.flatMap((d) =>
        d.items.map((i) => `${i.title} ${i.location ?? ""}`),
      ),
    ].join(" "),
  );
  const hits = words.filter((w) => hay.includes(w));
  if (words.length) {
    possible += 30;
    earned += Math.round((30 * hits.length) / words.length);
    if (hits.length) reasons.push(`شامل «${hits.slice(0, 2).join("، ")}»`);
  }
  return {
    score: possible === 0 ? 0 : Math.round((earned / possible) * 100),
    reasons,
  };
}
