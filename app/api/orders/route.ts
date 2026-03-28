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
    const { 
      productId, 
      providerId, 
      providerName, 
      expectedDate, 
      expiryDate,
      unitQuantity, 
      unitType, 
      piecesPerUnit,
      notes 
    } = body;
    
    const errors: Record<string, string> = {};

    if (!productId) errors.productId = "Product ID is required.";
    if (!providerName?.trim()) errors.providerName = "Provider name is required.";
    if (!expectedDate) errors.expectedDate = "Expected date is required.";
    
    // Calculate total quantity (pieces)
    const unitQty = Number(unitQuantity || 0);
    const pPerUnit = Number(piecesPerUnit || 1);
    const totalQty = Math.round(unitQty * pPerUnit);

    if (totalQty <= 0) {
      errors.quantity = "Total quantity must be a positive number.";
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
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        quantity: totalQty,
        unitType: unitType || "Piece",
        unitQuantity: unitQty,
        piecesPerUnit: pPerUnit,
        notes: notes?.trim() || null,
        status: "PENDING",
      } as any,
      include: {
        product: { select: { name: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        entity: "Order",
        entityId: order.id,
        details: `Placed order for ${unitQty} ${unitType || 'units'} (${totalQty} total pieces) of "${(order as any).product.name}" from ${order.providerName}`,
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
