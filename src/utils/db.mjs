import { connectMongo, getMongoose } from "../db/mongoose.mjs";

export { connectMongo };

export function mongoReady() {
  const mongoose = getMongoose();
  return mongoose.connection?.readyState === 1;
}
