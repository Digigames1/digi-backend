import mongoose from "mongoose";

function maskUri(u = "") {
  // ховаємо пароль у логах
  try {
    const url = new URL(u);
    if (url.password) url.password = "***";
    return url.toString();
  } catch {
    return u ? u.slice(0, 20) + "..." : "";
  }
}

const URI =
  process.env.MONGODB_URI ||
  process.env.DB_URL ||
  "";

const DB_NAME = process.env.MONGODB_DB_NAME || ""; // якщо в URI немає /dbname — можна задати тут

export async function connectMongo() {
  if (!URI) {
    console.warn("⚠️  No Mongo URI provided (checked MONGODB_URI and DB_URL). Skipping DB connection.");
    return;
  }

  const opts = {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 10,
    // якщо явно передали MONGODB_DB_NAME — використаємо
    ...(DB_NAME ? { dbName: DB_NAME } : {}),
  };

  console.log("ℹ️  Mongo connecting to:", maskUri(URI), DB_NAME ? `(dbName=${DB_NAME})` : "");

  try {
    const conn = await mongoose.connect(URI, opts);
    // обережно читаємо назву БД — без падінь
    const name =
      conn?.connection?.name ||
      conn?.connection?.db?.databaseName ||
      mongoose?.connection?.name ||
      mongoose?.connection?.db?.databaseName ||
      "(unknown)";
    console.log("✅ Mongo connected:", name);
  } catch (e) {
    console.error("❌ Mongo connect failed:", e?.message || e);
  }
}

export function mongoReady() {
  return mongoose.connection?.readyState === 1;
}

