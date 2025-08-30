import mongoose from "mongoose";
const FxSchema = new mongoose.Schema({
  base: { type: String, index: true },
  rates: { type: Object, required: true },
  fetchedAt: { type: Date, default: Date.now },
}, { collection: "fx_rates" });

export const FxRates = mongoose.models.FxRates || mongoose.model("FxRates", FxSchema);
