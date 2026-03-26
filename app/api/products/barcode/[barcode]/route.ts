import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ barcode: string }> }
) {
  const { barcode } = await params;

  if (!barcode) {
    return NextResponse.json({ error: "Barcode is required" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { barcode },
    select: {
      id: true,
      name: true,
      barcode: true,
      sku: true,
      price: true,
      quantity: true,
      unit: true,
      provider: { select: { name: true } },
    },
  });

  if (!product) {
    return NextResponse.json(
      { error: `No product found with barcode "${barcode}"` },
      { status: 404 }
    );
  }

  return NextResponse.json({ product });
}
