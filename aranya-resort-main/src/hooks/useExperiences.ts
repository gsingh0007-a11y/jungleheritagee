 import { useQuery } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 
 export interface Experience {
   id: string;
   name: string;
   slug: string;
   subtitle: string | null;
   description: string | null;
   long_description: string | null;
   duration: string | null;
   best_time: string | null;
   image_url: string | null;
   gallery_images: string[];
   highlights: string[];
   is_active: boolean;
   display_order: number;
   created_at: string;
   updated_at: string;
 }
 
 export function useExperiences() {
   return useQuery({
     queryKey: ["experiences"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("experiences")
         .select("*")
         .eq("is_active", true)
         .order("display_order", { ascending: true });
 
       if (error) throw error;
       return (data || []) as Experience[];
     },
   });
 }
 
 export function useExperience(slug: string) {
   return useQuery({
     queryKey: ["experience", slug],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("experiences")
         .select("*")
         .eq("slug", slug)
         .eq("is_active", true)
         .single();
 
       if (error) throw error;
       return data as Experience;
     },
     enabled: !!slug,
   });
 }
 
 export function useAllExperiences() {
   return useQuery({
     queryKey: ["admin", "experiences"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("experiences")
         .select("*")
         .order("display_order", { ascending: true });
 
       if (error) throw error;
       return (data || []) as Experience[];
     },
   });
 }