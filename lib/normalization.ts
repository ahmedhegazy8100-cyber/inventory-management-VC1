/**
 * Normalization Engine for Unit Profitability
 */

/**
 * Calculates the cost of a single base item (piece/1KG) from a bulk order.
 * Formula: Unit Cost = Total Purchase Price / (Bulk Quantity * Pieces per Bulk)
 * Or: Unit Cost = Total Purchase Price / Total Weight (KG)
 */
export function calculateUnitCost(
  totalPurchasePrice: number,
  bulkQuantity: number,
  piecesPerBulk: number = 1
): number {
  const totalBaseUnits = bulkQuantity * piecesPerBulk;
  if (totalBaseUnits <= 0) return 0;
  return totalPurchasePrice / totalBaseUnits;
}

/**
 * Calculates profitability metrics for a base unit.
 */
export function getProfitStats(sellingPrice: number, unitCost: number) {
  const grossProfit = sellingPrice - unitCost;
  const marginPercentage = sellingPrice > 0 
    ? (grossProfit / sellingPrice) * 100 
    : 0;

  return {
    grossProfit,
    marginPercentage: Number(marginPercentage.toFixed(2)),
  };
}

/**
 * Normalizes different unit types into a common display label if needed.
 */
export function normalizeUnitLabel(unitType: string): string {
  const mapping: Record<string, string> = {
    "Carton": "pcs",
    "Shrenk": "pcs",
    "KG": "kg",
    "Box": "pcs",
    "Bag": "kg",
    "Dozen": "pcs",
  };
  return mapping[unitType] || "units";
}
