import mongoose from "mongoose";

const CuratedSchema = new mongoose.Schema(
  {
    key: { type: String, index: true, unique: true },
    data: { type: Object, required: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "curated_catalog" }
);

// Безпечний доступ, щоб не падати коли mongoose.models ще не готовий
const existingModel =
  (mongoose.connection && mongoose.connection.models && mongoose.connection.models.CuratedCatalog) ||
  (mongoose.models && mongoose.models.CuratedCatalog) ||
  null;

export const CuratedCatalog =
  existingModel || mongoose.model("CuratedCatalog", CuratedSchema);

export default CuratedCatalog;
