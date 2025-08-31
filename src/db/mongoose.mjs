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

  const uri =
    process.env.DB_URL ||
    process.env.MONGODB_URI ||
    process.env.DB_URI;

  // 👇 правильна назва БД: digi (як в Atlas)
  const dbName = process.env.DB_NAME || "digi";

  if (!uri) {
    console.warn("Mongo URI not set (DB_URL / MONGODB_URI / DB_URI). Skipping connect.");
    return mg;
  }

  try { mg.set?.("strictQuery", true); } catch {}

  await mg.connect(uri, { dbName });

  connected = true;

  // 👇 коректне логування імені БД в різних версіях Mongoose/драйвера
  const name =
    mg.connection?.name ||
    mg.connection?.db?.databaseName ||
    dbName;

  console.log("✅ Mongo connected:", name);
  return mg;
}
