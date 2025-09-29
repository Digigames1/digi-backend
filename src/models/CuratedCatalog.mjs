import mongoose from "mongoose";

const CuratedSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    groups: { type: Array, default: [] },
    updatedAt: { type: Date, default: Date.now, index: true },
  },
  { collection: "curated_catalog", strict: false, minimize: false }
);

export const CuratedCatalog =
  mongoose.models.CuratedCatalog || mongoose.model("CuratedCatalog", CuratedSchema);

