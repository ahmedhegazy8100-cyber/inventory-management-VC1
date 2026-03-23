import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productUpdateSchema } from "@/lib/schemas";

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

  const { name, sku, quantity } = validation.data;

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
    if (quantity !== undefined) data.quantity = Number(quantity);

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

    return NextResponse.json(product);
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
