import mongoose from "mongoose";

const DumpSchema = new mongoose.Schema(
  {
    key: { type: String, index: true, unique: true },
    filters: { type: Object, default: {} },
    rows: { type: Array, default: [] }, // плоскі товари
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "bamboo_dump" }
);

// безпечна реєстрація моделі
const existing =
  (mongoose.connection && mongoose.connection.models && mongoose.connection.models.BambooDump) ||
  (mongoose.models && mongoose.models.BambooDump) ||
  null;

export const BambooDump = existing || mongoose.model("BambooDump", DumpSchema);
export default BambooDump;
