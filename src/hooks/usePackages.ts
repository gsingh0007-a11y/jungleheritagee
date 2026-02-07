import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Package {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  inclusions: string[] | null;
  price_modifier: number;
  is_percentage: boolean;
  is_active: boolean;
  display_order: number;
}

export function usePackages() {
  return useQuery({
    queryKey: ["packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Package[];
    },
  });
}

export function usePackage(slug: string) {
  return useQuery({
    queryKey: ["package", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      return data as Package;
    },
    enabled: !!slug,
  });
}
