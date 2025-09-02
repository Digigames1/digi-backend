import mongoose from "mongoose";

let connected = false;

export async function connectMongo(uri = process.env.DB_URL || process.env.MONGODB_URI) {
  if (!uri) {
    console.warn("⚠️  No DB connection string provided (DB_URL / MONGODB_URI). Skipping connect.");
    return mongoose;
  }
  if (connected) return mongoose;

  mongoose.set("strictQuery", true);

  try {
    const conn = await mongoose.connect(uri, {
      // сучасні опції вже за замовчуванням у mongoose v7
    });
    connected = true;
    const dbName = conn.connection?.name || conn.connections?.[0]?.name || "(unknown)";
    console.log(`✅ Mongo connected: ${dbName}`);
  } catch (err) {
    console.error("❌ Mongo connect failed:", err?.message || err);
  }
  return mongoose;
}

export { mongoose };
export default mongoose;

