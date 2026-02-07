import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

export interface DashboardStats {
  totalBookingsToday: number;
  checkInsToday: number;
  checkOutsToday: number;
  pendingEnquiries: number;
  confirmedBookings: number;
  cancelledRecent: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

export interface BookingTrend {
  date: string;
  bookings: number;
  revenue: number;
}

export interface RoomDistribution {
  name: string;
  value: number;
}

export function useDashboardStats() {
  const today = format(new Date(), "yyyy-MM-dd");
  const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
  const startOfMonth = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd");

  // Main stats query
  const statsQuery = useQuery({
    queryKey: ["admin", "dashboard", "stats", today],
    queryFn: async (): Promise<DashboardStats> => {
      const todayStart = startOfDay(new Date()).toISOString();
      const todayEnd = endOfDay(new Date()).toISOString();

      // Parallel queries for efficiency
      const [
        todayBookingsRes,
        checkInsRes,
        checkOutsRes,
        pendingRes,
        confirmedRes,
        cancelledRes,
        revenueRes,
        monthlyRevenueRes,
      ] = await Promise.all([
        // Today's bookings
        supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .gte("created_at", todayStart)
          .lt("created_at", todayEnd),
        // Check-ins today
        supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("check_in_date", today)
          .eq("status", "booking_confirmed"),
        // Check-outs today
        supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("check_out_date", today)
          .eq("status", "booking_confirmed"),
        // Pending enquiries
        supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("status", "new_enquiry"),
        // Confirmed bookings
        supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("status", "booking_confirmed"),
        // Cancelled in last 30 days
        supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("status", "cancelled")
          .gte("updated_at", thirtyDaysAgo),
        // Total revenue (all confirmed/completed)
        supabase
          .from("bookings")
          .select("grand_total")
          .in("status", ["booking_confirmed", "checked_in", "checked_out"]),
        // Monthly revenue
        supabase
          .from("bookings")
          .select("grand_total")
          .in("status", ["booking_confirmed", "checked_in", "checked_out"])
          .gte("created_at", startOfMonth),
      ]);

      const totalRevenue = revenueRes.data?.reduce((sum, b) => sum + Number(b.grand_total), 0) || 0;
      const monthlyRevenue = monthlyRevenueRes.data?.reduce((sum, b) => sum + Number(b.grand_total), 0) || 0;

      return {
        totalBookingsToday: todayBookingsRes.count || 0,
        checkInsToday: checkInsRes.count || 0,
        checkOutsToday: checkOutsRes.count || 0,
        pendingEnquiries: pendingRes.count || 0,
        confirmedBookings: confirmedRes.count || 0,
        cancelledRecent: cancelledRes.count || 0,
        totalRevenue,
        monthlyRevenue,
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Booking trends (last 30 days)
  const trendsQuery = useQuery({
    queryKey: ["admin", "dashboard", "trends"],
    queryFn: async (): Promise<BookingTrend[]> => {
      const { data } = await supabase
        .from("bookings")
        .select("created_at, grand_total, status")
        .gte("created_at", subDays(new Date(), 30).toISOString())
        .order("created_at", { ascending: true });

      // Group by date
      const grouped: Record<string, { bookings: number; revenue: number }> = {};
      
      for (let i = 29; i >= 0; i--) {
        const date = format(subDays(new Date(), i), "yyyy-MM-dd");
        grouped[date] = { bookings: 0, revenue: 0 };
      }

      data?.forEach((booking) => {
        const date = format(new Date(booking.created_at), "yyyy-MM-dd");
        if (grouped[date]) {
          grouped[date].bookings++;
          if (booking.status === "booking_confirmed" || booking.status === "checked_in" || booking.status === "checked_out") {
            grouped[date].revenue += Number(booking.grand_total);
          }
        }
      });

      return Object.entries(grouped).map(([date, stats]) => ({
        date: format(new Date(date), "MMM dd"),
        ...stats,
      }));
    },
  });

  // Room distribution
  const roomDistributionQuery = useQuery({
    queryKey: ["admin", "dashboard", "roomDistribution"],
    queryFn: async (): Promise<RoomDistribution[]> => {
      const { data } = await supabase
        .from("bookings")
        .select("room_category_id, room_categories(name)")
        .in("status", ["booking_confirmed", "checked_in", "checked_out", "quote_sent"]);

      const distribution: Record<string, number> = {};
      
      data?.forEach((booking: any) => {
        const roomName = booking.room_categories?.name || "Unknown";
        distribution[roomName] = (distribution[roomName] || 0) + 1;
      });

      return Object.entries(distribution).map(([name, value]) => ({
        name,
        value,
      }));
    },
  });

  return {
    stats: statsQuery.data,
    statsLoading: statsQuery.isLoading,
    trends: trendsQuery.data || [],
    trendsLoading: trendsQuery.isLoading,
    roomDistribution: roomDistributionQuery.data || [],
    roomDistributionLoading: roomDistributionQuery.isLoading,
    refetch: () => {
      statsQuery.refetch();
      trendsQuery.refetch();
      roomDistributionQuery.refetch();
    },
  };
}
