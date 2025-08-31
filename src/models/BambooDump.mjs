import { getMongoose } from "../db/mongoose.mjs";
const mongoose = getMongoose();

/**
 * Зберігаємо "сирий" дамп каталогу (масив брендів з продуктами)
 * ключ — для параметризації дампу (версія/валюти/сортування тощо)
 */
const DumpSchema = new mongoose.Schema(
  {
    key: { type: String, index: true, unique: true },
    filters: { type: Object, default: {} },
    rows: { type: Array, default: [] }, // масив брендів з продуктами
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "bamboo_dump" }
);

const BambooDumpModel =
  mongoose.models?.BambooDump ||
  (mongoose.connection?.models?.BambooDump) ||
  mongoose.model("BambooDump", DumpSchema);

export const BambooDump = BambooDumpModel;
export default BambooDumpModel;
