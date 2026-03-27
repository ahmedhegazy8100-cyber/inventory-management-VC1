import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { providerSchema } from "@/lib/schemas";
import { z } from "zod"; // Import z from zod for ZodError

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";

    const where: any = {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ],
      deletedAt: null,
    };

    const providers = await (prisma as any).provider.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(providers);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = providerSchema.parse(body);

    const provider = await (prisma as any).provider.create({
      data: validated,
    });

    await (prisma as any).auditLog.create({
      data: {
        action: "CREATE",
        entity: "Provider",
        entityId: provider.id,
        details: `Added provider "${provider.name}" ${validated.phone ? `(Ph: ${validated.phone})` : ""}`,
      },
    });

    return NextResponse.json(provider, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.issues }, { status: 400 });
    }

    // Handle Prisma Unique Constraint Violation
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0] || "field";
      return NextResponse.json(
        { message: `A provider with this ${field} already exists.` },
        { status: 409 }
      );
    }

    console.error("Error creating provider:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
