// src/models/BambooDump.mjs
import * as mg from "../db/mongoose.mjs";
const mongoose = mg.default || mg.mongoose || mg;

if (!mongoose || typeof mongoose.Schema !== "function") {
  throw new Error("Mongoose import failed in BambooDump.mjs");
}
if (!mongoose.models) mongoose.models = {};

const BambooDumpSchema = new mongoose.Schema(
  {
    // параметри запиту до каталогу, щоб ідентифікувати дамп
    query: { type: Object, default: {} },

    // сира відповідь (список сторінок / brands / products)
    items: { type: Array, default: [] },

    // службові
    pagesFetched: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "bamboo_dump" } // ФІКСУЄМО назву колекції
);

const BambooDump =
  mongoose.models.BambooDump ||
  mongoose.model("BambooDump", BambooDumpSchema);

export default BambooDump;
