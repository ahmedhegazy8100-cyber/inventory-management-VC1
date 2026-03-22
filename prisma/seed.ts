import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../app/generated/prisma/client";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.product.deleteMany();

  const products = [
    { name: "Wireless Mouse", sku: "WM-001", quantity: 150 },
    { name: "USB-C Hub", sku: "UCH-042", quantity: 75 },
    { name: "Mechanical Keyboard", sku: "MK-107", quantity: 30 },
    { name: '27" 4K Monitor', sku: "MON-270", quantity: 12 },
    { name: "Laptop Stand", sku: "LS-003", quantity: 200 },
  ];

  for (const product of products) {
    await prisma.product.create({ data: product });
  }

  console.log("Seeded 5 products.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
