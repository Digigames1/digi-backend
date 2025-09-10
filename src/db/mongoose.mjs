// src/db/mongoose.mjs

// --- GLOBAL SINGLETON (щоб ВСІ файли отримували ту саму інстанцію)
if (!globalThis.__DG_MONGOOSE__) {
  // динамічний імпорт гарантує єдину інстанцію mongoose у всьому застосунку
  const _mongoose = (await import('mongoose')).default ?? (await import('mongoose'));
  globalThis.__DG_MONGOOSE__ = { mongoose: _mongoose, connected: false };
}
export const mongoose = globalThis.__DG_MONGOOSE__.mongoose;

export async function connectMongo() {
  const uri = process.env.DB_URL || process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || 'digi';
  if (!uri) throw new Error('DB_URL/MONGODB_URI is not set');
  if (!globalThis.__DG_MONGOOSE__.connected) {
    try { mongoose.set?.('strictQuery', true); } catch {}
    await mongoose.connect(uri, { dbName });
    globalThis.__DG_MONGOOSE__.connected = true;
    const name = mongoose.connection?.name || dbName;
    console.log(`Mongo connected: ${name}`);

    // register models once after successful connection
    if (!globalThis.__DG_MONGO_MODELS_REGISTERED__) {
      try {
        await import("../models/index.mjs");
        globalThis.__DG_MONGO_MODELS_REGISTERED__ = true;
      } catch (e) {
        console.error("Failed to register models", e);
      }
    }
  }
  return mongoose;
}
