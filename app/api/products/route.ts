import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";

  const products = await prisma.product.findMany({
    where: {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { sku: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: { quantity: "asc" },
  });

  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, sku, quantity } = body;

  const errors: Record<string, string> = {};

  if (!name || typeof name !== "string" || name.trim() === "") {
    errors.name = "Product name is required.";
  }

  const qty = Number(quantity);
  if (isNaN(qty) || !Number.isInteger(qty)) {
    errors.quantity = "Quantity must be a whole number.";
  } else if (qty < 0) {
    errors.quantity = "Quantity cannot be negative.";
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      name: name.trim(),
      sku: sku?.trim() || null,
      quantity: qty,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "CREATE",
      entity: "Product",
      entityId: product.id,
      details: `Added "${product.name}"${product.sku ? ` (SKU: ${product.sku})` : ""} with quantity ${product.quantity}`,
    },
  });

  return NextResponse.json(product, { status: 201 });
}
