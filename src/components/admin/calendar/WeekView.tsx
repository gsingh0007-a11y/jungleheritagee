import { format, isSameDay, isWithinInterval, parseISO, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { BookingTooltip } from "./BookingTooltip";
import type { CalendarBooking } from "@/types/rooms";

interface WeekViewProps {
  startDate: Date;
  endDate: Date;
  bookings: CalendarBooking[];
}

const STATUS_COLORS: Record<string, string> = {
  new_enquiry: "bg-amber-500",
  enquiry_responded: "bg-amber-400",
  quote_sent: "bg-blue-500",
  booking_confirmed: "bg-emerald-500",
  checked_in: "bg-green-600",
  checked_out: "bg-gray-500",
  cancelled: "bg-red-500",
  no_show: "bg-red-400",
};

export function WeekView({ startDate, endDate, bookings }: WeekViewProps) {
  // Generate days for the week
  const days: Date[] = [];
  let current = startDate;
  while (current <= endDate) {
    days.push(current);
    current = addDays(current, 1);
  }

  // Get bookings for a specific day
  const getBookingsForDay = (date: Date): CalendarBooking[] => {
    return bookings.filter((booking) => {
      const checkIn = parseISO(booking.check_in_date);
      const checkOut = parseISO(booking.check_out_date);
      return isWithinInterval(date, { start: checkIn, end: addDays(checkOut, -1) }) ||
             isSameDay(date, checkIn);
    });
  };

  return (
    <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
      {days.map((day, idx) => {
        const dayBookings = getBookingsForDay(day);
        const isToday = isSameDay(day, new Date());

        return (
          <div key={idx} className="bg-card min-h-[400px]">
            {/* Day Header */}
            <div className={cn(
              "p-3 text-center border-b",
              isToday && "bg-primary/10"
            )}>
              <p className="text-sm font-medium text-muted-foreground">
                {format(day, "EEE")}
              </p>
              <p className={cn(
                "text-2xl font-serif",
                isToday && "text-primary"
              )}>
                {format(day, "d")}
              </p>
            </div>

            {/* Bookings */}
            <div className="p-2 space-y-2">
              {dayBookings.map((booking) => (
                <BookingTooltip key={booking.id} booking={booking}>
                  <div
                    className={cn(
                      "p-2 rounded-lg text-white cursor-pointer hover:opacity-90 transition-opacity",
                      STATUS_COLORS[booking.status] || "bg-gray-500"
                    )}
                  >
                    <p className="font-medium text-sm truncate">{booking.guest_name}</p>
                    <p className="text-xs opacity-90 truncate">
                      {booking.room_category?.name || "Room TBD"}
                    </p>
                    <p className="text-xs opacity-75">
                      {format(parseISO(booking.check_in_date), "h:mm a")}
                    </p>
                  </div>
                </BookingTooltip>
              ))}

              {dayBookings.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">
                  No bookings
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
