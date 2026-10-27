export type Lang = "en" | "fa";

export const translations = {
  en: {
    appName: "Inventory & Sales",
    appSubtitle: "Manage your stock and track every sale",
    // stats
    statProducts: "Products",
    statStockValue: "Stock Value",
    statUnitsSold: "Units Sold",
    statRevenue: "Revenue",
    // product fields
    name: "Product Name",
    price: "Price",
    amount: "Stock",
    amountSold: "Sold",
    // actions
    sell: "Sell",
    restock: "Restock",
    edit: "Edit",
    delete: "Delete",
    addProduct: "Add Product",
    editProduct: "Edit Product",
    save: "Save",
    saveChanges: "Save Changes",
    cancel: "Cancel",
    confirm: "Confirm",
    close: "Close",
    search: "Search products...",
    // filters
    filterAll: "All",
    filterLow: "Low Stock",
    filterOut: "Out of Stock",
    // stock badges
    inStock: "In Stock",
    lowStock: "Low Stock",
    outOfStock: "Out of Stock",
    // dialogs
    quantity: "Quantity",
    saleTotal: "Sale Total",
    availableStock: "Available",
    confirmSale: "Record Sale",
    restockAmount: "Add Quantity",
    newStock: "New Stock",
    deleteConfirmTitle: "Delete product?",
    deleteConfirmDesc: "This will permanently remove this product and its sales history. This action cannot be undone.",
    // menu
    dataMenu: "Data",
    importCsv: "Import CSV",
    exportCsv: "Export CSV",
    salesHistory: "Sales History",
    noSales: "No sales recorded yet",
    // import dialog
    importTitle: "Import products from CSV",
    importDesc: "Paste your CSV content or choose a file. Expected header: #,name,price,amount,amount sold",
    importPaste: "Paste CSV here",
    importFile: "Choose File",
    importBtn: "Import",
    importReplace: "Replace existing products with the same name",
    importResult: "Imported {created} new, updated {updated} existing products",
    // empty states
    emptyTitle: "No products yet",
    emptyDesc: "Add your first product or import a CSV file to get started.",
    emptyFiltered: "No products match your search",
    // toasts
    productAdded: "Product added",
    productUpdated: "Product updated",
    productDeleted: "Product deleted",
    saleRecorded: "Sale recorded",
    restocked: "Stock updated",
    notEnoughStock: "Not enough stock. Available: {available}",
    importFailed: "Import failed. Please check your CSV format.",
    exportDone: "CSV exported",
    offline: "You are offline — showing cached data",
    backOnline: "Back online",
    // pwa
    installApp: "Install App",
    installed: "App installed!",
    // meta
    loading: "Loading...",
    error: "Something went wrong",
    retry: "Retry",
    total: "Total",
    items: "items",
    lowStockWarning: "{count} products are low on stock",
    todaySales: "Today's Sales",
    recentSales: "Recent Sales",
    viewAll: "View All",
    units: "units",
  },
  fa: {
    appName: "انبار و فروش",
    appSubtitle: "مدیریت موجودی و ثبت هر فروش",
    // stats
    statProducts: "کالاها",
    statStockValue: "ارزش موجودی",
    statUnitsSold: "تعداد فروش‌رفته",
    statRevenue: "درآمد",
    // product fields
    name: "نام کالا",
    price: "قیمت",
    amount: "موجودی",
    amountSold: "فروش‌رفته",
    // actions
    sell: "فروش",
    restock: "افزودن موجودی",
    edit: "ویرایش",
    delete: "حذف",
    addProduct: "افزودن کالا",
    editProduct: "ویرایش کالا",
    save: "ذخیره",
    saveChanges: "ذخیره تغییرات",
    cancel: "انصراف",
    confirm: "تایید",
    close: "بستن",
    search: "جستجوی کالا...",
    // filters
    filterAll: "همه",
    filterLow: "موجودی کم",
    filterOut: "ناموجود",
    // stock badges
    inStock: "موجود",
    lowStock: "موجودی کم",
    outOfStock: "ناموجود",
    // dialogs
    quantity: "تعداد",
    saleTotal: "مبلغ کل فروش",
    availableStock: "موجود",
    confirmSale: "ثبت فروش",
    restockAmount: "تعداد افزوده‌شده",
    newStock: "موجودی جدید",
    deleteConfirmTitle: "حذف کالا؟",
    deleteConfirmDesc: "این کالا و تاریخچه فروش آن برای همیشه حذف می‌شود. این عمل قابل بازگشت نیست.",
    // menu
    dataMenu: "داده‌ها",
    importCsv: "ورود از CSV",
    exportCsv: "خروجی CSV",
    salesHistory: "تاریخچه فروش",
    noSales: "هنوز فروشی ثبت نشده است",
    // import dialog
    importTitle: "ورود کالاها از فایل CSV",
    importDesc: "محتوای CSV را بچسبانید یا فایل را انتخاب کنید. سرستون مورد انتظار: #,name,price,amount,amount sold",
    importPaste: "محتوای CSV را اینجا بگذارید",
    importFile: "انتخاب فایل",
    importBtn: "ورود اطلاعات",
    importReplace: "به‌روزرسانی کالاهای هم‌نام موجود",
    importResult: "{created} کالای جدید اضافه و {updated} کالا به‌روزرسانی شد",
    // empty states
    emptyTitle: "هنوز کالایی وجود ندارد",
    emptyDesc: "اولین کالای خود را اضافه کنید یا از فایل CSV وارد کنید.",
    emptyFiltered: "کالایی با این جستجو پیدا نشد",
    // toasts
    productAdded: "کالا اضافه شد",
    productUpdated: "کالا به‌روزرسانی شد",
    productDeleted: "کالا حذف شد",
    saleRecorded: "فروش ثبت شد",
    restocked: "موجودی به‌روزرسانی شد",
    notEnoughStock: "موجودی کافی نیست. موجود: {available}",
    importFailed: "ورود اطلاعات ناموفق بود. فرمت CSV را بررسی کنید.",
    exportDone: "فایل CSV دانلود شد",
    offline: "آفلاین هستید — داده‌های ذخیره‌شده نمایش داده می‌شود",
    backOnline: "اتصال برقرار شد",
    // pwa
    installApp: "نصب برنامه",
    installed: "برنامه نصب شد!",
    // meta
    loading: "در حال بارگذاری...",
    error: "خطایی رخ داد",
    retry: "تلاش دوباره",
    total: "جمع",
    items: "قلم",
    lowStockWarning: "{count} کالا موجودی کمی دارد",
    todaySales: "فروش امروز",
    recentSales: "فروش‌های اخیر",
    viewAll: "مشاهده همه",
    units: "عدد",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export function translate(lang: Lang, key: TranslationKey, params?: Record<string, string | number>): string {
  let text: string = translations[lang][key] ?? translations.en[key] ?? key;
  if (params) {
    for (const [param, value] of Object.entries(params)) {
      text = text.replace(`{${param}}`, String(value));
    }
  }
  return text;
}

export function formatNumber(value: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === "fa" ? "fa-IR" : "en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatMoney(value: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === "fa" ? "fa-IR" : "en-US", {
    maximumFractionDigits: 2,
  }).format(Math.round(value * 100) / 100);
}

export function formatDateTime(date: string | Date, lang: Lang): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(lang === "fa" ? "fa-IR" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
