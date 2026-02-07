import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Review {
  id: string;
  reviewer_name: string;
  reviewer_location: string | null;
  occasion: string | null;
  rating: number;
  review_text: string;
  source: string | null;
  is_active: boolean;
  display_order: number;
}

export function useReviews() {
  return useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data as Review[];
    },
  });
}
