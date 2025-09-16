import { CuratedCatalog } from "../models/CuratedCatalog.mjs";
import { BambooDump } from "../models/BambooDump.mjs";
import { BambooPage } from "../models/BambooPage.mjs";

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
  if (!dump) {
    return { ok: false, reason: "No BambooDump document found" };
  }

  const dumpKey = dump.key;
  const pages = await BambooPage.find({ key: dumpKey }, {}).sort({ pageIndex: 1 }).lean();
  const allItems = pages.flatMap((p) => p.items || []);
  if (!allItems.length) {
    return { ok: false, reason: `No items across pages (pagesFetched=${dump.pagesFetched ?? 0})` };
  }

  const byCategory = {
    gaming: [],
    streaming: [],
    shopping: [],
    music: [],
    food: [],
    travel: [],
  };

  for (const it of allItems) {
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

  const curatedKey = "default";
  const payload = {
    key: curatedKey,
    items: [
      // Можна зберігати плоский масив або додати groups — зараз збережемо групи в source
    ],
    currencies,
    source: {
      bambooPages: pages.length || dump.pagesFetched || 0,
      bambooCount: dump.total || allItems.length,
      groups: Object.fromEntries(Object.entries(byCategory).map(([k, v]) => [k, v.length])),
    },
    updatedAt: new Date(),
  };

  await CuratedCatalog.findOneAndUpdate(
    { key: curatedKey },
    { $set: payload },
    { upsert: true, new: true }
  );

  return {
    ok: true,
    counts: payload.source.groups,
    totalItems: allItems.length,
    bamboo: {
      pages: dump.pagesFetched ?? pages.length ?? 0,
      total: dump.total ?? allItems.length,
      lastPage: dump.lastPage ?? null,
    },
  };
}

export async function getCuratedSection(section = "gaming") {
  const doc = await CuratedCatalog.findOne({ key: "default" }).lean();
  if (!doc) return { ok: false, items: [] };
  // просто на основі останнього дампа повторно побудуємо секцію (щоб не тримати дубль)
  const dump = await BambooDump.findOne({}, {}, { sort: { updatedAt: -1 } }).lean();
  if (!dump) return { ok: false, items: [] };

  const pages = await BambooPage.find({ key: dump.key }, {}).sort({ pageIndex: 1 }).lean();
  const allItems = pages.flatMap((p) => p.items || []);
  if (!allItems.length) return { ok: false, items: [] };

  const result = [];
  for (const it of allItems) {
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

