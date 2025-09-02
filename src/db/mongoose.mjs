// src/db/mongoose.mjs
import mongoose from "mongoose";

let connected = false;

export async function connectMongo(uri = process.env.DB_URL) {
  if (!uri) throw new Error("DB_URL is not set");
  if (connected) return mongoose;

  // Опціональний строгий режим
  if (typeof mongoose.set === "function") {
    mongoose.set("strictQuery", true);
  }

  const conn = await mongoose.connect(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 15000,
    appName: process.env.DB_NAME || "Digi",
    dbName: process.env.DB_NAME || "digi",
  });

  connected = true;
  const dbName =
    conn.connection?.name ||
    conn.connections?.[0]?.name ||
    process.env.DB_NAME ||
    "digi";

  console.log(`Mongo connected: ${dbName}`);
  return mongoose;
}

// Єдиний експорт доступу до того самого інстансу
export function getMongoose() {
  return mongoose;
}

