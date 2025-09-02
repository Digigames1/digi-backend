import mongoose from "mongoose";

export function getMongoose() {
  return mongoose;
}

export async function connectMongo() {
  const uri = process.env.DB_URL;
  if (!uri) {
    console.error("\u274c Mongo URI missing (DB_URL not set)");
    return;
  }

  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(uri);
    console.log(`\u2705 Mongo connected: ${mongoose.connection.name}`);
  } catch (err) {
    console.error("\u274c Mongo connect failed:", err.message || err);
    throw err;
  }
}

export { mongoose };

