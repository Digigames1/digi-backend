// src/models/CuratedCatalog.mjs
import * as mg from "../db/mongoose.mjs";
const mongoose = mg.default || mg.mongoose || mg;

if (!mongoose || typeof mongoose.Schema !== "function") {
  throw new Error("Mongoose import failed in CuratedCatalog.mjs");
}
if (!mongoose.models) mongoose.models = {};

const CuratedSchema = new mongoose.Schema(
  {
    // ключ кешу (категорія/валюти тощо)
    key: { type: String, required: true, index: true, unique: true },

    // масив товарів, що показуємо на фронті
    items: { type: Array, default: [] },

    // метадані побудови
    currencies: { type: [String], default: [] },
    groups: { type: Object, default: {} }, // gaming/streaming/shopping/... -> масиви
    updatedAt: { type: Date, default: Date.now },
    source: {
      bambooPages: { type: Number, default: 0 },
      bambooCount: { type: Number, default: 0 },
    },
  },
  { collection: "curated_catalog" } // ФІКСУЄМО назву колекції
);

// реєструємо МОДЕЛЬ (оце і додає її в mongoose.modelNames())
const CuratedCatalog =
  mongoose.models.CuratedCatalog ||
  mongoose.model("CuratedCatalog", CuratedSchema);

export default CuratedCatalog;
