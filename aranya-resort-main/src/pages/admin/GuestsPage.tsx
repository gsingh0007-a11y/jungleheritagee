import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Users, Mail, Phone, Calendar, BookOpen, Search, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

interface GuestUser {
  id: string;
  email: string;
  phone: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  role: string;
  booking_count: number;
  user_metadata: {
    full_name?: string;
    name?: string;
  };
}

export default function GuestsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin", "guests"],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const response = await fetch(
        `https://imlbvvxyxlknevvlbbpr.supabase.co/functions/v1/list-users`,
        {
          headers: {
            Authorization: `Bearer ${sessionData.session?.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch users");
      }

      return response.json() as Promise<{ users: GuestUser[]; total: number }>;
    },
  });

  // Filter users based on search query
  const filteredUsers = data?.users.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const name = user.user_metadata?.full_name || user.user_metadata?.name || "";
    return (
      user.email?.toLowerCase().includes(query) ||
      name.toLowerCase().includes(query) ||
      user.phone?.includes(query)
    );
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-200">Super Admin</Badge>;
      case "staff":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">Staff</Badge>;
      default:
        return <Badge variant="secondary">Guest</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-medium">Registered Users</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View all registered guests and their booking history
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-semibold">{data?.users?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <BookOpen className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Users with Bookings</p>
                <p className="text-2xl font-semibold">
                  {data?.users?.filter((u) => u.booking_count > 0).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">New This Month</p>
                <p className="text-2xl font-semibold">
                  {data?.users?.filter((u) => {
                    const created = new Date(u.created_at);
                    const now = new Date();
                    return (
                      created.getMonth() === now.getMonth() &&
                      created.getFullYear() === now.getFullYear()
                    );
                  }).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-serif flex items-center gap-2">
                <Users className="h-5 w-5 text-[hsl(var(--gold))]" />
                All Registered Users
              </CardTitle>
              <CardDescription>
                {filteredUsers?.length || 0} users found
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive">Failed to load users</p>
              <p className="text-sm text-muted-foreground mt-1">
                {(error as Error).message}
              </p>
              <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          ) : filteredUsers?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No users found
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>User</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-center">Bookings</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Last Login</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {(user.user_metadata?.full_name ||
                                user.user_metadata?.name ||
                                user.email)?.[0]?.toUpperCase() || "?"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">
                              {user.user_metadata?.full_name ||
                                user.user_metadata?.name ||
                                "No name"}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {user.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-sm">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="truncate max-w-[180px]">{user.email}</span>
                            {user.email_confirmed_at && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0">
                                Verified
                              </Badge>
                            )}
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Phone className="h-3.5 w-3.5" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={user.booking_count > 0 ? "default" : "secondary"}
                          className={user.booking_count > 0 ? "bg-[hsl(var(--gold))] text-[hsl(var(--forest-deep))]" : ""}
                        >
                          {user.booking_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(user.created_at), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.last_sign_in_at
                          ? format(new Date(user.last_sign_in_at), "MMM dd, yyyy")
                          : "Never"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
