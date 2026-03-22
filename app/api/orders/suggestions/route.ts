import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // A suggestion is a product with quantity < 50, not ignored, and no PENDING order exists.
    const suggestions = await prisma.product.findMany({
      where: {
        quantity: { lt: 50 },
        ignoreRestock: false,
        orders: {
          none: { status: "PENDING" },
        },
      },
      orderBy: { quantity: "asc" },
    });

    return NextResponse.json(suggestions);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch top restock suggestions" },
      { status: 500 }
    );
  }
}
