import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseInventoryCsv } from "@/lib/csv";

// POST /api/import — body: { csv: string, replace: boolean }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const csv = String(body?.csv ?? "");
    const replace = Boolean(body?.replace ?? true);

    const { rows, errors } = parseInventoryCsv(csv);
    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No valid rows found in CSV", errors },
        { status: 400 }
      );
    }

    let created = 0;
    let updated = 0;

    for (const row of rows) {
      const existing = await db.product.findFirst({
        where: { name: { equals: row.name } },
      });

      if (existing) {
        await db.product.update({
          where: { id: existing.id },
          data: replace
            ? { price: row.price, amount: row.amount, amountSold: row.amountSold }
            : {
                price: row.price,
                amount: existing.amount + row.amount,
                amountSold: existing.amountSold + row.amountSold,
              },
        });
        updated++;
      } else {
        await db.product.create({
          data: {
            name: row.name,
            price: row.price,
            amount: row.amount,
            amountSold: row.amountSold,
          },
        });
        created++;
      }
    }

    return NextResponse.json({ created, updated, errors });
  } catch (error) {
    console.error("POST /api/import error:", error);
    return NextResponse.json({ error: "Failed to import CSV" }, { status: 500 });
  }
}
