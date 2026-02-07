import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export function useLinkBookings() {
  const queryClient = useQueryClient();

  const linkBookings = useMutation({
    mutationFn: async ({ userId, email }: { userId: string; email: string }) => {
      // Find all bookings with this email that don't have a user_id
      const { data: existingBookings, error: fetchError } = await supabase
        .from("bookings")
        .select("id")
        .eq("guest_email", email.toLowerCase())
        .is("user_id", null);

      if (fetchError) throw fetchError;

      if (!existingBookings || existingBookings.length === 0) {
        return { linked: 0 };
      }

      // Update all matching bookings to link to this user
      const { error: updateError } = await supabase
        .from("bookings")
        .update({ user_id: userId })
        .eq("guest_email", email.toLowerCase())
        .is("user_id", null);

      if (updateError) throw updateError;

      return { linked: existingBookings.length };
    },
    onSuccess: (data) => {
      if (data.linked > 0) {
        queryClient.invalidateQueries({ queryKey: ["guest-bookings"] });
        toast({
          title: "Bookings Linked",
          description: `${data.linked} existing booking${data.linked > 1 ? "s" : ""} linked to your account.`,
        });
      }
    },
    onError: (error: any) => {
      console.error("Failed to link bookings:", error);
    },
  });

  return { linkBookings };
}
