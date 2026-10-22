import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../config/database.js";
import { User } from "../models/index.js";

async function main() {
  const { OWNER_USERNAME, OWNER_EMAIL, OWNER_PASSWORD, OWNER_SECURE_CODE } = process.env;
  if (!OWNER_USERNAME || !OWNER_EMAIL || !OWNER_PASSWORD || !OWNER_SECURE_CODE) {
    throw new Error("Set OWNER_USERNAME, OWNER_EMAIL, OWNER_PASSWORD, OWNER_SECURE_CODE first");
  }

  await connectDB();

  if (await User.exists({ role: "owner" })) {
    console.log("An owner already exists. Nothing to do.");
    return;
  }

  await User.create({
    username: OWNER_USERNAME,
    email: OWNER_EMAIL,
    passwordHash: await bcrypt.hash(OWNER_PASSWORD, 12),
    secureCodeHash: await bcrypt.hash(OWNER_SECURE_CODE, 12),
    role: "owner",
  });
  console.log("Owner created.");
}

main()
  .catch((e) => console.error("Failed:", (e as Error).message))
  .finally(() => mongoose.disconnect());