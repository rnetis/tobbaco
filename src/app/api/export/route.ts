import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildInventoryCsv } from "@/lib/csv";

// GET /api/export — download inventory as CSV (#,name,price,amount,amount sold)
export async function GET() {
  try {
    const products = await db.product.findMany({
      orderBy: { createdAt: "asc" },
    });

    // BOM so Excel opens UTF-8 (incl. Persian names) correctly
    const csv = buildInventoryCsv(products);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="inventory-${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/export error:", error);
    return NextResponse.json({ error: "Failed to export CSV" }, { status: 500 });
  }
}
