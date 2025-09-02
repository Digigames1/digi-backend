// src/models/CuratedCatalog.mjs
import mongoose from "../db/mongoose.mjs";

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
    key: { type: String, required: true },
    brands: [
      {
        brand: { type: String, required: true },
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

