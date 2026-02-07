import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { 
  Calendar, 
  User, 
  LogOut, 
  Clock, 
  MapPin, 
  Users, 
  Loader2,
  ArrowRight,
  CalendarCheck,
  History,
  Settings as SettingsIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useGuestBookings } from "@/hooks/useGuestBookings";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { toast } from "@/hooks/use-toast";
import { BookingStatusBadge } from "@/components/admin/BookingStatusBadge";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const MEAL_PLAN_LABELS: Record<string, string> = {
  EP: "Room Only",
  CP: "With Breakfast",
  MAP: "Breakfast & Dinner",
  AP: "All Meals",
};

export default function GuestAccount() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut, isAdmin } = useAuth();
  const { upcomingBookings, pastBookings, isLoading: bookingsLoading } = useGuestBookings();

  // Auto logout after 30 minutes of inactivity
  useAutoLogout({
    timeoutMinutes: 30,
    warningMinutes: 5,
    enabled: !!user,
    onWarning: () => {
      toast({
        title: "Session expiring soon",
        description: "You'll be logged out in 5 minutes due to inactivity.",
      });
    },
    onLogout: () => {
      toast({
        title: "Session expired",
        description: "You've been logged out due to inactivity.",
      });
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", { replace: true });
    }
    // Redirect admins to admin dashboard
    if (!authLoading && user && isAdmin) {
      navigate("/admin", { replace: true });
    }
  }, [user, authLoading, isAdmin, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const isLoading = bookingsLoading;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-12 overflow-hidden bg-gradient-to-b from-[hsl(var(--forest-deep))] to-[hsl(var(--forest))]">
        <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-5" />
        <div className="relative container max-w-5xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <span className="text-[hsl(var(--gold-light))] uppercase tracking-[0.2em] text-sm font-medium">
              My Account
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-ivory mt-4">
              Welcome back{user.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(" ")[0]}` : ""}
            </h1>
            <p className="text-ivory/70 mt-4 max-w-xl mx-auto">
              Manage your bookings, view your stay history, and update your account settings
            </p>
          </motion.div>
        </div>
      </section>

      <main className="flex-1 py-8 sm:py-12">
        <div className="container max-w-5xl mx-auto px-4">
          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8"
          >
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-[hsl(var(--forest))]/10">
                    <CalendarCheck className="h-5 w-5 text-[hsl(var(--forest))]" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{upcomingBookings.length}</p>
                    <p className="text-sm text-muted-foreground">Upcoming</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-[hsl(var(--gold))]/10">
                    <History className="h-5 w-5 text-[hsl(var(--gold))]" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{pastBookings.length}</p>
                    <p className="text-sm text-muted-foreground">Past Stays</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50 col-span-2 sm:col-span-1">
              <CardContent className="pt-6">
                <Link to="/booking" className="flex items-center gap-3 group">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium group-hover:text-primary transition-colors">Book New Stay</p>
                    <p className="text-sm text-muted-foreground">Plan your next escape</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          {/* Bookings Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList className="w-full sm:w-auto mb-6">
                <TabsTrigger value="upcoming" className="flex-1 sm:flex-none">
                  Upcoming Stays
                </TabsTrigger>
                <TabsTrigger value="past" className="flex-1 sm:flex-none">
                  Past Stays
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex-1 sm:flex-none">
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : upcomingBookings.length === 0 ? (
                  <Card className="border-border/50">
                    <CardContent className="py-12 text-center">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No upcoming stays</h3>
                      <p className="text-muted-foreground mb-4">
                        You don't have any upcoming reservations.
                      </p>
                      <Link to="/booking">
                        <Button>
                          Book Your Stay
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {upcomingBookings.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="past">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : pastBookings.length === 0 ? (
                  <Card className="border-border/50">
                    <CardContent className="py-12 text-center">
                      <History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No past stays</h3>
                      <p className="text-muted-foreground">
                        Your booking history will appear here.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {pastBookings.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} isPast />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="settings">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <SettingsIcon className="h-5 w-5" />
                      Account Settings
                    </CardTitle>
                    <CardDescription>
                      Manage your account details and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="mt-1">{user.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                      <p className="mt-1">{user.user_metadata?.full_name || "Not set"}</p>
                    </div>
                    <Separator />
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button variant="outline" disabled>
                        Update Profile
                      </Button>
                      <Button variant="outline" disabled>
                        Change Password
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Profile updates coming soon. Contact us for assistance.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function BookingCard({ booking, isPast }: { booking: any; isPast?: boolean }) {
  return (
    <Card className="border-border/50 overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        {/* Room Image */}
        <div className="sm:w-48 h-32 sm:h-auto bg-muted flex-shrink-0">
          {booking.room_category?.images?.[0] ? (
            <img
              src={booking.room_category.images[0]}
              alt={booking.room_category.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[hsl(var(--forest))]/10">
              <MapPin className="h-8 w-8 text-[hsl(var(--forest))]/50" />
            </div>
          )}
        </div>

        {/* Booking Details */}
        <div className="flex-1 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
            <div>
              <h3 className="font-serif text-lg">
                {booking.room_category?.name || "Room"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Booking #{booking.booking_reference}
              </p>
            </div>
            <BookingStatusBadge status={booking.status} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Check-in</p>
                <p className="font-medium">{format(new Date(booking.check_in_date), "MMM d, yyyy")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Check-out</p>
                <p className="font-medium">{format(new Date(booking.check_out_date), "MMM d, yyyy")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Guests</p>
                <p className="font-medium">
                  {booking.num_adults} Adult{booking.num_adults > 1 ? "s" : ""}
                  {booking.num_children > 0 && `, ${booking.num_children} Child${booking.num_children > 1 ? "ren" : ""}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Rooms</p>
                <p className="font-medium">{booking.num_rooms} room(s)</p>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-lg font-semibold">₹{Number(booking.grand_total || 0).toLocaleString("en-IN")}</p>
            </div>
            {!isPast && booking.special_requests && (
              <Badge variant="secondary" className="w-fit">
                Special requests noted
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
