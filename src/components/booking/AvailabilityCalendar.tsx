import { useMemo } from "react";
import { format, startOfMonth, endOfMonth, addMonths, isSameMonth, isBefore, startOfDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useBlockedDatesForCategory } from "@/hooks/useRoomAvailability";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AvailabilityCalendarProps {
  roomCategoryId: string | undefined;
  checkIn: Date | undefined;
  checkOut: Date | undefined;
  onCheckInChange: (date: Date | undefined) => void;
  onCheckOutChange: (date: Date | undefined) => void;
  className?: string;
}

export function AvailabilityCalendar({
  roomCategoryId,
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
  className,
}: AvailabilityCalendarProps) {
  const today = startOfDay(new Date());
  
  // Get blocked dates for the next 6 months
  const startDate = startOfMonth(today);
  const endDate = endOfMonth(addMonths(today, 6));

  const { data: blockedDates, isLoading } = useBlockedDatesForCategory(
    roomCategoryId,
    startDate,
    endDate
  );

  // Convert blocked dates to a Set for fast lookup
  const blockedDatesSet = useMemo(() => {
    return new Set(blockedDates || []);
  }, [blockedDates]);

  // Check if a date is blocked
  const isDateBlocked = (date: Date): boolean => {
    const dateStr = format(date, "yyyy-MM-dd");
    return blockedDatesSet.has(dateStr);
  };

  // Disabled dates include past dates and blocked dates
  const disabledDates = (date: Date) => {
    if (isBefore(date, today)) return true;
    if (!roomCategoryId) return false;
    return isDateBlocked(date);
  };

  // Custom day content to show availability status
  const modifiers = useMemo(() => {
    const blocked: Date[] = [];
    const available: Date[] = [];

    if (blockedDates) {
      blockedDates.forEach((dateStr) => {
        blocked.push(new Date(dateStr));
      });
    }

    return { blocked };
  }, [blockedDates]);

  const modifiersClassNames = {
    blocked: "line-through opacity-50",
  };

  if (isLoading && roomCategoryId) {
    return (
      <div className={cn("space-y-2", className)}>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {roomCategoryId && blockedDates && blockedDates.length > 0 && (
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-muted inline-block line-through" />
          <span>Dates with strikethrough are fully booked</span>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Check-in Calendar */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Check-in</label>
          <div className="border rounded-xl p-3 bg-card">
            <Calendar
              mode="single"
              selected={checkIn}
              onSelect={(date) => {
                onCheckInChange(date);
                // Auto-advance checkout if needed
                if (date && (!checkOut || checkOut <= date)) {
                  const nextDay = new Date(date);
                  nextDay.setDate(nextDay.getDate() + 1);
                  onCheckOutChange(nextDay);
                }
              }}
              disabled={disabledDates}
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
              className="pointer-events-auto"
            />
          </div>
        </div>

        {/* Check-out Calendar */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Check-out</label>
          <div className="border rounded-xl p-3 bg-card">
            <Calendar
              mode="single"
              selected={checkOut}
              onSelect={onCheckOutChange}
              disabled={(date) => {
                if (!checkIn) return isBefore(date, today);
                return isBefore(date, checkIn) || isBefore(date, today);
              }}
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
              className="pointer-events-auto"
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      {checkIn && checkOut && (
        <div className="p-3 bg-muted rounded-lg text-sm">
          <strong>Selected stay:</strong>{" "}
          {format(checkIn, "EEE, MMM d")} → {format(checkOut, "EEE, MMM d, yyyy")}
          {" "}
          ({Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))} nights)
        </div>
      )}
    </div>
  );
}
