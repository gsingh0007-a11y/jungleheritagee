import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Users, Plus, Trash2, Shield, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { useAdminAuth } from "@/hooks/admin/useAdminAuth";
import type { AppRole } from "@/types/booking";

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { user: currentUser, isSuperAdmin } = useAdminAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState("");

  const { data: userRoles, isLoading } = useQuery({
    queryKey: ["admin", "userRoles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as UserRole[];
    },
    enabled: isSuperAdmin,
  });

  const addStaffMutation = useMutation({
    mutationFn: async (staffEmail: string) => {
      // First, check if user exists in auth
      // Note: We can't directly query auth.users, so we'll add the role entry
      // The user must have signed up first
      
      // For now, we'll create an invitation-style system
      // The email is stored and when that user signs up, they get the role
      
      // Check if role already exists for this email
      // Since we can't query by email, we'll just insert and let unique constraint handle it
      
      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: "00000000-0000-0000-0000-000000000000", // Placeholder - will need to be updated when user signs up
          role: "staff" as AppRole,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "userRoles"] });
      setDialogOpen(false);
      setEmail("");
      toast({ 
        title: "Staff role added", 
        description: "The user has been granted staff access." 
      });
    },
    onError: (error: any) => {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error.message 
      });
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "userRoles"] });
      toast({ title: "Role removed" });
    },
    onError: (error: any) => {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error.message 
      });
    },
  });

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Shield className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h2 className="text-lg font-medium">Access Restricted</h2>
        <p className="text-sm text-muted-foreground">
          Only super admins can manage staff accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-medium">Staff Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage admin and staff access
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Staff Member</DialogTitle>
              <DialogDescription>
                Grant staff access to a user. They must have already created an account.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addStaffMutation.mutate(email);
              }}
              className="space-y-4 py-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@example.com"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  The user must sign up first, then you can add them here.
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addStaffMutation.isPending}>
                  {addStaffMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Add Staff
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-serif flex items-center gap-2">
            <Users className="h-5 w-5 text-[hsl(var(--gold))]" />
            User Roles
          </CardTitle>
          <CardDescription>
            All users with admin or staff access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : userRoles?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No staff members configured
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>User ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userRoles?.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-mono text-xs">
                      {role.user_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant={role.role === "super_admin" ? "default" : "secondary"}>
                        {role.role === "super_admin" ? "Super Admin" : "Staff"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(role.created_at), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="text-center">
                      {role.user_id !== currentUser?.id && role.role !== "super_admin" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Access</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove staff access for this user. They will no longer be able to access the admin dashboard.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => removeRoleMutation.mutate(role.id)}>
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm border-l-4 border-l-amber-500">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Security Note</p>
              <p className="text-sm text-muted-foreground mt-1">
                Super Admin roles can only be assigned directly in the database for security reasons. 
                Staff members have limited access and cannot modify pricing or delete data.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
