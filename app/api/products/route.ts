import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/schemas";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit")) || 10));
  const skip = (page - 1) * limit;

  const includeDeleted = searchParams.get("includeDeleted") === "true";

  const where = {
    ...(includeDeleted ? {} : { deletedAt: null }),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { sku: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { quantity: "asc" },
      include: { provider: true },
      skip,
      take: limit,
    }),

    prisma.product.count({ where }),
  ]);

  return NextResponse.json({
    data: products,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validation = productSchema.safeParse(body);

  if (!validation.success) {
    const errors: Record<string, string> = {};
    validation.error.issues.forEach((issue) => {
      errors[String(issue.path[0])] = issue.message;
    });
    return NextResponse.json({ errors }, { status: 400 });
  }

  const { name, sku, quantity, barcode, price, purchasePrice, expiryDate, batchNumber, targetQuantity, unit, providerId } = validation.data;


  const product = await prisma.product.create({
    data: {
      name,
      sku: sku || null,
      barcode: barcode || null,
      quantity,
      price: price || 0,
      purchasePrice: purchasePrice || 0,
      expiryDate: expiryDate || null,
      batchNumber: batchNumber || null,
      targetQuantity,
      unit: unit || "Piece",
      providerId: providerId || null,
    },

  });

  await prisma.auditLog.create({
    data: {
      action: "CREATE",
      entity: "Product",
      entityId: product.id,
      details: `Added "${product.name}"${product.barcode ? ` (Barcode: ${product.barcode})` : ""} with quantity ${product.quantity} ${product.unit}(s) and price ${product.price}`,

    },
  });


  return NextResponse.json(product, { status: 201 });
}
