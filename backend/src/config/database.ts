import mongoose from "mongoose";

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set in the environment");
  }

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB runtime error:", err.name);
  });
  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });

  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected");
  } catch (err) {
    // Log only the error name/message, never the connection string
    const e = err as Error;
    console.error(`MongoDB connection failed: ${e.name}`);
    process.exit(1);
  }
}