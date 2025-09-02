import mongoose from "mongoose";

/** ЄДИНИЙ інстанс mongoose у всьому застосунку — default export */
export default mongoose;

/** Підключення до Mongo — викликаємо один раз на старті */
export async function connectMongo() {
  const uri =
    process.env.DB_URL ||
    process.env.MONGODB_URI ||
    process.env.DB_URI;

  if (!uri) {
    console.warn("⚠️  No Mongo URI (DB_URL/MONGODB_URI/DB_URI) — skipping connect");
    return mongoose;
  }

  // На деяких збірках .set може бути відсутній як функція — підстрахуємось
  try { if (typeof mongoose.set === "function") mongoose.set("strictQuery", true); } catch {}

  // Якщо вже підключені — нічого не робимо
  if (mongoose.connection?.readyState === 1) return mongoose;

  const conn = await mongoose.connect(uri, {
    // опції за замовчуванням у v7+
  });

  const name = conn.connection?.name || conn.connections?.[0]?.name || "(unknown)";
  console.log("✅ Mongo connected:", name);

  return mongoose;
}

