import mongoose from "mongoose";

const CuratedSchema = new mongoose.Schema(
  {
    key: { type: String, index: true, unique: true },
    data: { type: Object, required: true }, // { categories, meta, updatedAt }
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "curated_catalog" }
);

// Реєструємо один раз
const CuratedCatalogModel =
  mongoose.models?.CuratedCatalog ||
  (mongoose.connection?.models?.CuratedCatalog) ||
  mongoose.model("CuratedCatalog", CuratedSchema);

// 🔑 Експортуємо і як default, і як named — щоб спіймати всі стилі імпорту
export const CuratedCatalog = CuratedCatalogModel;
export default CuratedCatalogModel;
