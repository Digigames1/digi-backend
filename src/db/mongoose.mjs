// src/db/mongoose.mjs
import mongoose from "mongoose";
export { default as mongoose } from "mongoose";

let connectPromise = null;

/**
 * ПОВИННО бути викликано на старті (у вас вже є connectMongo).
 * Тут змін не робимо, лише залишаємо як є.
 */
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
 * Надійно повертає native DB handle і кешує його в connection.db,
 * навіть якщо драйвер/версія Mongoose не виставили його автоматично.
 */
export function getNativeDb() {
  const conn = mongoose.connection;

  if (!conn || conn.readyState !== 1) {
    throw new Error(`Mongo connection not connected (state=${conn?.readyState ?? "n/a"})`);
  }

  if (conn.db) return conn.db;

  const client =
    (typeof conn.getClient === "function" ? conn.getClient() : null) ||
    conn.client ||
    (mongoose.connections && mongoose.connections[0] && mongoose.connections[0].client) ||
    null;

  const name =
    conn.name ||
    process.env.MONGODB_DB_NAME ||
    (() => {
      try {
        const raw = process.env.MONGODB_URI || process.env.DB_URL || "";
        if (!raw) return null;
        const u = new URL(raw);
        const path = (u.pathname || "").replace(/^\/+/, "");
        return path || null;
      } catch {
        return null;
      }
    })() ||
    "test";

  if (client && typeof client.db === "function") {
    const db = client.db(name);
    conn.db = db;
    return db;
  }

  const maybeDb =
    (mongoose.connections && mongoose.connections[0] && mongoose.connections[0].db) ||
    null;
  if (maybeDb) {
    conn.db = maybeDb;
    return maybeDb;
  }

  throw new Error("Mongo client db handle is not available");
}

export function getNativeCollection(name) {
  const db = getNativeDb();
  return db.collection(name);
}

