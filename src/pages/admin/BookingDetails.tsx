import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, differenceInDays } from "date-fns";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  BedDouble,
  Package,
  UtensilsCrossed,
  IndianRupee,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Save,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { BookingStatusBadge } from "@/components/admin/BookingStatusBadge";
import { useBookings } from "@/hooks/admin/useBookings";
import type { BookingStatus } from "@/types/booking";

const mealPlanLabels: Record<string, string> = {
  EP: "Room Only (EP)",
  CP: "Continental Plan (CP)",
  MAP: "Modified American Plan (MAP)",
  AP: "American Plan (AP)",
};

const statusTransitions: Record<BookingStatus, BookingStatus[]> = {
  new_enquiry: ["enquiry_responded", "quote_sent", "cancelled"],
  enquiry_responded: ["quote_sent", "booking_confirmed", "cancelled"],
  quote_sent: ["booking_confirmed", "cancelled"],
  booking_confirmed: ["checked_in", "cancelled", "no_show"],
  checked_in: ["checked_out"],
  checked_out: [],
  cancelled: [],
  no_show: [],
};

export default function BookingDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<string>("");
  const [newStatus, setNewStatus] = useState<BookingStatus | "">("");

  const { useBooking, updateStatus, updateNotes, isUpdating } = useBookings(
    { search: "", status: "all", roomCategoryId: "all", dateFrom: undefined, dateTo: undefined },
    1
  );

  const { data: booking, isLoading, error } = useBooking(id);

  // Initialize notes when booking loads
  if (booking && notes === "" && booking.internal_notes) {
    setNotes(booking.internal_notes);
  }

  const handleSaveNotes = () => {
    if (id) {
      updateNotes({ id, notes });
    }
  };

  const handleStatusChange = () => {
    if (id && newStatus) {
      updateStatus({ id, status: newStatus });
      setNewStatus("");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-medium">Booking not found</h2>
        <p className="text-sm text-muted-foreground mb-4">
          The booking you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Button onClick={() => navigate("/admin/bookings")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Bookings
        </Button>
      </div>
    );
  }

  const availableTransitions = statusTransitions[booking.status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/bookings")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-serif font-medium font-mono">
                {booking.booking_reference}
              </h1>
              <BookingStatusBadge status={booking.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Created on {format(new Date(booking.created_at), "MMMM dd, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>

        {/* Status Change */}
        {availableTransitions.length > 0 && (
          <div className="flex items-center gap-2">
            <Select value={newStatus} onValueChange={(v) => setNewStatus(v as BookingStatus)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Change Status" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {availableTransitions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={!newStatus || isUpdating}>
                  Update Status
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to change the status to "{newStatus?.replace(/_/g, " ")}"?
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleStatusChange}>
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Guest Information */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-serif flex items-center gap-2">
                <User className="h-5 w-5 text-[hsl(var(--gold))]" />
                Guest Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Full Name</p>
                  <p className="font-medium">{booking.guest_name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{booking.guest_email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium">{booking.guest_phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Country</p>
                  <p className="font-medium">{booking.guest_country || "Not provided"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stay Details */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-serif flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[hsl(var(--gold))]" />
                Stay Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Check-in</p>
                  <p className="font-medium">
                    {format(new Date(booking.check_in_date), "EEEE, MMM dd, yyyy")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Check-out</p>
                  <p className="font-medium">
                    {format(new Date(booking.check_out_date), "EEEE, MMM dd, yyyy")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="font-medium">{differenceInDays(new Date(booking.check_out_date), new Date(booking.check_in_date))} night(s)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Guests</p>
                  <p className="font-medium">
                    {booking.num_adults} adult(s), {booking.num_children} child(ren)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BedDouble className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Room Type</p>
                  <p className="font-medium">{(booking as any).room_categories?.name || "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Package</p>
                  <p className="font-medium">{(booking as any).packages?.name || "No package"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 sm:col-span-2">
                <BedDouble className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Number of Rooms</p>
                  <p className="font-medium">{booking.num_rooms} room(s)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Special Requests */}
          {booking.special_requests && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[hsl(var(--gold))]" />
                  Special Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {booking.special_requests}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Internal Notes */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-serif flex items-center gap-2">
                <FileText className="h-5 w-5 text-[hsl(var(--gold))]" />
                Internal Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Add internal notes for staff..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
              <Button onClick={handleSaveNotes} disabled={isUpdating} size="sm">
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Notes
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Pricing & Timeline */}
        <div className="space-y-6">
          {/* Price Breakdown */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-serif flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-[hsl(var(--gold))]" />
                Price Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Base Price</span>
                <span>₹{Number(booking.base_price || 0).toLocaleString("en-IN")}</span>
              </div>
              {Number(booking.extras) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Extras</span>
                  <span>₹{Number(booking.extras).toLocaleString("en-IN")}</span>
                </div>
              )}
              {Number(booking.discount) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-₹{Number(booking.discount).toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxes</span>
                <span>₹{Number(booking.taxes || 0).toLocaleString("en-IN")}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Grand Total</span>
                <span className="text-[hsl(var(--gold))]">
                  ₹{Number(booking.grand_total || 0).toLocaleString("en-IN")}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-serif flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-[hsl(var(--gold))]" />
                Payment Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="capitalize font-medium">{booking.payment_status || 'Pending'}</span>
              </div>
              {booking.payment_provider && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Provider</span>
                  <span className="capitalize font-medium">{booking.payment_provider}</span>
                </div>
              )}
              {booking.payment_id && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment ID</span>
                  <span className="font-mono text-xs">{booking.payment_id}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-serif flex items-center gap-2">
                <Clock className="h-5 w-5 text-[hsl(var(--gold))]" />
                Status Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Booking Created</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(booking.created_at), "MMM dd, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>

              {booking.status === "booking_confirmed" && (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Confirmed</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(booking.updated_at), "MMM dd, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
              )}

              {booking.status === "checked_out" && (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                    <CheckCircle className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Completed</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(booking.updated_at), "MMM dd, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
              )}

              {booking.status === "cancelled" && (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                    <XCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Cancelled</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(booking.updated_at), "MMM dd, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div >
  );
}
