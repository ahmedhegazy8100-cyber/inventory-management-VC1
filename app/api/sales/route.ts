import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const saleItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
});

const saleSchema = z.object({
  items: z.array(saleItemSchema).min(1, "At least one item is required."),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = saleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { items } = validation.data;

    // Use a transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;

      // 1. Create the Sale record
      const sale = await tx.sale.create({
        data: {
          totalAmount: 0, // Will update after calculating
        },
      });

      const saleItems = [];

      for (const item of items) {
        // 2. Check product exists and has enough stock
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error(`Product ${item.productId} not found.`);
        }

        if (product.quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.quantity}, requested: ${item.quantity}`);
        }

        // 3. Create SaleItem
        const saleItem = await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          },
        });

        saleItems.push(saleItem);
        totalAmount += item.quantity * item.price;

        // 4. Update product quantity
        await tx.product.update({
          where: { id: item.productId },
          data: {
            quantity: { decrement: item.quantity },
          },
        });

        // 5. Audit Log for stock reduction
        await tx.auditLog.create({
          data: {
            action: "SALE",
            entity: "Product",
            entityId: item.productId,
            details: `Sold ${item.quantity} units of "${product.name}" in Sale ${sale.id}`,
          },
        });
      }

      // 6. Update final total amount of the sale
      const updatedSale = await tx.sale.update({
        where: { id: sale.id },
        data: { totalAmount },
        include: { items: true },
      });

      return updatedSale;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  const sales = await prisma.sale.findMany({
    include: {
      items: {
        include: {
          product: {
            select: { name: true, barcode: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(sales);
}
