// src/db/mongoose.mjs
// Робимо сумісний імпорт для будь-якого бандлінгу (ESM/CJS)
import * as M from "mongoose";

// Визначаємо реальний інстанс mongoose
const mg = (M?.default && (M.default.connect || M.default.set))
  ? M.default
  : M;

// Сінглтон-флаг підключення
let connected = false;

export function getMongoose() {
  return mg;
}

export async function connectMongo() {
  if (connected) return mg;

  const uri = process.env.DB_URL || process.env.MONGODB_URI || process.env.DB_URI;
  const dbName = process.env.DB_NAME || "Digi";

  if (!uri) {
    console.warn("Mongo URI not set (DB_URL / MONGODB_URI / DB_URI). Skipping connect.");
    return mg;
  }

  // деякі збірки віддають mg без set() — використовуємо опціонально
  try { mg.set?.("strictQuery", true); } catch {}

  console.log("ℹ️  Mongoose runtime:", {
    hasConnect: !!mg.connect,
    hasSet: !!mg.set,
    version: mg?.version || null,
    dbName,
  });

  await mg.connect(uri, { dbName });
  connected = true;

  console.log("✅ Mongo connected:", mg.connection?.name || "(unknown)");
  return mg;
}
