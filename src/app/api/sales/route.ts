import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/sales — recent sales with product names (?limit=50)
export async function GET(req: NextRequest) {
  try {
    const limitParam = Number(req.nextUrl.searchParams.get("limit") ?? 50);
    const limit = Number.isInteger(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 50;
    const sales = await db.sale.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { product: { select: { name: true } } },
    });
    return NextResponse.json(sales);
  } catch (error) {
    console.error("GET /api/sales error:", error);
    return NextResponse.json({ error: "Failed to fetch sales" }, { status: 500 });
  }
}

// POST /api/sales — record a sale: { productId, quantity }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const productId = String(body?.productId ?? "");
    const quantity = Number(body?.quantity);

    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }

    const result = await db.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw new Error("PRODUCT_NOT_FOUND");
      if (product.amount < quantity) throw new Error(`INSUFFICIENT_STOCK:${product.amount}`);

      const updated = await tx.product.update({
        where: { id: productId },
        data: {
          amount: { decrement: quantity },
          amountSold: { increment: quantity },
        },
      });

      const sale = await tx.sale.create({
        data: {
          productId,
          quantity,
          unitPrice: product.price,
          total: product.price * quantity,
        },
        include: { product: { select: { name: true } } },
      });

      return { product: updated, sale };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "PRODUCT_NOT_FOUND") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    if (message.startsWith("INSUFFICIENT_STOCK:")) {
      const available = Number(message.split(":")[1]);
      return NextResponse.json({ error: "Insufficient stock", available }, { status: 400 });
    }
    console.error("POST /api/sales error:", error);
    return NextResponse.json({ error: "Failed to record sale" }, { status: 500 });
  }
}
