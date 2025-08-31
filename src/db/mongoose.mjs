import mongoose from "mongoose";

let connected = false;

export function getMongoose() {
  return mongoose;
}

export async function connectMongo() {
  if (connected) return mongoose;
  const uri = process.env.DB_URL || process.env.MONGODB_URI || process.env.DB_URI;
  if (!uri) {
    console.warn("Mongo URI not set (DB_URL / MONGODB_URI / DB_URI). Skipping connect.");
    return mongoose;
  }
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, {
    dbName: process.env.DB_NAME || "Digi",
  });
  connected = true;
  console.log("✅ Mongo connected:", mongoose.connection?.name || "(unknown)");
  return mongoose;
}
