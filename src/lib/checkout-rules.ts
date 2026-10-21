// Decant-style purchases (a specific ml amount or "the remainder") below
// this total don't justify the overhead of splitting a bottle — doesn't
// apply to whole-bottle or flat-price (e.g. 3D-print) items.
export const MIN_DECANT_ML = 15;

// Orders at or above this subtotal ship free; below it, delivery is paid
// separately and arranged directly with the buyer (no fixed fee shown).
export const FREE_SHIPPING_THRESHOLD = 8000;
