import mongoose from "mongoose";

const DumpSchema = new mongoose.Schema(
  {
    key: { type: String, index: true, unique: true },  // унікальний ключ кешу (фільтри)
    filters: { type: Object, default: {} },
    rows: { type: Array, default: [] },                // плоский список товарів
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "bamboo_dump" }
);

const existing =
  (mongoose.connection?.models?.BambooDump) ||
  (mongoose.models?.BambooDump) ||
  null;

export const BambooDump = existing || mongoose.model("BambooDump", DumpSchema);
export default BambooDump;
