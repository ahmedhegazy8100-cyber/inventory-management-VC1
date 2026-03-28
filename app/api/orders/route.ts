import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { orderCreateSchema } from "@/lib/schemas";
import { calculateUnitCost } from "@/lib/normalization";

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
    const validation = orderCreateSchema.safeParse(body);

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        errors[String(issue.path[0])] = issue.message;
      });
      return NextResponse.json({ errors }, { status: 400 });
    }

    const { 
      productId, 
      providerId, 
      providerName, 
      expectedDate, 
      expiryDate,
      unitQuantity, 
      unitType, 
      piecesPerUnit,
      totalCost,
      notes 
    } = validation.data;
    
    // Normalization Logic: Calculate Unit Cost
    const unitCost = calculateUnitCost(totalCost, unitQuantity, piecesPerUnit);
    const totalQty = Math.round(unitQuantity * piecesPerUnit);

    // Get current product state for Audit Log
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { name: true, purchasePrice: true }
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Transaction: Create Order and Update Product Purchase Price
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          productId,
          providerId: providerId || null,
          providerName,
          expectedDate,
          expiryDate: expiryDate || null,
          quantity: totalQty,
          unitType,
          unitQuantity,
          piecesPerUnit,
          totalCost,
          notes,
          status: "PENDING",
        } as any,
        include: {
          product: { select: { name: true } },
        },
      });

      // Update the product's latest purchase price (normalized unit cost)
      await tx.product.update({
        where: { id: productId },
        data: { purchasePrice: unitCost }
      });

      return newOrder;
    });

    // Audit Log: Track cost fluctuation
    await prisma.auditLog.create({
      data: {
        action: "UPDATE_PRICE",
        entity: "Product",
        entityId: productId,
        details: `Procurement cost for "${product.name}" updated from $${product.purchasePrice.toFixed(2)} to $${unitCost.toFixed(2)} based on order of ${unitQuantity} ${unitType}.`,
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
