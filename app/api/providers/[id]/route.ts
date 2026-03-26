import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { providerSchema } from "@/lib/schemas";
import { z } from "zod";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = providerSchema.partial().parse(body);

    const provider = await (prisma as any).provider.update({
      where: { id },
      data: validated,
    });

    return NextResponse.json(provider);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("PATCH Provider Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get("permanent") === "true";

    if (permanent) {
      await (prisma as any).provider.delete({ where: { id } });
    } else {
      await (prisma as any).provider.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Provider Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
