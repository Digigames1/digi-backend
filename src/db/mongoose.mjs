// src/db/mongoose.mjs
import mongoose from "mongoose";
export { default as mongoose } from "mongoose";

let connectPromise = null;
let nativeDb = null;
let nativeDbInitPromise = null;

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

function resolveDbName(conn) {
  return (
    conn?.name ||
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
    "test"
  );
}

/**
 * Асинхронно отримуємо native DB. Кешуємо в module scope.
 */
export async function getNativeDbAsync() {
  if (nativeDb) return nativeDb;

  const conn = mongoose.connection;
  if (!conn || conn.readyState !== 1) {
    if (typeof mongoose.connection?.asPromise === "function") {
      await mongoose.connection.asPromise();
    } else if (connectPromise) {
      await connectPromise;
    } else {
      throw new Error(`Mongo connection not connected (state=${conn?.readyState ?? "n/a"})`);
    }
  }

  if (nativeDbInitPromise) return nativeDbInitPromise;

  nativeDbInitPromise = (async () => {
    const c = mongoose.connection;

    if (c.db) {
      nativeDb = c.db;
      nativeDbInitPromise = null;
      return nativeDb;
    }

    const client =
      (typeof c.getClient === "function" ? c.getClient() : null) ||
      c.client ||
      (mongoose.connections?.[0]?.client ?? null);

    const name = resolveDbName(c);

    if (client && typeof client.db === "function") {
      nativeDb = client.db(name);
      c.db = nativeDb;
      nativeDbInitPromise = null;
      return nativeDb;
    }

    const maybeDb = mongoose.connections?.[0]?.db ?? null;
    if (maybeDb) {
      nativeDb = maybeDb;
      c.db = nativeDb;
      nativeDbInitPromise = null;
      return nativeDb;
    }

    nativeDbInitPromise = null;
    throw new Error("Mongo client db handle is not available");
  })();

  return nativeDbInitPromise;
}

export async function getNativeCollection(name) {
  const db = await getNativeDbAsync();
  return db.collection(name);
}

