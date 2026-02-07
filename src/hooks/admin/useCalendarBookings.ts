import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CalendarBooking } from "@/types/rooms";
import type { BookingStatus } from "@/types/booking";

export interface CalendarFilters {
  roomCategoryId: string | "all";
  status: BookingStatus | "all";
}

export function useCalendarBookings(
  startDate: Date,
  endDate: Date,
  filters: CalendarFilters
) {
  return useQuery({
    queryKey: ["calendar_bookings", startDate.toISOString(), endDate.toISOString(), filters],
    queryFn: async () => {
      let query = supabase
        .from("bookings")
        .select(`
          id,
          booking_reference,
          guest_name,
          guest_email,
          guest_phone,
          check_in_date,
          check_out_date,
          status,
          room_id,
          room_category_id,
          num_adults,
          num_children,
          grand_total,
          room:rooms(id, room_number, room_category_id),
          room_category:room_categories(id, name, slug)
        `)
        .or(
          `and(check_in_date.lte.${endDate.toISOString().split("T")[0]},check_out_date.gte.${startDate.toISOString().split("T")[0]})`
        )
        .not("status", "eq", "cancelled")
        .order("check_in_date");

      if (filters.roomCategoryId !== "all") {
        query = query.eq("room_category_id", filters.roomCategoryId);
      }

      if (filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Transform the data to match CalendarBooking type
      return (data || []).map((item: any) => ({
        ...item,
        room: item.room?.[0] || null,
        room_category: item.room_category?.[0] || null,
      })) as CalendarBooking[];
    },
    enabled: !!startDate && !!endDate,
  });
}

export function useBlockedDatesForCalendar(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ["calendar_blocked_dates", startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blocked_dates")
        .select(`
          *,
          room:rooms(id, room_number, room_category_id, room_category:room_categories(id, name))
        `)
        .gte("blocked_date", startDate.toISOString().split("T")[0])
        .lte("blocked_date", endDate.toISOString().split("T")[0])
        .is("booking_id", null) // Only manual blocks
        .order("blocked_date");

      if (error) throw error;
      return data;
    },
    enabled: !!startDate && !!endDate,
  });
}
