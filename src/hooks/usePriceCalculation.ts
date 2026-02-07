import { useMemo } from "react";
import { differenceInDays } from "date-fns";
import type { RoomCategory, MealPlanPrice, Package, TaxConfig, PriceBreakdown, MealPlan } from "@/types/booking";

interface UsePriceCalculationProps {
  checkInDate: Date | undefined;
  checkOutDate: Date | undefined;
  numAdults: number;
  numChildren: number;
  roomCategory: RoomCategory | undefined;
  mealPlan: MealPlan;
  mealPlanPrices: MealPlanPrice[];
  selectedPackage: Package | undefined;
  taxConfig: TaxConfig[];
  seasonMultiplier: number;
}

export function usePriceCalculation({
  checkInDate,
  checkOutDate,
  numAdults,
  numChildren,
  roomCategory,
  mealPlan,
  mealPlanPrices,
  selectedPackage,
  taxConfig,
  seasonMultiplier,
}: UsePriceCalculationProps): PriceBreakdown | null {
  return useMemo(() => {
    if (!checkInDate || !checkOutDate || !roomCategory) {
      return null;
    }

    const numNights = differenceInDays(checkOutDate, checkInDate);
    if (numNights <= 0) return null;

    // Base room price with seasonal multiplier
    const baseRoomPrice = roomCategory.base_price_per_night;
    const adjustedRoomPrice = baseRoomPrice * seasonMultiplier;
    const roomTotal = adjustedRoomPrice * numNights;

    // Extra guest charges
    const extraAdults = Math.max(0, numAdults - roomCategory.base_occupancy);
    const extraChildren = numChildren; // All children are extra
    const extraAdultTotal = extraAdults * roomCategory.extra_adult_price * numNights;
    const extraChildTotal = extraChildren * roomCategory.extra_child_price * numNights;
    const extraGuestTotal = extraAdultTotal + extraChildTotal;

    // Meal plan charges
    const mealPlanPrice = mealPlanPrices.find(mp => mp.meal_plan === mealPlan);
    const mealPlanAdultTotal = mealPlanPrice 
      ? mealPlanPrice.adult_price * numAdults * numNights 
      : 0;
    const mealPlanChildTotal = mealPlanPrice 
      ? mealPlanPrice.child_price * numChildren * numNights 
      : 0;
    const mealPlanTotal = mealPlanAdultTotal + mealPlanChildTotal;

    // Package charges
    let packageTotal = 0;
    if (selectedPackage) {
      if (selectedPackage.is_fixed_price && selectedPackage.fixed_price) {
        packageTotal = selectedPackage.fixed_price;
      } else if (selectedPackage.per_night_price) {
        packageTotal = selectedPackage.per_night_price * numNights;
      }
    }

    // Subtotal before taxes
    const subtotal = roomTotal + extraGuestTotal + mealPlanTotal + packageTotal;

    // Calculate taxes
    const taxRate = taxConfig.reduce((sum, tax) => sum + tax.percentage, 0);
    const taxes = subtotal * (taxRate / 100);

    // Grand total
    const grandTotal = subtotal + taxes;

    return {
      numNights,
      baseRoomPrice,
      seasonMultiplier,
      roomTotal,
      extraAdults,
      extraChildren,
      extraAdultTotal,
      extraChildTotal,
      extraGuestTotal,
      mealPlanAdultTotal,
      mealPlanChildTotal,
      mealPlanTotal,
      packageTotal,
      subtotal,
      taxRate,
      taxes,
      grandTotal,
    };
  }, [
    checkInDate,
    checkOutDate,
    numAdults,
    numChildren,
    roomCategory,
    mealPlan,
    mealPlanPrices,
    selectedPackage,
    taxConfig,
    seasonMultiplier,
  ]);
}
