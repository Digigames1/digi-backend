import mongoose from "mongoose";

const CuratedSchema = new mongoose.Schema({
  key: { type: String, index: true, unique: true },
  data: { type: Object, required: true },
  updatedAt: { type: Date, default: Date.now },
}, { collection: "curated_catalog" });

export const CuratedCatalog = mongoose.models.CuratedCatalog || mongoose.model("CuratedCatalog", CuratedSchema);
