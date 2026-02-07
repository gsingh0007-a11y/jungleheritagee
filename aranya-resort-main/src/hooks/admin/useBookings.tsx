import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { BookingStatus } from "@/types/booking";

export interface BookingFilters {
  search: string;
  status: BookingStatus | "all";
  roomCategoryId: string | "all";
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
}

export interface BookingWithRelations {
  id: string;
  booking_reference: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  guest_country: string | null;
  check_in_date: string;
  check_out_date: string;
  num_adults: number;
  num_children: number;
  num_rooms: number;
  base_price: number | null;
  taxes: number | null;
  extras: number | null;
  discount: number | null;
  grand_total: number | null;
  status: BookingStatus;
  is_enquiry_only: boolean;
  special_requests: string | null;
  internal_notes: string | null;
  assigned_room_numbers: string[] | null;
  source: string | null;
  payment_status: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  payment_id: string | null;
  payment_provider: string | null;
  created_at: string;
  updated_at: string;
  room_categories: {
    id: string;
    name: string;
    slug: string;
  } | null;
  packages: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export function useBookings(filters: BookingFilters, page: number = 1, perPage: number = 20) {
  const queryClient = useQueryClient();

  // Fetch bookings with filters
  const bookingsQuery = useQuery({
    queryKey: ["admin", "bookings", filters, page, perPage],
    queryFn: async () => {
      let query = supabase
        .from("bookings")
        .select(`
          *,
          room_categories(id, name, slug),
          packages(id, name, slug)
        `, { count: "exact" });

      // Apply filters
      if (filters.search) {
        query = query.or(
          `guest_name.ilike.%${filters.search}%,guest_phone.ilike.%${filters.search}%,booking_reference.ilike.%${filters.search}%`
        );
      }

      if (filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters.roomCategoryId !== "all") {
        query = query.eq("room_category_id", filters.roomCategoryId);
      }

      if (filters.dateFrom) {
        query = query.gte("check_in_date", filters.dateFrom.toISOString().split("T")[0]);
      }

      if (filters.dateTo) {
        query = query.lte("check_in_date", filters.dateTo.toISOString().split("T")[0]);
      }

      // Pagination
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        bookings: data as BookingWithRelations[],
        total: count || 0,
        page,
        perPage,
        totalPages: Math.ceil((count || 0) / perPage),
      };
    },
  });

  // Fetch single booking
  const useBooking = (id: string | undefined) => {
    return useQuery({
      queryKey: ["admin", "booking", id],
      queryFn: async () => {
        if (!id) return null;

        const { data, error } = await supabase
          .from("bookings")
          .select(`
            *,
            room_categories(*),
            packages(*)
          `)
          .eq("id", id)
          .single();

        if (error) throw error;
        return data as BookingWithRelations;
      },
      enabled: !!id,
    });
  };

  // Update booking status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BookingStatus }) => {
      const { data, error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "bookings"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "booking"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      toast({
        title: "Status Updated",
        description: "Booking status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update booking status.",
      });
    },
  });

  // Update internal notes
  const updateNotesMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { data, error } = await supabase
        .from("bookings")
        .update({ internal_notes: notes })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "booking"] });
      toast({
        title: "Notes Saved",
        description: "Internal notes have been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save notes.",
      });
    },
  });

  // Convert enquiry to booking
  const convertEnquiryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("bookings")
        .update({
          is_enquiry_only: false,
          status: "pending_confirmation" as BookingStatus
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "bookings"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "booking"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      toast({
        title: "Enquiry Converted",
        description: "Enquiry has been converted to a pending booking.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to convert enquiry.",
      });
    },
  });

  return {
    bookings: bookingsQuery.data?.bookings || [],
    total: bookingsQuery.data?.total || 0,
    totalPages: bookingsQuery.data?.totalPages || 1,
    isLoading: bookingsQuery.isLoading,
    refetch: bookingsQuery.refetch,
    useBooking,
    updateStatus: updateStatusMutation.mutate,
    updateNotes: updateNotesMutation.mutate,
    convertEnquiry: convertEnquiryMutation.mutate,
    isUpdating: updateStatusMutation.isPending || updateNotesMutation.isPending || convertEnquiryMutation.isPending,
  };
}

// Fetch room categories for filter dropdown
export function useRoomCategories() {
  return useQuery({
    queryKey: ["admin", "roomCategories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("room_categories")
        .select("id, name, slug")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}
