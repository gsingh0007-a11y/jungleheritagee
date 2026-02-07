import { useState } from "react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Phone, Mail, Briefcase, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Enquiry = Tables<"enquiries">;

export default function EnquiriesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [activeTab, setActiveTab] = useState("contact");

  const { data: enquiries = [], isLoading } = useQuery({
    queryKey: ["enquiries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enquiries")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Enquiry[];
    },
  });

  const toggleReadMutation = useMutation({
    mutationFn: async ({ id, isRead }: { id: string; isRead: boolean }) => {
      const { error } = await supabase
        .from("enquiries")
        .update({ is_read: isRead, responded_at: isRead ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enquiries"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("enquiries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enquiries"] });
      toast({ title: "Enquiry deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete", variant: "destructive" });
    },
  });

  const contactEnquiries = enquiries.filter(e => e.category === "contact" || !e.category);
  const jobApplications = enquiries.filter(e => e.category === "job_application");

  const renderEnquiryCard = (enquiry: Enquiry) => (
    <Card 
      key={enquiry.id} 
      className={`border-0 shadow-sm hover:shadow-md transition-shadow ${!enquiry.is_read ? 'ring-2 ring-gold/30' : ''}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              {enquiry.name}
              {!enquiry.is_read && (
                <Badge variant="secondary" className="bg-gold/10 text-gold text-[10px]">
                  New
                </Badge>
              )}
            </CardTitle>
            {enquiry.subject && (
              <p className="text-sm text-muted-foreground mt-1">{enquiry.subject}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contact Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            <a href={`mailto:${enquiry.email}`} className="hover:underline truncate">
              {enquiry.email}
            </a>
          </div>
          {enquiry.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              <a href={`tel:${enquiry.phone}`} className="hover:underline">
                {enquiry.phone}
              </a>
            </div>
          )}
        </div>

        {/* Message Preview */}
        <div className="p-3 rounded-lg bg-muted/30">
          <p className="text-sm line-clamp-3 whitespace-pre-wrap">{enquiry.message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setSelectedEnquiry(enquiry)}
          >
            View Full
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleReadMutation.mutate({ id: enquiry.id, isRead: !enquiry.is_read })}
            disabled={toggleReadMutation.isPending}
          >
            {enquiry.is_read ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Enquiry</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this enquiry from {enquiry.name}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => deleteMutation.mutate(enquiry.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Created date */}
        <p className="text-xs text-muted-foreground text-center pt-2">
          Received {format(new Date(enquiry.created_at), "MMM dd, yyyy 'at' h:mm a")}
        </p>
      </CardContent>
    </Card>
  );

  const renderEmptyState = (type: "contact" | "job") => (
    <Card className="border-0 shadow-sm">
      <CardContent className="flex flex-col items-center justify-center py-16">
        {type === "contact" ? (
          <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
        ) : (
          <Briefcase className="h-12 w-12 text-muted-foreground/30 mb-4" />
        )}
        <h3 className="text-lg font-medium">
          {type === "contact" ? "No Contact Enquiries" : "No Job Applications"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {type === "contact" 
            ? "Contact form submissions will appear here." 
            : "Job applications from the careers page will appear here."}
        </p>
      </CardContent>
    </Card>
  );

  const renderLoadingState = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="border-0 shadow-sm">
          <CardContent className="p-5">
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-medium">Enquiries</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage contact enquiries and job applications
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Contact
            {contactEnquiries.filter(e => !e.is_read).length > 0 && (
              <Badge variant="secondary" className="ml-1 bg-gold/10 text-gold">
                {contactEnquiries.filter(e => !e.is_read).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Job Applications
            {jobApplications.filter(e => !e.is_read).length > 0 && (
              <Badge variant="secondary" className="ml-1 bg-gold/10 text-gold">
                {jobApplications.filter(e => !e.is_read).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contact" className="mt-6">
          {isLoading ? (
            renderLoadingState()
          ) : contactEnquiries.length === 0 ? (
            renderEmptyState("contact")
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {contactEnquiries.map(renderEnquiryCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="jobs" className="mt-6">
          {isLoading ? (
            renderLoadingState()
          ) : jobApplications.length === 0 ? (
            renderEmptyState("job")
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {jobApplications.map(renderEnquiryCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={!!selectedEnquiry} onOpenChange={() => setSelectedEnquiry(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedEnquiry?.subject || "Enquiry Details"}</DialogTitle>
          </DialogHeader>
          {selectedEnquiry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedEnquiry.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <a href={`mailto:${selectedEnquiry.email}`} className="font-medium hover:underline">
                    {selectedEnquiry.email}
                  </a>
                </div>
                {selectedEnquiry.phone && (
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <a href={`tel:${selectedEnquiry.phone}`} className="font-medium hover:underline">
                      {selectedEnquiry.phone}
                    </a>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Received</p>
                  <p className="font-medium">
                    {format(new Date(selectedEnquiry.created_at), "PPp")}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-sm mb-2">Message</p>
                <div className="p-4 rounded-lg bg-muted/30 whitespace-pre-wrap text-sm">
                  {selectedEnquiry.message}
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    toggleReadMutation.mutate({ 
                      id: selectedEnquiry.id, 
                      isRead: !selectedEnquiry.is_read 
                    });
                    setSelectedEnquiry(null);
                  }}
                >
                  {selectedEnquiry.is_read ? "Mark as Unread" : "Mark as Read"}
                </Button>
                <Button asChild className="flex-1">
                  <a href={`mailto:${selectedEnquiry.email}?subject=Re: ${encodeURIComponent(selectedEnquiry.subject || "Your Enquiry")}`}>
                    Reply via Email
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}