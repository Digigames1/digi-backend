import { mongoose } from "../db/mongoose.mjs";

const Schema = new mongoose.Schema(
  {
    key: { type: String, required: true, index: true },
    query: {},
    pagesFetched: Number,
    total: Number,
    lastPage: Number,
    pageSize: Number,
    updatedAt: { type: Date, default: Date.now, index: true },
  },
  { collection: "bamboo_dump" }
);

Schema.index({ key: 1 }, { unique: true });

const _Model =
  (mongoose.models?.BambooDump) || mongoose.model("BambooDump", Schema);

export const BambooDump = _Model;
export default _Model;

console.log("[model] BambooDump registered (has deleteOne)", {
  hasDeleteOne: typeof BambooDump?.deleteOne === "function",
});
