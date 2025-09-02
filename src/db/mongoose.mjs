import mongoosePkg from "mongoose";

/**
 * Make sure we have ONE global mongoose instance across the whole app,
 * regardless of how files import it (default/named) or module cache quirks.
 */
const M = globalThis.__MONGOOSE_SINGLETON__ || mongoosePkg;
globalThis.__MONGOOSE_SINGLETON__ = M;

// ensure models map exists (defensive for odd bundlers)
if (!M.models) M.models = {};

/** Connect once; re-use afterwards */
export async function connectMongo() {
  const uri =
    process.env.DB_URL ||
    process.env.MONGODB_URI ||
    process.env.DB_URI;

  const dbName = process.env.DB_NAME || "digi";

  if (!uri) {
    console.warn("⚠️  No Mongo URI (DB_URL/MONGODB_URI/DB_URI) — skipping connect");
    return M;
  }

  // mongoose.set may be absent on some stubs—guard it
  try { if (typeof M.set === "function") M.set("strictQuery", true); } catch {}

  if (M.connection?.readyState === 1) return M;

  const conn = await M.connect(uri, { dbName });
  const name =
    conn?.connection?.name ||
    conn?.connections?.[0]?.name ||
    dbName ||
    "(unknown)";
  console.log("✅ Mongo connected:", name);
  return M;
}

/** Default export = the singleton instance */
export default M;
/** Named export for safety */
export { M as mongoose };
