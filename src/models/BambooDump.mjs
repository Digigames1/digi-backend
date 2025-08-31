import mongoose from "mongoose";

const DumpSchema = new mongoose.Schema(
  {
    key: { type: String, index: true, unique: true },
    filters: { type: Object, default: {} },
    rows: { type: Array, default: [] },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "bamboo_dump" }
);

const Model =
  mongoose.models?.BambooDump ||
  (mongoose.connection?.models?.BambooDump) ||
  mongoose.model("BambooDump", DumpSchema);

export default Model;
