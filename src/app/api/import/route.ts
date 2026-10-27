import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/** Convert Persian/Arabic digits and separators to Latin digits */
function normalizeDigits(input: string): string {
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  const ar = "٠١٢٣٤٥٦٧٨٩";
  return input
    .replace(/[۰-۹٠-٩]/g, (ch) => {
      const faIdx = fa.indexOf(ch);
      if (faIdx >= 0) return String(faIdx);
      return String(ar.indexOf(ch));
    })
    .replace(/٫/g, ".") // Arabic decimal separator → dot
    .replace(/٬/g, ""); // Arabic thousands separator → removed
}

/** Parse a number that may contain thousand separators, decimals, Persian digits */
function parseNumber(raw: string): number | null {
  if (raw == null) return null;
  const cleaned = normalizeDigits(String(raw)).replace(/[,،\s]/g, "").trim();
  if (cleaned === "" || !/^-?\d*\.?\d+$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Minimal CSV line splitter supporting quoted fields */
function splitCsvLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

function detectDelimiter(text: string): string {
  const sample = text.slice(0, 2000);
  const counts: Record<string, number> = {
    ",": (sample.match(/,/g) || []).length,
    ";": (sample.match(/;/g) || []).length,
    "\t": (sample.match(/\t/g) || []).length,
  };
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] || ",";
}

type Row = { name: string; price: number; amount: number; amountSold: number };

/** Parse CSV text into rows, auto-detecting header and column mapping */
export function parseInventoryCsv(text: string): { rows: Row[]; errors: number } {
  const clean = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").trim();
  if (!clean) return { rows: [], errors: 0 };

  const delimiter = detectDelimiter(clean);
  const lines = clean.split("\n").filter((l) => l.trim() !== "");
  if (lines.length === 0) return { rows: [], errors: 0 };

  const first = splitCsvLine(lines[0], delimiter).map((c) => normalizeDigits(c).toLowerCase().trim());
  const headerLike =
    first.some((c) => /^(name|product|title|item|نام|کالا|محصول)$/.test(c)) ||
    first.some((c) => /name|نام/.test(c));

  // Column indexes
  let nameIdx = -1, priceIdx = -1, amountIdx = -1, soldIdx = -1;

  if (headerLike) {
    first.forEach((col, i) => {
      // Order matters: "amount sold" must match sold before the amount pattern
      if (/name|product|title|item|نام|کالا|محصول/.test(col)) nameIdx = i;
      else if (/price|قیمت|بها/.test(col)) priceIdx = i;
      else if (/amount\s*sold|sold|فروش\s*رفته|فروش/.test(col)) soldIdx = i;
      else if (/amount|qty|quantity|stock|count|موجودی|تعداد/.test(col)) amountIdx = i;
      else if (/^#?$|^id$|^index$|ردیف|شماره/.test(col)) {
        /* index column — ignore */
      }
    });
  }

  // Fallback: positional mapping [#, name, price, amount, amount sold]
  if (nameIdx === -1) {
    if (!headerLike && first.length >= 4) {
      // No header: assume #,name,price,amount,amount sold — skip col 0
      nameIdx = 1; priceIdx = 2; amountIdx = 3; soldIdx = 4;
      if (first.length === 4) { nameIdx = 0; priceIdx = 1; amountIdx = 2; soldIdx = 3; }
    } else {
      nameIdx = 0; priceIdx = 1; amountIdx = 2; soldIdx = 3;
    }
  }

  const rows: Row[] = [];
  let errors = 0;
  const dataLines = headerLike ? lines.slice(1) : lines;

  for (const line of dataLines) {
    const cells = splitCsvLine(line, delimiter);
    const name = (cells[nameIdx] ?? "").replace(/^"|"$/g, "").trim();
    const price = parseNumber(cells[priceIdx] ?? "") ?? 0;
    const amount = parseNumber(cells[amountIdx] ?? "") ?? 0;
    const soldRaw = soldIdx >= 0 ? parseNumber(cells[soldIdx] ?? "") : 0;
    const amountSold = soldRaw ?? 0;

    if (!name || price < 0 || amount < 0 || amountSold < 0) {
      errors++;
      continue;
    }
    rows.push({ name, price, amount: Math.round(amount), amountSold: Math.round(amountSold) });
  }

  return { rows, errors };
}

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
