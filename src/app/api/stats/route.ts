import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const LOW_STOCK_THRESHOLD = 5;

// GET /api/stats — dashboard aggregates
export async function GET() {
  try {
    const [totalProducts, agg, salesAgg, lowStockCount] = await Promise.all([
      db.product.count(),
      db.product.aggregate({
        _sum: { amount: true, amountSold: true },
      }),
      db.sale.aggregate({
        _sum: { total: true, quantity: true },
      }),
      db.product.count({ where: { amount: { lte: LOW_STOCK_THRESHOLD } } }),
    ]);

    const products = await db.product.findMany({
      select: { price: true, amount: true },
    });
    const stockValue = products.reduce((sum, p) => sum + p.price * p.amount, 0);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todaySales = await db.sale.aggregate({
      where: { createdAt: { gte: startOfDay } },
      _sum: { total: true },
    });

    return NextResponse.json({
      totalProducts,
      totalStock: agg._sum.amount ?? 0,
      totalSold: agg._sum.amountSold ?? 0,
      stockValue,
      revenue: salesAgg._sum.total ?? 0,
      lowStockCount,
      todayRevenue: todaySales._sum.total ?? 0,
    });
  } catch (error) {
    console.error("GET /api/stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
