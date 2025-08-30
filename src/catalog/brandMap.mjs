export const CATEGORY_BRANDS = {
  gaming: {
    title: "Gaming",
    match: [
      /playstation|psn/i,
      /xbox/i,
      /nintendo/i,
      /steam/i,
    ],
  },
  streaming: {
    title: "Streaming",
    match: [
      /twitch/i,
    ],
  },
  shopping: {
    title: "Shopping",
    match: [
      /zalando|zelando/i,
      /\bamazon\b/i,
      /\bebay\b/i,
    ],
  },
  music: {
    title: "Music",
    match: [
      /spotify/i,
      /google\s*play/i,
      /apple\s*(music|itunes)/i,
    ],
  },
  food: {
    title: "Food & Drink",
    match: [
      /starbucks?/i,
      /uber\s*eats/i,
    ],
  },
  travel: {
    title: "Travel",
    match: [
      /airbnb/i,
      /\buber\b/i,
    ],
  },
};

export function detectCategory(brandName = "") {
  for (const [key, cfg] of Object.entries(CATEGORY_BRANDS)) {
    if (cfg.match.some(rx => rx.test(brandName))) return key;
  }
  return null;
}
