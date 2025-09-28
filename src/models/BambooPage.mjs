// src/models/BambooPage.mjs
import mongoose from "mongoose";

const BambooPageSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, index: true },
    pageIndex: { type: Number, required: true, index: true },
    items: { type: Array, default: [] },
    updatedAt: { type: Date, default: Date.now, index: true },
  },
  { collection: "bamboo_pages", strict: false, minimize: false }
);

// унікальність пари key+pageIndex для апсерта
BambooPageSchema.index({ key: 1, pageIndex: 1 }, { unique: true });

export const BambooPage =
  mongoose.models.BambooPage || mongoose.model("BambooPage", BambooPageSchema);

export default BambooPage;
