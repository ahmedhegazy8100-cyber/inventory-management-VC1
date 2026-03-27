import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        product: { select: { name: true, sku: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  } catch {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, providerId, providerName, expectedDate, quantity, notes } = body;
    
    const errors: Record<string, string> = {};

    if (!productId) errors.productId = "Product ID is required.";
    if (!providerName?.trim()) errors.providerName = "Provider name is required.";
    if (!expectedDate) errors.expectedDate = "Expected date is required.";
    
    const qty = Number(quantity);
    if (isNaN(qty) || !Number.isInteger(qty) || qty <= 0) {
      errors.quantity = "Quantity must be a positive whole number.";
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const order = await prisma.order.create({
      data: {
        productId,
        providerId: providerId || null,
        providerName: providerName.trim(),
        expectedDate: new Date(expectedDate),
        quantity: qty,
        notes: notes?.trim() || null,
        status: "PENDING",
      },
      include: {
        product: { select: { name: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        entity: "Order",
        entityId: order.id,
        details: `Placed order for ${qty} of "${(order as any).product.name}" from ${order.providerName}`,
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
