import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/products/[id] — edit product fields or restock (addAmount)
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const data: { name?: string; price?: number; amount?: number } = {};

    if (body?.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
      data.name = name;
    }
    if (body?.price !== undefined) {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json({ error: "Invalid price" }, { status: 400 });
      }
      data.price = price;
    }
    if (body?.addAmount !== undefined) {
      const addAmount = Number(body.addAmount);
      if (!Number.isInteger(addAmount) || addAmount < 0) {
        return NextResponse.json({ error: "Invalid restock quantity" }, { status: 400 });
      }
      data.amount = existing.amount + addAmount;
    } else if (body?.amount !== undefined) {
      const amount = Number(body.amount);
      if (!Number.isInteger(amount) || amount < 0) {
        return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
      }
      data.amount = amount;
    }

    const product = await db.product.update({ where: { id }, data });
    return NextResponse.json(product);
  } catch (error) {
    console.error("PATCH /api/products/[id] error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

// DELETE /api/products/[id] — remove product and its sales history
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    await db.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/products/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
