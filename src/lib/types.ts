export type Product = {
  id: string;
  name: string;
  price: number;
  amount: number;
  amountSold: number;
  createdAt: string;
  updatedAt: string;
};

export type Sale = {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
  createdAt: string;
  product?: { name: string };
};

export const LOW_STOCK_THRESHOLD = 5;
