import { CuratedCatalog } from "../models/CuratedCatalog.mjs";
import { BambooDump } from "../models/BambooDump.mjs";

const BRAND_TO_CATEGORY = {
  // Gaming
  "PlayStation": "gaming",
  "PSN": "gaming",
  "Sony PlayStation": "gaming",
  "Xbox": "gaming",
  "Microsoft Xbox": "gaming",
  "Nintendo": "gaming",
  "Steam": "gaming",

  // Streaming
  "Twitch": "streaming",
  "Netflix": "streaming",
  "Disney+": "streaming",

  // Shopping
  "Amazon": "shopping",
  "eBay": "shopping",
  "Zalando": "shopping",

  // Music
  "Spotify": "music",
  "Apple Music": "music",
  "Google Play": "music",

  // Food & drink
  "Starbucks": "food",
  "Uber Eats": "food",

  // Travel
  "Airbnb": "travel",
  "Uber": "travel",
};

function norm(s) {
  return (s || "").toString().trim().toLowerCase();
}

// простий нормалізатор назви брендів (щоб ловити варіанти)
function normalizeBrand(name) {
  const n = norm(name);
  if (/playstation|psn/.test(n)) return "PlayStation";
  if (/xbox/.test(n)) return "Xbox";
  if (/nintendo/.test(n)) return "Nintendo";
  if (/steam/.test(n)) return "Steam";
  if (/twitch/.test(n)) return "Twitch";
  if (/zalando/.test(n)) return "Zalando";
  if (/amazon/.test(n)) return "Amazon";
  if (/\be(-)?bay\b/.test(n)) return "eBay";
  if (/spotify/.test(n)) return "Spotify";
  if (/apple\s?music/.test(n)) return "Apple Music";
  if (/google\s?play/.test(n)) return "Google Play";
  if (/starbucks/.test(n)) return "Starbucks";
  if (/uber\s?eats/.test(n)) return "Uber Eats";
  if (/airbnb/.test(n)) return "Airbnb";
  if (/^\s*uber\s*$/.test(n)) return "Uber";
  return name || "Unknown";
}

export async function buildCurated({ currencies = ["USD", "EUR", "CAD", "AUD"] } = {}) {
  // беремо будь-який останній дамп
  const dump = await BambooDump.findOne({}, {}, { sort: { updatedAt: -1 } }).lean();
  if (!dump?.items?.length) {
    return { ok: false, reason: "No BambooDump data yet" };
  }

  const byCategory = {
    gaming: [],
    streaming: [],
    shopping: [],
    music: [],
    food: [],
    travel: [],
  };

  for (const it of dump.items) {
    const brand = normalizeBrand(it.brand);
    const category = BRAND_TO_CATEGORY[brand];
    if (!category) continue;

    // мапимо в кілька валют (якщо в сирих даних валют кілька — можна розширити)
    const curr = it.currencyCode || it.raw?.price?.currencyCode || null;
    const possibleCurrencies = curr ? [curr] : currencies;

    for (const cc of possibleCurrencies) {
      byCategory[category].push({
        productId: it.id,
        name: it.name,
        brand,
        countryCode: it.countryCode || it.raw?.countryCode || null,
        currencyCode: cc,
        price: it.priceMin ?? it.priceMax ?? it.raw?.price?.min ?? it.raw?.price?.max ?? null,
        logos: it.raw?.logoUrl ? [it.raw.logoUrl] : [],
        raw: { id: it.id, brand: it.brand, currencyCode: curr, ...it.raw },
      });
    }
  }

  const key = "default";
  const payload = {
    key,
    items: [
      // Можна зберігати плоский масив або додати groups — зараз збережемо групи в source
    ],
    currencies,
    source: {
      bambooPages: dump.pagesFetched || 0,
      bambooCount: dump.total || dump.items.length,
      groups: Object.fromEntries(Object.entries(byCategory).map(([k, v]) => [k, v.length])),
    },
    updatedAt: new Date(),
  };

  await CuratedCatalog.findOneAndUpdate(
    { key },
    { $set: payload },
    { upsert: true, new: true }
  );

  return { ok: true, counts: payload.source.groups };
}

export async function getCuratedSection(section = "gaming") {
  const doc = await CuratedCatalog.findOne({ key: "default" }).lean();
  if (!doc) return { ok: false, items: [] };
  // просто на основі останнього дампа повторно побудуємо секцію (щоб не тримати дубль)
  const dump = await BambooDump.findOne({}, {}, { sort: { updatedAt: -1 } }).lean();
  if (!dump?.items?.length) return { ok: false, items: [] };

  const result = [];
  for (const it of dump.items) {
    const brand = normalizeBrand(it.brand);
    const category = BRAND_TO_CATEGORY[brand];
    if (category !== section) continue;
    const cc = it.currencyCode || it.raw?.price?.currencyCode || null;
    result.push({
      productId: it.id,
      name: it.name,
      brand,
      countryCode: it.countryCode || it.raw?.countryCode || null,
      currencyCode: cc,
      price: it.priceMin ?? it.priceMax ?? it.raw?.price?.min ?? it.raw?.price?.max ?? null,
      logos: it.raw?.logoUrl ? [it.raw.logoUrl] : [],
    });
  }
  return { ok: true, items: result };
}

