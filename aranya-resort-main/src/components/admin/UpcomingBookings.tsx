import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingStatusBadge } from "./BookingStatusBadge";
import { CalendarDays, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import type { BookingStatus } from "@/types/booking";

interface UpcomingBooking {
  id: string;
  booking_reference: string;
  guest_name: string;
  check_in_date: string;
  check_out_date: string;
  num_adults: number;
  num_children: number;
  status: BookingStatus;
  room_categories: {
    name: string;
  } | null;
}

export function UpcomingBookings() {
  const navigate = useNavigate();
  const today = format(new Date(), "yyyy-MM-dd");
  const sevenDaysLater = format(addDays(new Date(), 7), "yyyy-MM-dd");

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["admin", "upcomingBookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          booking_reference,
          guest_name,
          check_in_date,
          check_out_date,
          num_adults,
          num_children,
          status,
          room_categories(name)
        `)
        .gte("check_in_date", today)
        .lte("check_in_date", sevenDaysLater)
        .in("status", ["booking_confirmed", "quote_sent", "checked_in"])
        .order("check_in_date", { ascending: true })
        .limit(8);

      if (error) throw error;

      // Supabase nested selects can come back as an object OR an array depending on
      // relationship inference; normalize to a single object for UI usage.
      const normalized = (data ?? []).map((row: any) => {
        const rc = Array.isArray(row.room_categories)
          ? row.room_categories[0] ?? null
          : row.room_categories ?? null;

        return {
          ...row,
          room_categories: rc,
        };
      });

      return normalized as unknown as UpcomingBooking[];
    },
  });

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-serif">Upcoming Check-ins</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-serif flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-[hsl(var(--gold))]" />
          Upcoming Check-ins
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs"
          onClick={() => navigate("/admin/bookings")}
        >
          View All
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </CardHeader>
      <CardContent>
        {bookings && bookings.length > 0 ? (
          <div className="space-y-2">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/admin/bookings/${booking.id}`)}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold))] font-serif font-bold text-sm">
                  {format(new Date(booking.check_in_date), "dd")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{booking.guest_name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{booking.room_categories?.name || "Room"}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {booking.num_adults + booking.num_children}
                    </span>
                  </div>
                </div>
                <BookingStatusBadge status={booking.status} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No upcoming check-ins in the next 7 days</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
