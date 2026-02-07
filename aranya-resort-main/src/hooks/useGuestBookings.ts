import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Booking } from "@/types/booking";

export function useGuestBookings() {
  const { user } = useAuth();

  const {
    data: bookings = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["guest-bookings", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          room_categories:room_category_id(*),
          packages:package_id(*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((booking) => ({
        ...booking,
        room_category: booking.room_categories,
        package: booking.packages,
      })) as Booking[];
    },
    enabled: !!user,
  });

  const upcomingBookings = bookings.filter((b) => {
    const checkIn = new Date(b.check_in_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return checkIn >= today && b.status !== "cancelled" && b.status !== "checked_out" && b.status !== "no_show";
  });

  const pastBookings = bookings.filter((b) => {
    const checkOut = new Date(b.check_out_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return checkOut < today || b.status === "checked_out" || b.status === "cancelled" || b.status === "no_show";
  });

  return {
    bookings,
    upcomingBookings,
    pastBookings,
    isLoading,
    error,
    refetch,
  };
}
