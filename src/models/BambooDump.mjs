import mongoose from "mongoose";

const BambooDumpSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    query: { type: Object, default: {} },
    pagesFetched: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    lastPage: { type: Number, default: null },
    pageSize: { type: Number, default: 100 },
    updatedAt: { type: Date, default: Date.now, index: true },
  },
  {
    collection: "bamboo_dump",
    strict: false,
    minimize: false,
  }
);

export const BambooDump =
  mongoose.models.BambooDump || mongoose.model("BambooDump", BambooDumpSchema);
