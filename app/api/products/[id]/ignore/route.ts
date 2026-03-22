import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const product = await prisma.product.update({
      where: { id },
      data: { ignoreRestock: true },
    });

    await prisma.auditLog.create({
      data: {
        action: "UPDATE",
        entity: "Product",
        entityId: product.id,
        details: `Ignored restock suggestion for "${product.name}"`,
      },
    });

    return NextResponse.json({ success: true, product });
  } catch {
    return NextResponse.json(
      { error: "Failed to ignore restock suggestion" },
      { status: 500 }
    );
  }
}
