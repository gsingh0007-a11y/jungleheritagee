import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  IndianRupee,
  Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BookingStatusBadge } from "@/components/admin/BookingStatusBadge";
import { useBookings, useRoomCategories, type BookingFilters } from "@/hooks/admin/useBookings";
import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/types/booking";

const statusOptions: { value: BookingStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "new_enquiry", label: "New Enquiry" },
  { value: "enquiry_responded", label: "Responded" },
  { value: "quote_sent", label: "Quote Sent" },
  { value: "booking_confirmed", label: "Confirmed" },
  { value: "checked_in", label: "Checked In" },
  { value: "checked_out", label: "Checked Out" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No Show" },
];

export default function BookingsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<BookingFilters>({
    search: "",
    status: "all",
    roomCategoryId: "all",
    dateFrom: undefined,
    dateTo: undefined,
  });

  const { bookings, total, totalPages, isLoading } = useBookings(filters, page);
  const { data: roomCategories } = useRoomCategories();

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    setPage(1);
  };

  const handleStatusChange = (value: string) => {
    setFilters((prev) => ({ ...prev, status: value as BookingStatus | "all" }));
    setPage(1);
  };

  const handleRoomChange = (value: string) => {
    setFilters((prev) => ({ ...prev, roomCategoryId: value }));
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-medium">Bookings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage all reservations and enquiries
        </p>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or booking ID..."
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={filters.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Room Filter */}
            <Select value={filters.roomCategoryId} onValueChange={handleRoomChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Room Type" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All Rooms</SelectItem>
                {roomCategories?.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  {filters.dateFrom
                    ? format(filters.dateFrom, "MMM dd") +
                    (filters.dateTo ? ` - ${format(filters.dateTo, "MMM dd")}` : "")
                    : "Date Range"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover" align="end">
                <CalendarComponent
                  mode="range"
                  selected={{
                    from: filters.dateFrom,
                    to: filters.dateTo,
                  }}
                  onSelect={(range) =>
                    setFilters((prev) => ({
                      ...prev,
                      dateFrom: range?.from,
                      dateTo: range?.to,
                    }))
                  }
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-medium">Reference</TableHead>
                <TableHead className="font-medium">Guest</TableHead>
                <TableHead className="font-medium">Room / Package</TableHead>
                <TableHead className="font-medium">Dates</TableHead>
                <TableHead className="font-medium text-center">Guests</TableHead>
                <TableHead className="font-medium text-right">Amount</TableHead>
                <TableHead className="font-medium text-center">Status</TableHead>
                <TableHead className="font-medium">Created</TableHead>
                <TableHead className="font-medium text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                    No bookings found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((booking) => (
                  <TableRow
                    key={booking.id}
                    className="hover:bg-muted/30 cursor-pointer"
                    onClick={() => navigate(`/admin/bookings/${booking.id}`)}
                  >
                    <TableCell className="font-mono text-sm font-medium">
                      {booking.booking_reference}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{booking.guest_name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {booking.guest_phone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{booking.room_categories?.name || "—"}</p>
                        {booking.packages && (
                          <p className="text-xs text-muted-foreground">{booking.packages.name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{format(new Date(booking.check_in_date), "MMM dd")}</p>
                        <p className="text-muted-foreground">
                          to {format(new Date(booking.check_out_date), "MMM dd")}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 text-sm">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        {booking.num_adults + booking.num_children}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <div className="flex items-center justify-end gap-0.5">
                        <IndianRupee className="h-3.5 w-3.5" />
                        {Number(booking.grand_total).toLocaleString("en-IN")}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <BookingStatusBadge status={booking.status} />
                      {booking.payment_status && (
                        <div className="mt-1 text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                          {booking.payment_status}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(booking.created_at), "MMM dd, yy")}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/bookings/${booking.id}`);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t">
            <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} bookings
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
