// src/db/mongoose.mjs
import mongoose from "mongoose";

let connectPromise = null;

export async function connectMongo(uri, dbName) {
  if (!uri) throw new Error("MONGODB_URI not set");
  if (!connectPromise) {
    mongoose.set?.("strictQuery", true);
    connectPromise = mongoose
      .connect(uri, {
        dbName: dbName || process.env.MONGODB_DB_NAME || undefined,
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
 * Повертає native-колекцію. Якщо конекшен ще не відкритий — чекає.
 * Таймаут очікування ~10с.
 */
export async function getNativeCollection(name) {
  // якщо вже готово — повертаємо одразу
  if (mongoose?.connection?.readyState === 1 && mongoose?.connection?.db) {
    return mongoose.connection.db.collection(name);
  }

  // спроба дочекатися відкриття поточного конекшену
  try {
    // якщо є активний connectPromise — дочекаємося
    if (connectPromise) {
      await connectPromise;
    } else if (mongoose?.connection?.asPromise) {
      // для mongoose v7+
      await mongoose.connection.asPromise();
    } else {
      // Фолбек: невеликий цикл очікування
      const started = Date.now();
      while (Date.now() - started < 10000) {
        if (mongoose?.connection?.readyState === 1 && mongoose?.connection?.db) break;
        await new Promise((r) => setTimeout(r, 200));
      }
    }
  } catch (_) {
    // ігноруємо — нижче ще раз перевіримо стан
  }

  if (mongoose?.connection?.readyState === 1 && mongoose?.connection?.db) {
    return mongoose.connection.db.collection(name);
  }

  // повертаємо інформативну помилку (але тепер її не будемо кидати з роутів)
  const state = mongoose?.connection?.readyState ?? null;
  const nameInfo = mongoose?.connection?.name ?? null;
  const msg = `Mongo connection DB is not ready (state=${state}, name=${nameInfo})`;
  const err = new Error(msg);
  err.code = "MONGO_NOT_READY";
  throw err;
}

