export const CATEGORY_BRANDS = {
  gaming: {
    title: "Gaming",
    match: [
      // PlayStation / PSN
      /\bplay\s*station\b/i,
      /\bpsn\b/i,
      /sony\s*(psn|play\s*station)/i,
      // Xbox
      /\bxbox\b/i,
      /\bms\s*xbox\b/i,
      // Nintendo
      /\bnintendo\b/i,
      /\be?shop\b.*nintendo/i,
      // Steam
      /\bsteam\b/i,
      /valve\s*steam/i,
    ],
  },
  // інші категорії додамо пізніше
};

export function detectCategory(brandName = "") {
  for (const [key, cfg] of Object.entries(CATEGORY_BRANDS)) {
    if (cfg.match.some(rx => rx.test(brandName))) return key;
  }
  return null;
}
