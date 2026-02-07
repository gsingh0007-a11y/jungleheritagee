import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Room, BlockedDate, AvailabilityResult, BlockReason } from "@/types/rooms";

// Fetch all rooms with their category
export function useRooms(categoryId?: string) {
  return useQuery({
    queryKey: ["rooms", categoryId],
    queryFn: async () => {
      let query = supabase
        .from("rooms")
        .select(`
          *,
          room_category:room_categories(id, name, slug)
        `)
        .eq("is_active", true)
        .order("room_number");

      if (categoryId) {
        query = query.eq("room_category_id", categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Room[];
    },
  });
}

// Fetch blocked dates for a date range
export function useBlockedDates(startDate: Date, endDate: Date, roomId?: string) {
  return useQuery({
    queryKey: ["blocked_dates", startDate.toISOString(), endDate.toISOString(), roomId],
    queryFn: async () => {
      let query = supabase
        .from("blocked_dates")
        .select(`
          *,
          room:rooms(id, room_number, room_category_id, room_category:room_categories(id, name)),
          booking:bookings(id, booking_reference, guest_name, status)
        `)
        .gte("blocked_date", startDate.toISOString().split("T")[0])
        .lte("blocked_date", endDate.toISOString().split("T")[0]);

      if (roomId) {
        query = query.eq("room_id", roomId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BlockedDate[];
    },
    enabled: !!startDate && !!endDate,
  });
}

// Check availability for a room category and date range
export function useCheckAvailability(
  roomCategoryId: string | undefined,
  checkIn: Date | undefined,
  checkOut: Date | undefined
) {
  return useQuery({
    queryKey: ["availability", roomCategoryId, checkIn?.toISOString(), checkOut?.toISOString()],
    queryFn: async (): Promise<AvailabilityResult> => {
      if (!roomCategoryId || !checkIn || !checkOut) {
        return { available: false, availableRooms: [], totalRooms: 0 };
      }

      // Get available rooms using the database function
      const { data: availableRooms, error } = await supabase.rpc("get_available_rooms", {
        _room_category_id: roomCategoryId,
        _check_in: checkIn.toISOString().split("T")[0],
        _check_out: checkOut.toISOString().split("T")[0],
      });

      if (error) throw error;

      // Get total rooms in category
      const { count: totalRooms } = await supabase
        .from("rooms")
        .select("*", { count: "exact", head: true })
        .eq("room_category_id", roomCategoryId)
        .eq("is_active", true);

      return {
        available: (availableRooms?.length || 0) > 0,
        availableRooms: availableRooms || [],
        totalRooms: totalRooms || 0,
      };
    },
    enabled: !!roomCategoryId && !!checkIn && !!checkOut,
  });
}

// Get blocked dates for a specific room category (for guest calendar)
export function useBlockedDatesForCategory(
  roomCategoryId: string | undefined,
  startDate: Date,
  endDate: Date
) {
  return useQuery({
    queryKey: ["blocked_dates_category", roomCategoryId, startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      if (!roomCategoryId) return [];

      // Get all rooms in category
      const { data: rooms } = await supabase
        .from("rooms")
        .select("id")
        .eq("room_category_id", roomCategoryId)
        .eq("is_active", true);

      if (!rooms || rooms.length === 0) return [];

      const roomIds = rooms.map((r) => r.id);

      // Get blocked dates for these rooms
      const { data: blockedDates, error } = await supabase
        .from("blocked_dates")
        .select("blocked_date, room_id")
        .in("room_id", roomIds)
        .gte("blocked_date", startDate.toISOString().split("T")[0])
        .lte("blocked_date", endDate.toISOString().split("T")[0]);

      if (error) throw error;

      // Group by date and count blocked rooms
      const dateBlockCounts: Record<string, number> = {};
      blockedDates?.forEach((bd) => {
        dateBlockCounts[bd.blocked_date] = (dateBlockCounts[bd.blocked_date] || 0) + 1;
      });

      // Return dates where all rooms are blocked
      const fullyBlockedDates = Object.entries(dateBlockCounts)
        .filter(([_, count]) => count >= rooms.length)
        .map(([date]) => date);

      return fullyBlockedDates;
    },
    enabled: !!roomCategoryId,
  });
}

// Admin: Block dates manually
export function useBlockDates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roomId,
      startDate,
      endDate,
      reason,
      notes,
    }: {
      roomId: string;
      startDate: Date;
      endDate: Date;
      reason: BlockReason;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const dates: { room_id: string; blocked_date: string; reason: string; notes: string | null; created_by: string | null }[] = [];
      const current = new Date(startDate);
      
      while (current < endDate) {
        dates.push({
          room_id: roomId,
          blocked_date: current.toISOString().split("T")[0],
          reason,
          notes: notes || null,
          created_by: user?.id || null,
        });
        current.setDate(current.getDate() + 1);
      }

      const { error } = await supabase
        .from("blocked_dates")
        .upsert(dates, { onConflict: "room_id,blocked_date" });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked_dates"] });
      queryClient.invalidateQueries({ queryKey: ["availability"] });
      toast({
        title: "Dates Blocked",
        description: "The selected dates have been blocked successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to block dates.",
      });
    },
  });
}

// Admin: Unblock dates
export function useUnblockDates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roomId,
      startDate,
      endDate,
    }: {
      roomId: string;
      startDate: Date;
      endDate: Date;
    }) => {
      const { error } = await supabase
        .from("blocked_dates")
        .delete()
        .eq("room_id", roomId)
        .gte("blocked_date", startDate.toISOString().split("T")[0])
        .lt("blocked_date", endDate.toISOString().split("T")[0])
        .is("booking_id", null); // Only delete non-booking blocks

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked_dates"] });
      queryClient.invalidateQueries({ queryKey: ["availability"] });
      toast({
        title: "Dates Unblocked",
        description: "The selected dates have been unblocked.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to unblock dates.",
      });
    },
  });
}
