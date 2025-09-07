// src/db/mongoose.mjs
import _mongoose from "mongoose";

// ЄДИНА інстанція mongoose, яку використовують всі моделі
export const mongoose = _mongoose;

/**
 * Підключення до MongoDB та повернення інстансу mongoose.
 * Викликається один раз під час старту серверу.
 */
export async function connectMongo() {
  // Страхуємося від подвійного set у деяких оточеннях
  try {
    mongoose.set("strictQuery", true);
  } catch {}

  const uri = process.env.DB_URL || process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || "digi";
  if (!uri) throw new Error("DB_URL/MONGODB_URI is not set");

  // Якщо вже підключені – повертаємо існуючий інстанс
  if (mongoose.connection?.readyState === 1) return mongoose;

  const conn = await mongoose.connect(uri, { dbName });

  const name =
    conn.connection?.name ||
    conn.connections?.[0]?.name ||
    dbName;
  console.log(`Mongo connected: ${name}`);
  return mongoose;
}

// Зворотна сумісність – деякі старі модулі могли викликати getMongoose
export function getMongoose() {
  return mongoose;
}

