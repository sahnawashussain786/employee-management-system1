import mongoose from "mongoose";
import env from "./config.js";

mongoose.set("strictQuery", true);

function redact(uri) {
  try {
    return uri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");
  } catch {
    return "(uri)";
  }
}

export async function connectDB(uri = env.mongoUri) {
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Copy .env.example to .env at the repo root and add your MongoDB Atlas connection string.",
    );
  }
  mongoose.connection.on("connected", () =>
    console.log(`[db] connected → ${redact(uri)}`),
  );
  mongoose.connection.on("error", (err) =>
    console.error("[db] connection error:", err.message),
  );

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.disconnect();
}

export default connectDB;
