import mongoose from "mongoose";

const BambooPageSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, index: true },
    pageIndex: { type: Number, required: true, index: true },
    items: { type: Array, default: [] },
    updatedAt: { type: Date, default: Date.now, index: true },
  },
  {
    collection: "bamboo_pages",
    strict: false,
    minimize: false,
  }
);

// Унікальність документів сторінок за ключем експорту + індекс сторінки
BambooPageSchema.index({ key: 1, pageIndex: 1 }, { unique: true });

// Експортуємо справжню модель (має .modelName, .find, .init тощо)
export const BambooPage =
  mongoose.models.BambooPage || mongoose.model("BambooPage", BambooPageSchema);
