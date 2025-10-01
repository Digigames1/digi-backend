// src/db/mongoose.mjs
import mongoose from "mongoose";
export { default as mongoose } from "mongoose";

let connectPromise = null;

export async function connectMongo(uri, dbName) {
  const finalUri = uri || process.env.MONGODB_URI || process.env.DB_URL || process.env.MONGO_URL;
  if (!finalUri) {
    throw new Error("MONGODB_URI/DB_URL not set");
  }
  if (!connectPromise) {
    mongoose.set?.("strictQuery", true);
    connectPromise = mongoose
      .connect(finalUri, {
        dbName: dbName || process.env.MONGODB_DB_NAME || process.env.DB_NAME || undefined,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 15000,
      })
      .catch((e) => {
        connectPromise = null;
        throw e;
      });
  }
  await connectPromise;
  return mongoose.connection;
}

export function isMongoReady() {
  return mongoose?.connection?.readyState === 1;
}

/**
 * Повертає native Db-інстанс, ініціалізуючи його за потреби.
 */
export function getNativeDb() {
  const conn = mongoose.connection;
  // 1 = connected
  if (!conn || conn.readyState !== 1) {
    throw new Error(`Mongo connection not connected (state=${conn?.readyState ?? "n/a"})`);
  }
  if (conn.db) return conn.db;

  // Ініціалізуємо db, якщо відсутній (Atlas/driver 6 інколи не виставляє його автоматично)
  const client = conn.getClient?.();
  const name = conn.name || process.env.MONGODB_DB_NAME || "test";
  if (client && typeof client.db === "function") {
    const db = client.db(name);
    // збережемо, щоб наступні виклики були швидкі
    conn.db = db;
    return db;
  }
  throw new Error("Mongo client db handle is not available");
}

export function getNativeCollection(name) {
  const db = getNativeDb();
  return db.collection(name);
}

