import mongoose from "mongoose";

const CuratedSchema = new mongoose.Schema(
  {
    key: { type: String, index: true, unique: true },
    data: { type: Object, required: true }, // { categories, meta, updatedAt }
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "curated_catalog" }
);

const Model =
  mongoose.models?.CuratedCatalog ||
  (mongoose.connection?.models?.CuratedCatalog) ||
  mongoose.model("CuratedCatalog", CuratedSchema);

// ЄДИНИЙ вірний експорт
export default Model;
