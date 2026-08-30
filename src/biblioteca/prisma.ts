import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/gerado/prisma/client";

const prismaGlobal = globalThis as unknown as { prisma?: PrismaClient };

function criarClientePrisma() {
  const urlBanco = process.env.DATABASE_URL;
  if (!urlBanco) throw new Error("DATABASE_URL não está definida.");

  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: urlBanco }) });
}

export const prisma = prismaGlobal.prisma ?? criarClientePrisma();

if (process.env.NODE_ENV !== "production") prismaGlobal.prisma = prisma;
