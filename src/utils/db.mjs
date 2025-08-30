import mongoose from "mongoose";

const uri =
  process.env.MONGODB_URI ||
  process.env.DB_URL ||
  "";

export async function connectMongo() {
  if (!uri) {
    console.warn("⚠️  No Mongo URI provided (checked MONGODB_URI and DB_URL). Skipping DB connection.");
    return;
  }
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
    });
    console.log("✅ Mongo connected:", mongoose.connection.name);
  } catch (e) {
    console.error("❌ Mongo connect failed:", e?.message || e);
  }
}

export function mongoReady() {
  return mongoose.connection?.readyState === 1;
}
