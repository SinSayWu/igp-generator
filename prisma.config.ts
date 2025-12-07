import { config } from "dotenv";
config();

console.log("DEBUG DB URL =", process.env.DATABASE_URL);

import { defineConfig } from "@prisma/config";

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
