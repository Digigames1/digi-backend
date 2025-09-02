import mongoose, { connectMongo } from "../db/mongoose.mjs";

export { connectMongo };

export function mongoReady() {
  return mongoose.connection?.readyState === 1;
}

