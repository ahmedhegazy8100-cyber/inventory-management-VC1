import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest) {
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    select: {
      quantity: true,
      price: true,
      purchasePrice: true,
    },
  });

  const totalValue = products.reduce((acc, p) => acc + (p.quantity * (p.purchasePrice || 0)), 0);
  const totalPotentialRevenue = products.reduce((acc, p) => acc + (p.quantity * (p.price || 0)), 0);
  const expectedProfit = totalPotentialRevenue - totalValue;

  return NextResponse.json({
    totalValue,
    totalPotentialRevenue,
    expectedProfit,
  });
}
