// src/models/RateLimit.mjs
import { mongoose } from "../db/mongoose.mjs";

const RateLimitSchema = new mongoose.Schema({
  key: { type: String, unique: true, index: true }, // 'bamboo:catalog'
  nextRetryAt: { type: Date, default: null },
  updatedAt: { type: Date, default: Date.now },
}, { collection: "rate_limits" });

export const RateLimit =
  (mongoose.models?.RateLimit) || mongoose.model("RateLimit", RateLimitSchema);
