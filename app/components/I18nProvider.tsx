"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "ar";

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
  t: (key: string) => string;
}

const translations = {
  en: {
    inventory: "Inventory",
    orders: "Orders",
    auditLogs: "Audit Logs",
    providers: "Providers",
    addProduct: "Add Product",
    name: "Name",
    sku: "SKU",
    quantity: "Quantity",
    actions: "Actions",
    search: "Search by name or SKU...",
    welcome: "Welcome back",
    welcomeBack: "Welcome back",
    dashboard: "Dashboard Overview",
    totalItems: "Total Items",
    healthyStock: "Healthy Stock",
    needsRestock: "Needs Restock",
    allGood: "Inventory Stable",
    logout: "Logout",
    edit: "Edit",
    delete: "Delete",
    save: "Save Changes",
    cancel: "Cancel",
    lowStock: "Low Stock Suggestions",
    activeOrders: "Active Orders",
    placeOrder: "Place Order",
    provider: "Provider Name",
    expectedDate: "Expected Date",
    notes: "Notes",
    submitOrder: "Submit Order",
    ignoring: "Ignore",
    targetStock: "Target Stock (10% Threshold)",
    thresholdInfo: "System will auto-order when quantity falls below 10% of this value.",
    category: "Category",
    contactPerson: "Contact Person",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    addProvider: "Add Provider",
    phoneNumber: "Phone Number",
    logistics: "Logistics",
    rawMaterials: "Raw Materials",
    tech: "Tech",
    foodBeverage: "Food & Beverage",
    furniture: "Furniture",
    other: "Other",
    unit: "Unit",
    invValue: "Inv. Value",
    expProfit: "Exp. Profit",
    freshPerishables: "Fresh & Perishables",
    groceryDry: "Grocery & Pantry (Dry Goods)",
    beveragesSnacks: "Beverages & Snacks",
    frozenFoods: "Frozen Foods",
    householdPersonal: "Household & Personal Care",
  },

  ar: {
    inventory: "المخزون",
    orders: "الطلبات",
    auditLogs: "سجلات المراجعة",
    providers: "الموردين",
    addProduct: "إضافة منتج",
    name: "الاسم",
    sku: "رمز التخزين (SKU)",
    quantity: "الكمية",
    actions: "الإجراءات",
    search: "بحث بالاسم أو الرمز...",
    welcome: "مرحباً بك",
    welcomeBack: "مرحباً بعودتك",
    dashboard: "لوحة التحكم",
    totalItems: "إجمالي العناصر",
    healthyStock: "المخزون السليم",
    needsRestock: "تحتاج إلى إعادة طلب",
    allGood: "المخزون مستقر",
    logout: "تسجيل الخروج",
    edit: "تعديل",
    delete: "حذف",
    save: "حفظ التغييرات",
    cancel: "إلغاء",
    lowStock: "اقتراحات المخزون المنخفض",
    activeOrders: "الطلبات النشطة",
    placeOrder: "تقديم طلب",
    provider: "اسم المورد",
    expectedDate: "التاريخ المتوقع",
    notes: "ملاحظات",
    submitOrder: "إرسال الطلب",
    ignoring: "تجاهل",
    targetStock: "المخزون المستهدف (حد 10%)",
    thresholdInfo: "سيقوم النظام بطلب تلقائي عندما تنخفض الكمية عن 10% من هذه القيمة.",
    category: "الفئة",
    contactPerson: "الشخص المسؤول",
    status: "الحالة",
    active: "نشط",
    inactive: "غير نشط",
    addProvider: "إضافة مورد",
    phoneNumber: "رقم الهاتف",
    logistics: "الخدمات اللوجستية",
    rawMaterials: "المواد الخام",
    tech: "التقنية",
    foodBeverage: "الأغذية والمشروبات",
    furniture: "الأثاث",
    other: "أخرى",
    unit: "الوحدة",
    invValue: "قيمة المخزون",
    expProfit: "الربح المتوقع",
    freshPerishables: "الطازجة والمواد القابلة للتلف",
    groceryDry: "البقالة والمواد الجافة",
    beveragesSnacks: "المشروبات والوجبات الخفيفة",
    frozenFoods: "الأطعمة المجمدة",
    householdPersonal: "العناية المنزلية والشخصية",
  },

};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("preferred-language") as Language;
    if (saved && (saved === "en" || saved === "ar")) {
      setLanguage(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("preferred-language", language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  const isRTL = language === "ar";

  const t = (key: string) => {
    return translations[language][key as keyof typeof translations["en"]] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, isRTL, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
