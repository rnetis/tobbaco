import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/products — list all products (optionally ?q=search)
export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    const products = await db.product.findMany({
      where: q ? { name: { contains: q } } : undefined,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// POST /api/products — create a product
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body?.name ?? "").trim();
    const price = Number(body?.price);
    const amount = Number(body?.amount ?? 0);
    const amountSold = Number(body?.amountSold ?? 0);

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }
    if (!Number.isInteger(amount) || amount < 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const product = await db.product.create({
      data: {
        name,
        price,
        amount,
        amountSold: Number.isInteger(amountSold) && amountSold >= 0 ? amountSold : 0,
      },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("POST /api/products error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
