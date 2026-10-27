import type { Product, Sale } from "@/lib/types";
import { parseInventoryCsv, buildInventoryCsv } from "@/lib/csv";

/**
 * Offline data layer used when the app runs inside the Android APK (Capacitor).
 * The server API keeps Prisma/SQLite for the web build; this adapter mirrors the
 * exact same contract against localStorage so the app works with no backend.
 */

const STORAGE_KEY = "tobbaco:db:v1";
const LOW_STOCK_THRESHOLD = 5;

type LocalDb = {
  products: Product[];
  sales: Omit<Sale, "product">[];
};

function makeId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `x_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function emptyDb(): LocalDb {
  return { products: [], sales: [] };
}

function loadDb(): LocalDb {
  if (typeof window === "undefined") return emptyDb();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyDb();
    const parsed = JSON.parse(raw) as Partial<LocalDb>;
    return {
      products: Array.isArray(parsed.products) ? parsed.products : [],
      sales: Array.isArray(parsed.sales) ? parsed.sales : [],
    };
  } catch {
    return emptyDb();
  }
}

function saveDb(db: LocalDb): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (error) {
    console.error("local-db save failed:", error);
    throw new Error("Storage full or unavailable");
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Search / create products — mirrors GET+POST /api/products */
function listProducts(db: LocalDb, q: string): Product[] {
  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? db.products.filter((p) => p.name.toLowerCase().includes(needle))
    : db.products;
  return [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function createProduct(db: LocalDb, body: Record<string, unknown>): Product | Response {
  const name = String(body?.name ?? "").trim();
  const price = Number(body?.price);
  const amount = Number(body?.amount ?? 0);
  const amountSold = Number(body?.amountSold ?? 0);

  if (!name) return json({ error: "Name is required" }, 400);
  if (!Number.isFinite(price) || price < 0) return json({ error: "Invalid price" }, 400);
  if (!Number.isInteger(amount) || amount < 0) return json({ error: "Invalid amount" }, 400);

  const now = new Date().toISOString();
  const product: Product = {
    id: makeId(),
    name,
    price,
    amount,
    amountSold: Number.isInteger(amountSold) && amountSold >= 0 ? amountSold : 0,
    createdAt: now,
    updatedAt: now,
  };
  db.products.push(product);
  return product;
}

function updateProduct(db: LocalDb, id: string, body: Record<string, unknown>): Product | Response {
  const existing = db.products.find((p) => p.id === id);
  if (!existing) return json({ error: "Product not found" }, 404);

  if (body?.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return json({ error: "Name is required" }, 400);
    existing.name = name;
  }
  if (body?.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) return json({ error: "Invalid price" }, 400);
    existing.price = price;
  }
  if (body?.addAmount !== undefined) {
    const addAmount = Number(body.addAmount);
    if (!Number.isInteger(addAmount) || addAmount < 0) {
      return json({ error: "Invalid restock quantity" }, 400);
    }
    existing.amount += addAmount;
  } else if (body?.amount !== undefined) {
    const amount = Number(body.amount);
    if (!Number.isInteger(amount) || amount < 0) return json({ error: "Invalid amount" }, 400);
    existing.amount = amount;
  }
  existing.updatedAt = new Date().toISOString();
  return existing;
}

function recordSale(db: LocalDb, body: Record<string, unknown>): unknown | Response {
  const productId = String(body?.productId ?? "");
  const quantity = Number(body?.quantity);

  if (!productId) return json({ error: "productId is required" }, 400);
  if (!Number.isInteger(quantity) || quantity <= 0) return json({ error: "Invalid quantity" }, 400);

  const product = db.products.find((p) => p.id === productId);
  if (!product) return json({ error: "Product not found" }, 404);
  if (product.amount < quantity) {
    return json({ error: "Insufficient stock", available: product.amount }, 400);
  }

  product.amount -= quantity;
  product.amountSold += quantity;
  product.updatedAt = new Date().toISOString();

  const sale: Omit<Sale, "product"> = {
    id: makeId(),
    productId,
    quantity,
    unitPrice: product.price,
    total: product.price * quantity,
    createdAt: new Date().toISOString(),
  };
  db.sales.push(sale);

  return { product, sale: { ...sale, product: { name: product.name } } };
}

function computeStats(db: LocalDb) {
  const totalProducts = db.products.length;
  const totalStock = db.products.reduce((sum, p) => sum + p.amount, 0);
  const totalSold = db.products.reduce((sum, p) => sum + p.amountSold, 0);
  const stockValue = db.products.reduce((sum, p) => sum + p.price * p.amount, 0);
  const revenue = db.sales.reduce((sum, s) => sum + s.total, 0);
  const lowStockCount = db.products.filter((p) => p.amount <= LOW_STOCK_THRESHOLD).length;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const todayRevenue = db.sales
    .filter((s) => new Date(s.createdAt).getTime() >= startOfDay.getTime())
    .reduce((sum, s) => sum + s.total, 0);

  return {
    totalProducts,
    totalStock,
    totalSold,
    stockValue,
    revenue,
    lowStockCount,
    todayRevenue,
  };
}

function importCsv(db: LocalDb, csv: string, replace: boolean) {
  const { rows, errors } = parseInventoryCsv(csv);
  if (rows.length === 0) return json({ error: "No valid rows found in CSV", errors }, 400);

  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const existing = db.products.find((p) => p.name === row.name);
    if (existing) {
      if (replace) {
        existing.price = row.price;
        existing.amount = row.amount;
        existing.amountSold = row.amountSold;
      } else {
        existing.amount += row.amount;
        existing.amountSold += row.amountSold;
      }
      existing.updatedAt = new Date().toISOString();
      updated++;
    } else {
      const now = new Date().toISOString();
      db.products.push({
        id: makeId(),
        name: row.name,
        price: row.price,
        amount: row.amount,
        amountSold: row.amountSold,
        createdAt: now,
        updatedAt: now,
      });
      created++;
    }
  }

  return json({ created, updated, errors });
}

/**
 * Route a same-origin API request to the local database.
 * Mirrors src/app/api/** exactly so components need no branching.
 */
export async function handleLocalRequest(input: string, init?: RequestInit): Promise<Response> {
  const url = new URL(input, "http://local.invalid");
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const method = (init?.method ?? "GET").toUpperCase();

  let body: Record<string, unknown> = {};
  if (init?.body && typeof init.body === "string") {
    try {
      body = JSON.parse(init.body) as Record<string, unknown>;
    } catch {
      body = {};
    }
  }

  const db = loadDb();

  // GET /api/products
  if (method === "GET" && path === "/api/products") {
    const q = url.searchParams.get("q") ?? "";
    return json(listProducts(db, q));
  }

  // POST /api/products
  if (method === "POST" && path === "/api/products") {
    const result = createProduct(db, body);
    if (result instanceof Response) return result;
    saveDb(db);
    return json(result, 201);
  }

  // /api/products/[id]
  const productMatch = path.match(/^\/api\/products\/([^/]+)$/);
  if (productMatch) {
    const id = decodeURIComponent(productMatch[1]);
    if (method === "PATCH") {
      const result = updateProduct(db, id, body);
      if (result instanceof Response) return result;
      saveDb(db);
      return json(result);
    }
    if (method === "DELETE") {
      const idx = db.products.findIndex((p) => p.id === id);
      if (idx === -1) return json({ error: "Product not found" }, 404);
      db.products.splice(idx, 1);
      db.sales = db.sales.filter((s) => s.productId !== id);
      saveDb(db);
      return json({ ok: true });
    }
  }

  // GET /api/sales
  if (method === "GET" && path === "/api/sales") {
    const limitParam = Number(url.searchParams.get("limit") ?? 50);
    const limit = Number.isInteger(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 50;
    const sales = [...db.sales]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
      .map((s) => ({
        ...s,
        product: { name: db.products.find((p) => p.id === s.productId)?.name ?? "(deleted)" },
      }));
    return json(sales);
  }

  // POST /api/sales
  if (method === "POST" && path === "/api/sales") {
    const result = recordSale(db, body);
    if (result instanceof Response) return result;
    saveDb(db);
    return json(result, 201);
  }

  // GET /api/stats
  if (method === "GET" && path === "/api/stats") {
    return json(computeStats(db));
  }

  // POST /api/import
  if (method === "POST" && path === "/api/import") {
    const response = importCsv(db, String(body?.csv ?? ""), Boolean(body?.replace ?? true));
    if (response.ok) saveDb(db);
    return response;
  }

  // GET /api/export
  if (method === "GET" && path === "/api/export") {
    const csv = buildInventoryCsv([...db.products].sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="inventory-${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return json({ error: `No offline handler for ${method} ${path}` }, 404);
}

/** CSV text of the whole inventory, for sharing from the native app */
export function getInventoryCsv(): string {
  const db = loadDb();
  return buildInventoryCsv(
    [...db.products].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  );
}
