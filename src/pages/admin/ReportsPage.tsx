import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { BarChart3, Download, Calendar, TrendingUp, BedDouble, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  // Revenue by date
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ["admin", "reports", "revenue", dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("created_at, grand_total, status")
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString())
        .in("status", ["booking_confirmed", "checked_in", "checked_out"]);

      if (error) throw error;

      const totalRevenue = data.reduce((sum, b) => sum + Number(b.grand_total), 0);
      const bookingCount = data.length;

      return { totalRevenue, bookingCount, data };
    },
  });

  // Room performance
  const { data: roomPerformance, isLoading: roomLoading } = useQuery({
    queryKey: ["admin", "reports", "roomPerformance", dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("room_category_id, grand_total, room_categories(name)")
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString())
        .in("status", ["booking_confirmed", "checked_in", "checked_out"]);

      if (error) throw error;

      const grouped: Record<string, { name: string; count: number; revenue: number }> = {};
      data.forEach((b: any) => {
        const name = b.room_categories?.name || "Unknown";
        if (!grouped[name]) grouped[name] = { name, count: 0, revenue: 0 };
        grouped[name].count++;
        grouped[name].revenue += Number(b.grand_total);
      });

      return Object.values(grouped).sort((a, b) => b.revenue - a.revenue);
    },
  });

  // Package performance
  const { data: packagePerformance, isLoading: packageLoading } = useQuery({
    queryKey: ["admin", "reports", "packagePerformance", dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("package_id, package_total, packages(name)")
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString())
        .in("status", ["booking_confirmed", "checked_in", "checked_out"])
        .not("package_id", "is", null);

      if (error) throw error;

      const grouped: Record<string, { name: string; count: number; revenue: number }> = {};
      data.forEach((b: any) => {
        const name = b.packages?.name || "Unknown";
        if (!grouped[name]) grouped[name] = { name, count: 0, revenue: 0 };
        grouped[name].count++;
        grouped[name].revenue += Number(b.package_total);
      });

      return Object.values(grouped).sort((a, b) => b.revenue - a.revenue);
    },
  });

  // Export CSV
  const handleExport = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, room_categories(name), packages(name)")
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      const headers = [
        "Booking Reference",
        "Guest Name",
        "Email",
        "Phone",
        "Room Type",
        "Package",
        "Check-in",
        "Check-out",
        "Nights",
        "Adults",
        "Children",
        "Grand Total",
        "Status",
        "Created At",
      ];

      const rows = data.map((b: any) => [
        b.booking_reference,
        b.guest_name,
        b.guest_email,
        b.guest_phone,
        b.room_categories?.name || "",
        b.packages?.name || "",
        b.check_in_date,
        b.check_out_date,
        b.num_nights,
        b.num_adults,
        b.num_children,
        b.grand_total,
        b.status,
        format(new Date(b.created_at), "yyyy-MM-dd HH:mm"),
      ]);

      const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bookings-${format(dateRange.from, "yyyyMMdd")}-${format(dateRange.to, "yyyyMMdd")}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: "Export Complete", description: `${data.length} bookings exported.` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Export Failed", description: error.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-serif font-medium">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Analytics and performance insights</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover" align="end">
              <CalendarComponent
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          <Button onClick={handleExport} className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-[hsl(var(--forest-deep))] to-[hsl(var(--forest))] text-white">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-[hsl(var(--gold))]" />
              <span className="text-sm text-white/80">Total Revenue</span>
            </div>
            {revenueLoading ? (
              <Skeleton className="h-8 w-32 bg-white/20" />
            ) : (
              <p className="text-2xl md:text-3xl font-bold font-serif text-[hsl(var(--gold))]">
                ₹{(revenueData?.totalRevenue || 0).toLocaleString("en-IN")}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-[hsl(var(--gold))]" />
              <span className="text-sm text-muted-foreground">Confirmed Bookings</span>
            </div>
            {revenueLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl md:text-3xl font-bold font-serif">{revenueData?.bookingCount || 0}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Room Performance */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <BedDouble className="h-5 w-5 text-[hsl(var(--gold))]" />
              Room Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {roomLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : roomPerformance?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data for selected period</p>
            ) : (
              <div className="overflow-x-auto">
              <Table className="min-w-[300px]">
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Room Type</TableHead>
                    <TableHead className="text-center">Bookings</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roomPerformance?.map((room) => (
                    <TableRow key={room.name}>
                      <TableCell className="font-medium">{room.name}</TableCell>
                      <TableCell className="text-center">{room.count}</TableCell>
                      <TableCell className="text-right">₹{room.revenue.toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Package Performance */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <Package className="h-5 w-5 text-[hsl(var(--gold))]" />
              Package Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {packageLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : packagePerformance?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No packages sold in selected period</p>
            ) : (
              <div className="overflow-x-auto">
              <Table className="min-w-[300px]">
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Package</TableHead>
                    <TableHead className="text-center">Sold</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packagePerformance?.map((pkg) => (
                    <TableRow key={pkg.name}>
                      <TableCell className="font-medium">{pkg.name}</TableCell>
                      <TableCell className="text-center">{pkg.count}</TableCell>
                      <TableCell className="text-right">₹{pkg.revenue.toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
