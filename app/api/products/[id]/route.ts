import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productUpdateSchema } from "@/lib/schemas";
import { getProfitStats } from "@/lib/normalization";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { provider: true },
    });

    if (!product || product.deletedAt) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const stats = getProfitStats(product.price, product.purchasePrice);
    return NextResponse.json({
      ...product,
      grossProfit: stats.grossProfit,
      profitMargin: stats.marginPercentage,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  
  const validation = productUpdateSchema.safeParse(body);

  if (!validation.success) {
    const errors: Record<string, string> = {};
    validation.error.issues.forEach((issue) => {
      errors[String(issue.path[0])] = issue.message;
    });
    return NextResponse.json({ errors }, { status: 400 });
  }

  const { name, sku, quantity, barcode, unitBarcode, price, purchasePrice, expiryDate, batchNumber, targetQuantity, unit, providerId } = validation.data;



  try {
    // Fetch current product for change comparison
    const existing = await prisma.product.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      return NextResponse.json(
        { errors: { id: "Product not found." } },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name.trim();
    if (sku !== undefined) data.sku = sku?.trim() || null;
    if (barcode !== undefined) data.barcode = barcode?.trim() || null;
    if (unitBarcode !== undefined) data.unitBarcode = unitBarcode?.trim() || null;
    if (quantity !== undefined) data.quantity = Number(quantity);
    if (price !== undefined) data.price = Number(price);
    if (purchasePrice !== undefined) data.purchasePrice = Number(purchasePrice);
    if (expiryDate !== undefined) data.expiryDate = expiryDate || null;
    if (batchNumber !== undefined) data.batchNumber = batchNumber?.trim() || null;
    if (targetQuantity !== undefined) data.targetQuantity = Number(targetQuantity);
    if (unit !== undefined) data.unit = unit.trim();
    if (providerId !== undefined) data.providerId = providerId || null;



    const product = await prisma.product.update({
      where: { id },
      data,
    });

    // Build change details
    const changes: string[] = [];
    if (name !== undefined && existing.name !== product.name) {
      changes.push(`name "${existing.name}" → "${product.name}"`);
    }
    if (sku !== undefined && existing.sku !== product.sku) {
      changes.push(`SKU "${existing.sku || "—"}" → "${product.sku || "—"}"`);
    }
    if (quantity !== undefined && existing.quantity !== product.quantity) {
      changes.push(`quantity ${existing.quantity} → ${product.quantity}`);
    }
    if (barcode !== undefined && existing.barcode !== product.barcode) {
      changes.push(`barcode "${existing.barcode || "—"}" → "${product.barcode || "—"}"`);
    }
    if (unitBarcode !== undefined && existing.unitBarcode !== product.unitBarcode) {
      changes.push(`unitBarcode "${existing.unitBarcode || "—"}" → "${product.unitBarcode || "—"}"`);
    }
    if (price !== undefined && existing.price !== product.price) {
      changes.push(`price ${existing.price} → ${product.price}`);
    }
    if (expiryDate !== undefined && existing.expiryDate?.toString() !== product.expiryDate?.toString()) {
      changes.push(`expiryDate "${existing.expiryDate || "—"}" → "${product.expiryDate || "—"}"`);
    }
    if (unit !== undefined && existing.unit !== product.unit) {
      changes.push(`unit "${existing.unit}" → "${product.unit}"`);
    }
    if (providerId !== undefined && existing.providerId !== product.providerId) {
      changes.push(`providerId "${existing.providerId || "—"}" → "${product.providerId || "—"}"`);
    }



    await prisma.auditLog.create({
      data: {
        action: "UPDATE",
        entity: "Product",
        entityId: product.id,
        details: changes.length > 0
          ? `Updated "${existing.name}": ${changes.join(", ")}`
          : `Updated "${existing.name}" (no field changes)`,
      },
    });

    // 10% Threshold Auto-Order Logic
    if (product.quantity < 0.1 * product.targetQuantity && !product.ignoreRestock) {
      // Check if a PENDING order already exists to avoid duplicates
      const existingPendingOrder = await prisma.order.findFirst({
        where: {
          productId: product.id,
          status: "PENDING",
          deletedAt: null
        }
      });

      if (!existingPendingOrder) {
        await prisma.order.create({
          data: {
            productId: product.id,
            providerName: "SYSTEM-AUTO",
            expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            quantity: Math.max(1, product.targetQuantity - product.quantity),
            notes: `Auto-generated: Stock fell below 10% threshold (${product.quantity} / ${product.targetQuantity})`,
            status: "PENDING"
          }
        });

        await prisma.auditLog.create({
          data: {
            action: "AUTO_ORDER",
            entity: "Order",
            entityId: product.id,
            details: `Automated order created for "${product.name}" due to low stock threshold.`,
          },
        });
      }
    }

    const stats = getProfitStats(product.price, product.purchasePrice);
    return NextResponse.json({
      ...product,
      grossProfit: stats.grossProfit,
      profitMargin: stats.marginPercentage,
    });
  } catch {
    return NextResponse.json(
      { errors: { id: "Product not found." } },
      { status: 404 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Fetch product before deleting to capture its name
    const existing = await prisma.product.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      return NextResponse.json(
        { errors: { id: "Product not found." } },
        { status: 404 }
      );
    }

    await prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });

    await prisma.auditLog.create({
      data: {
        action: "DELETE",
        entity: "Product",
        entityId: id,
        details: `Deleted "${existing.name}"${existing.sku ? ` (SKU: ${existing.sku})` : ""}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { errors: { id: "Product not found." } },
      { status: 404 }
    );
  }
}
