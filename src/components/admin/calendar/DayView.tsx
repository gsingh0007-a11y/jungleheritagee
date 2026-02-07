import { format, parseISO, differenceInDays } from "date-fns";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, User, Phone, Mail, ExternalLink, Users, Bed, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarBooking } from "@/types/rooms";

interface DayViewProps {
  date: Date;
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

export function DayView({ date, bookings }: DayViewProps) {
  // Group bookings by type (check-ins, check-outs, staying)
  const checkIns = bookings.filter((b) => 
    format(parseISO(b.check_in_date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
  );
  
  const checkOuts = bookings.filter((b) => 
    format(parseISO(b.check_out_date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
  );
  
  const staying = bookings.filter((b) => {
    const checkIn = format(parseISO(b.check_in_date), "yyyy-MM-dd");
    const checkOut = format(parseISO(b.check_out_date), "yyyy-MM-dd");
    const current = format(date, "yyyy-MM-dd");
    return checkIn < current && checkOut > current;
  });

  const renderBookingCard = (booking: CalendarBooking, type: "check-in" | "check-out" | "staying") => {
    const checkIn = parseISO(booking.check_in_date);
    const checkOut = parseISO(booking.check_out_date);
    const nights = differenceInDays(checkOut, checkIn);

    return (
      <Card key={booking.id} className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{booking.guest_name}</span>
              </div>
              <p className="text-xs text-muted-foreground">{booking.booking_reference}</p>
            </div>
            <Badge
              variant="outline"
              className={cn("text-xs text-white border-0", STATUS_COLORS[booking.status])}
            >
              {STATUS_LABELS[booking.status] || booking.status}
            </Badge>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <span>
                {format(checkIn, "MMM d")} → {format(checkOut, "MMM d")}
              </span>
              <span className="text-xs">({nights} night{nights !== 1 ? "s" : ""})</span>
            </div>

            {booking.room_category && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Bed className="h-4 w-4" />
                <span>{booking.room_category.name}</span>
                {booking.room && (
                  <Badge variant="secondary" className="text-xs">
                    Room {booking.room.room_number}
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                {booking.num_adults} Adult{booking.num_adults !== 1 ? "s" : ""}
                {booking.num_children > 0 && `, ${booking.num_children} Child${booking.num_children !== 1 ? "ren" : ""}`}
              </span>
            </div>

            {booking.guest_phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <a href={`tel:${booking.guest_phone}`} className="hover:text-primary">
                  {booking.guest_phone}
                </a>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            {booking.grand_total && (
              <p className="font-semibold">
                ₹{booking.grand_total.toLocaleString("en-IN")}
              </p>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link to={`/admin/bookings/${booking.id}`}>
                <ExternalLink className="h-4 w-4 mr-1" />
                View
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Check-ins */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <h3 className="font-semibold">Check-ins ({checkIns.length})</h3>
        </div>
        <div className="space-y-3">
          {checkIns.length > 0 ? (
            checkIns.map((b) => renderBookingCard(b, "check-in"))
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center text-muted-foreground">
                No check-ins today
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Staying */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <h3 className="font-semibold">In-house ({staying.length})</h3>
        </div>
        <div className="space-y-3">
          {staying.length > 0 ? (
            staying.map((b) => renderBookingCard(b, "staying"))
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center text-muted-foreground">
                No guests in-house
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Check-outs */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <h3 className="font-semibold">Check-outs ({checkOuts.length})</h3>
        </div>
        <div className="space-y-3">
          {checkOuts.length > 0 ? (
            checkOuts.map((b) => renderBookingCard(b, "check-out"))
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center text-muted-foreground">
                No check-outs today
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
