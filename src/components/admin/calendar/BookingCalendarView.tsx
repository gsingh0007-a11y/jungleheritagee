import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isWithinInterval, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, LayoutGrid, List, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCalendarBookings, type CalendarFilters } from "@/hooks/admin/useCalendarBookings";
import { useRoomCategories } from "@/hooks/admin/useBookings";
import { BookingTooltip } from "./BookingTooltip";
import { WeekView } from "./WeekView";
import { DayView } from "./DayView";
import type { CalendarBooking } from "@/types/rooms";
import type { BookingStatus } from "@/types/booking";

type ViewMode = "month" | "week" | "day";

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

const STATUS_LABELS: Record<string, string> = {
  new_enquiry: "New Enquiry",
  enquiry_responded: "Responded",
  quote_sent: "Quote Sent",
  booking_confirmed: "Confirmed",
  checked_in: "Checked In",
  checked_out: "Checked Out",
  cancelled: "Cancelled",
  no_show: "No Show",
};

export function BookingCalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [filters, setFilters] = useState<CalendarFilters>({
    roomCategoryId: "all",
    status: "all",
  });

  const { data: roomCategories } = useRoomCategories();

  // Calculate date range based on view mode
  const dateRange = useMemo(() => {
    if (viewMode === "month") {
      const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
      const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
      return { start, end };
    } else if (viewMode === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return { start, end };
    } else {
      return { start: currentDate, end: addDays(currentDate, 1) };
    }
  }, [currentDate, viewMode]);

  const { data: bookings, isLoading } = useCalendarBookings(
    dateRange.start,
    dateRange.end,
    filters
  );

  const navigate = (direction: "prev" | "next") => {
    if (viewMode === "month") {
      setCurrentDate(direction === "prev" ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    } else if (viewMode === "week") {
      setCurrentDate(direction === "prev" ? addDays(currentDate, -7) : addDays(currentDate, 7));
    } else {
      setCurrentDate(direction === "prev" ? addDays(currentDate, -1) : addDays(currentDate, 1));
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  // Get bookings for a specific day
  const getBookingsForDay = (date: Date): CalendarBooking[] => {
    if (!bookings) return [];
    return bookings.filter((booking) => {
      const checkIn = parseISO(booking.check_in_date);
      const checkOut = parseISO(booking.check_out_date);
      return isWithinInterval(date, { start: checkIn, end: addDays(checkOut, -1) }) ||
             isSameDay(date, checkIn);
    });
  };

  // Generate calendar days for month view
  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    let current = dateRange.start;
    while (current <= dateRange.end) {
      days.push(current);
      current = addDays(current, 1);
    }
    return days;
  }, [dateRange]);

  const renderMonthView = () => (
    <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
      {/* Header */}
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
        <div key={day} className="bg-muted px-2 py-3 text-center text-sm font-medium text-muted-foreground">
          {day}
        </div>
      ))}
      
      {/* Days */}
      {calendarDays.map((day, idx) => {
        const dayBookings = getBookingsForDay(day);
        const isToday = isSameDay(day, new Date());
        const isCurrentMonth = isSameMonth(day, currentDate);

        return (
          <div
            key={idx}
            className={cn(
              "min-h-[120px] bg-card p-2 transition-colors",
              !isCurrentMonth && "bg-muted/50",
              isToday && "ring-2 ring-inset ring-primary"
            )}
          >
            <div className={cn(
              "text-sm font-medium mb-1",
              !isCurrentMonth && "text-muted-foreground",
              isToday && "text-primary"
            )}>
              {format(day, "d")}
            </div>
            <div className="space-y-1 max-h-[80px] overflow-y-auto">
              {dayBookings.slice(0, 3).map((booking) => (
                <BookingTooltip key={booking.id} booking={booking}>
                  <div
                    className={cn(
                      "text-xs px-2 py-1 rounded-md text-white truncate cursor-pointer hover:opacity-90 transition-opacity",
                      STATUS_COLORS[booking.status] || "bg-gray-500"
                    )}
                  >
                    {booking.guest_name}
                  </div>
                </BookingTooltip>
              ))}
              {dayBookings.length > 3 && (
                <div className="text-xs text-muted-foreground px-2">
                  +{dayBookings.length - 3} more
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigate("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>
        <h2 className="text-lg md:text-xl font-serif font-medium">
            {viewMode === "day"
              ? format(currentDate, "EEEE, MMMM d, yyyy")
              : viewMode === "week"
              ? `${format(dateRange.start, "MMM d")} - ${format(dateRange.end, "MMM d, yyyy")}`
              : format(currentDate, "MMMM yyyy")}
        </h2>

          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg overflow-hidden w-full sm:w-auto">
            <Button
              variant={viewMode === "month" ? "default" : "ghost"}
              size="sm"
              className="rounded-none flex-1 sm:flex-none"
              onClick={() => setViewMode("month")}
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Month</span>
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "ghost"}
              size="sm"
              className="rounded-none border-x flex-1 sm:flex-none"
              onClick={() => setViewMode("week")}
            >
              <List className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Week</span>
            </Button>
            <Button
              variant={viewMode === "day" ? "default" : "ghost"}
              size="sm"
              className="rounded-none flex-1 sm:flex-none"
              onClick={() => setViewMode("day")}
            >
              <Clock className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Day</span>
            </Button>
          </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={filters.roomCategoryId}
          onValueChange={(value) => setFilters({ ...filters, roomCategoryId: value })}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Rooms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Rooms</SelectItem>
            {roomCategories?.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(value) => setFilters({ ...filters, status: value as BookingStatus | "all" })}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Legend */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:ml-auto">
          {Object.entries(STATUS_LABELS).slice(0, 4).map(([status, label]) => (
            <Badge
              key={status}
              variant="outline"
              className="text-[10px] sm:text-xs"
            >
              <span className={cn("w-2 h-2 rounded-full mr-1.5", STATUS_COLORS[status])} />
              {label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Calendar View */}
      {isLoading ? (
        <div className="grid grid-cols-7 gap-px">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px]" />
          ))}
        </div>
      ) : viewMode === "month" ? (
        renderMonthView()
      ) : viewMode === "week" ? (
        <WeekView
          startDate={dateRange.start}
          endDate={dateRange.end}
          bookings={bookings || []}
        />
      ) : (
        <DayView
          date={currentDate}
          bookings={getBookingsForDay(currentDate)}
        />
      )}
    </div>
  );
}
