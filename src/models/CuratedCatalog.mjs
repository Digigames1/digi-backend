// src/models/CuratedCatalog.mjs
import * as mg from "../db/mongoose.mjs";

// Ultra-robust way to get the singleton mongoose
const mongoose = mg.default || mg.mongoose || mg;
if (!mongoose || typeof mongoose.Schema !== "function") {
  throw new Error("Mongoose import failed in CuratedCatalog.mjs");
}

// defensive: make sure models map exists
if (!mongoose.models) mongoose.models = {};

const PriceSchema = new mongoose.Schema(
  { currency: String, amount: Number },
  { _id: false }
);

const ProductSchema = new mongoose.Schema(
  {
    productId: { type: Number, required: true },
    name: { type: String, required: true },
    countryCode: String,
    currencyCode: String,
    logoUrl: String,
    prices: [PriceSchema],
    raw: Object,
  },
  { _id: false }
);

const CategorySchema = new mongoose.Schema(
  {
    key: { type: String, required: true }, // gaming / streaming / shopping / music / food / travel ...
    brands: [
      {
        brand: { type: String, required: true }, // Playstation / Xbox / Steam / Nintendo / ...
        items: [ProductSchema],
      },
    ],
  },
  { _id: false }
);

const CuratedSchema = new mongoose.Schema(
  {
    slug: { type: String, default: "default", unique: true, index: true },
    currencies: [String],
    categories: [CategorySchema],
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: "curated_catalog" }
);

const CuratedCatalog =
  mongoose.models.CuratedCatalog ||
  mongoose.model("CuratedCatalog", CuratedSchema);

export default CuratedCatalog;
export { CuratedCatalog };
