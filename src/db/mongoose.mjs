// src/db/mongoose.mjs
import mongoose from "mongoose";

let connected = false;

export async function connectMongo() {
  if (connected) return mongoose.connection;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not set");

  // Безпечні опції для Mongoose >=7
  await mongoose.connect(uri, {
    // bufferCommands за замовчуванням true; залишаємо як є
    // serverSelectionTimeoutMS: 10000,
  });

  connected = true;
  console.log(`Mongo connected: ${mongoose.connection?.name || "(unknown)"}`);
  return mongoose.connection;
}

// ЄДИНИЙ екземпляр — і named, і default
export { mongoose };
export default mongoose;

// Безпечний доступ до нативної колекції
export function getNativeCollection(name) {
  const db = mongoose.connection?.db;
  if (!db) throw new Error("Mongo connection DB is not ready");
  return db.collection(name);
}
