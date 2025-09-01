import mongoose from "mongoose";

let connected = false;

/** Єдиний екземпляр mongoose для всього застосунку */
export function getMongoose() {
  return mongoose;
}

/** Підключення до Mongo (викликається один раз на старті) */
export async function connectMongo() {
  const uri =
    process.env.DB_URL ||
    process.env.MONGODB_URI ||
    process.env.DB_URI;

  const dbName = process.env.DB_NAME || "digi";

  if (!uri) {
    console.error("❌ Mongo URI missing (DB_URL / MONGODB_URI / DB_URI not set)");
    return mongoose;
  }

  if (connected) return mongoose;

  try {
    mongoose.set?.("strictQuery", true);
  } catch {}

  await mongoose.connect(uri, { dbName });
  connected = true;

  const name =
    mongoose.connection?.name ||
    mongoose.connection?.db?.databaseName ||
    dbName;

  console.log("✅ Mongo connected:", name);
  return mongoose;
}

export default mongoose;
