import { useMemo } from "react";
import { format } from "date-fns";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useCheckAvailability } from "@/hooks/useRoomAvailability";
import { cn } from "@/lib/utils";

interface AvailabilityIndicatorProps {
  roomCategoryId: string | undefined;
  checkIn: Date | undefined;
  checkOut: Date | undefined;
  className?: string;
}

export function AvailabilityIndicator({
  roomCategoryId,
  checkIn,
  checkOut,
  className,
}: AvailabilityIndicatorProps) {
  const { data: availability, isLoading, isError } = useCheckAvailability(
    roomCategoryId,
    checkIn,
    checkOut
  );

  if (!roomCategoryId || !checkIn || !checkOut) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking availability...
      </div>
    );
  }

  if (isError) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-destructive", className)}>
        <AlertCircle className="h-4 w-4" />
        Could not check availability
      </div>
    );
  }

  if (!availability?.available) {
    return (
      <div className={cn("p-3 rounded-lg bg-destructive/10 border border-destructive/20", className)}>
        <div className="flex items-center gap-2 text-destructive font-medium">
          <AlertCircle className="h-4 w-4" />
          Not Available
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          This room is fully booked for {format(checkIn, "MMM d")} - {format(checkOut, "MMM d")}.
          Please try different dates.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20", className)}>
      <div className="flex items-center gap-2 text-emerald-600 font-medium">
        <CheckCircle2 className="h-4 w-4" />
        Available
      </div>
      <p className="text-sm text-muted-foreground mt-1">
        {availability.availableRooms.length} of {availability.totalRooms} room(s) available
        for your selected dates.
      </p>
    </div>
  );
}
