import { getMongoose } from "../db/mongoose.mjs";
const mongoose = getMongoose();

const CuratedSchema = new mongoose.Schema(
  {
    key: { type: String, index: true, unique: true },
    data: { type: Object, required: true },
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
