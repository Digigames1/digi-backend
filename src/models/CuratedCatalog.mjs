import { getMongoose } from "../db/mongoose.mjs";
const mongoose = getMongoose();

/**
 * Кеш по категоріях для фронта
 * key: "gaming" | "streaming" | "shopping" | "music" | "food" | "travel"
 */
const CuratedSchema = new mongoose.Schema(
  {
    key: { type: String, index: true, unique: true },
    data: {
      type: Object,
      required: true, // { items: [], currencies: [...], counts: {...} }
    },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "curated_catalog" }
);

const CuratedCatalogModel =
  mongoose.models?.CuratedCatalog ||
  (mongoose.connection?.models?.CuratedCatalog) ||
  mongoose.model("CuratedCatalog", CuratedSchema);

export const CuratedCatalog = CuratedCatalogModel;
export default CuratedCatalogModel;
