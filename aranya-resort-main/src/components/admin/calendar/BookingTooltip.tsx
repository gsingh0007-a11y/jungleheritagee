import { format, parseISO, differenceInDays } from "date-fns";
import { Link } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, User, Phone, Mail, ExternalLink, Users, Bed } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarBooking } from "@/types/rooms";

interface BookingTooltipProps {
  booking: CalendarBooking;
  children: React.ReactNode;
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

export function BookingTooltip({ booking, children }: BookingTooltipProps) {
  const checkIn = parseISO(booking.check_in_date);
  const checkOut = parseISO(booking.check_out_date);
  const nights = differenceInDays(checkOut, checkIn);

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side="right"
        align="start"
        className="w-72 p-0 bg-card border shadow-lg"
      >
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-foreground">{booking.guest_name}</p>
              <p className="text-xs text-muted-foreground">{booking.booking_reference}</p>
            </div>
            <Badge
              variant="outline"
              className={cn("text-xs text-white border-0", STATUS_COLORS[booking.status])}
            >
              {STATUS_LABELS[booking.status] || booking.status}
            </Badge>
          </div>

          {/* Details */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <span>
                {format(checkIn, "MMM d")} → {format(checkOut, "MMM d, yyyy")}
              </span>
              <span className="text-xs">({nights} night{nights !== 1 ? "s" : ""})</span>
            </div>

            {booking.room_category && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Bed className="h-4 w-4" />
                <span>{booking.room_category.name}</span>
                {booking.room && (
                  <span className="text-xs">• Room {booking.room.room_number}</span>
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
                <span>{booking.guest_phone}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span className="truncate">{booking.guest_email}</span>
            </div>

            {booking.grand_total && (
              <div className="pt-2 border-t">
                <p className="font-semibold text-foreground">
                  Total: ₹{booking.grand_total.toLocaleString("en-IN")}
                </p>
              </div>
            )}
          </div>

          {/* Action */}
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link to={`/admin/bookings/${booking.id}`}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Booking
            </Link>
          </Button>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
