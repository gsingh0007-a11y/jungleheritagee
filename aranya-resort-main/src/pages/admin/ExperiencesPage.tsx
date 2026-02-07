 import { useState } from "react";
 import { useQueryClient } from "@tanstack/react-query";
 import { Plus, Pencil, Trash2, GripVertical, Eye, EyeOff } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import { Switch } from "@/components/ui/switch";
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
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
 } from "@/components/ui/alert-dialog";
 import { toast } from "@/hooks/use-toast";
 import { supabase } from "@/integrations/supabase/client";
 import { useAllExperiences, Experience } from "@/hooks/useExperiences";
 import { Skeleton } from "@/components/ui/skeleton";
 
 interface ExperienceFormData {
   name: string;
   slug: string;
   subtitle: string;
   description: string;
   long_description: string;
   duration: string;
   best_time: string;
   image_url: string;
   highlights: string;
   is_active: boolean;
 }
 
 const initialFormData: ExperienceFormData = {
   name: "",
   slug: "",
   subtitle: "",
   description: "",
   long_description: "",
   duration: "",
   best_time: "",
   image_url: "",
   highlights: "",
   is_active: true,
 };
 
 export default function ExperiencesPage() {
   const { data: experiences, isLoading } = useAllExperiences();
   const queryClient = useQueryClient();
   const [dialogOpen, setDialogOpen] = useState(false);
   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
   const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
   const [formData, setFormData] = useState<ExperienceFormData>(initialFormData);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [imageFile, setImageFile] = useState<File | null>(null);
   const [imagePreview, setImagePreview] = useState<string | null>(null);
 
   const generateSlug = (name: string) => {
     return name
       .toLowerCase()
       .replace(/[^a-z0-9]+/g, "-")
       .replace(/(^-|-$)/g, "");
   };
 
   const handleNameChange = (name: string) => {
     setFormData((prev) => ({
       ...prev,
       name,
       slug: prev.slug === generateSlug(prev.name) || !prev.slug ? generateSlug(name) : prev.slug,
     }));
   };
 
   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
       setImageFile(file);
       const reader = new FileReader();
       reader.onloadend = () => {
         setImagePreview(reader.result as string);
       };
       reader.readAsDataURL(file);
     }
   };
 
   const uploadImage = async (file: File): Promise<string> => {
     const fileExt = file.name.split(".").pop();
     const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
     const filePath = `${fileName}`;
 
     const { error: uploadError } = await supabase.storage
       .from("experiences")
       .upload(filePath, file);
 
     if (uploadError) throw uploadError;
 
     const { data } = supabase.storage.from("experiences").getPublicUrl(filePath);
     return data.publicUrl;
   };
 
   const openAddDialog = () => {
     setSelectedExperience(null);
     setFormData(initialFormData);
     setImageFile(null);
     setImagePreview(null);
     setDialogOpen(true);
   };
 
   const openEditDialog = (experience: Experience) => {
     setSelectedExperience(experience);
     setFormData({
       name: experience.name,
       slug: experience.slug,
       subtitle: experience.subtitle || "",
       description: experience.description || "",
       long_description: experience.long_description || "",
       duration: experience.duration || "",
       best_time: experience.best_time || "",
       image_url: experience.image_url || "",
       highlights: (experience.highlights || []).join("\n"),
       is_active: experience.is_active,
     });
     setImageFile(null);
     setImagePreview(experience.image_url || null);
     setDialogOpen(true);
   };
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setIsSubmitting(true);
 
     try {
       let imageUrl = formData.image_url;
 
       if (imageFile) {
         imageUrl = await uploadImage(imageFile);
       }
 
       const highlightsArray = formData.highlights
         .split("\n")
         .map((h) => h.trim())
         .filter(Boolean);
 
       const experienceData = {
         name: formData.name,
         slug: formData.slug,
         subtitle: formData.subtitle || null,
         description: formData.description || null,
         long_description: formData.long_description || null,
         duration: formData.duration || null,
         best_time: formData.best_time || null,
         image_url: imageUrl || null,
         highlights: highlightsArray,
         is_active: formData.is_active,
       };
 
       if (selectedExperience) {
         const { error } = await supabase
           .from("experiences")
           .update(experienceData)
           .eq("id", selectedExperience.id);
 
         if (error) throw error;
         toast({ title: "Experience updated successfully" });
       } else {
         const { error } = await supabase.from("experiences").insert([experienceData]);
 
         if (error) throw error;
         toast({ title: "Experience created successfully" });
       }
 
       queryClient.invalidateQueries({ queryKey: ["admin", "experiences"] });
       queryClient.invalidateQueries({ queryKey: ["experiences"] });
       setDialogOpen(false);
     } catch (error: any) {
       toast({
         title: "Error",
         description: error.message,
         variant: "destructive",
       });
     } finally {
       setIsSubmitting(false);
     }
   };
 
   const handleDelete = async () => {
     if (!selectedExperience) return;
 
     try {
       const { error } = await supabase
         .from("experiences")
         .delete()
         .eq("id", selectedExperience.id);
 
       if (error) throw error;
 
       toast({ title: "Experience deleted successfully" });
       queryClient.invalidateQueries({ queryKey: ["admin", "experiences"] });
       queryClient.invalidateQueries({ queryKey: ["experiences"] });
       setDeleteDialogOpen(false);
       setSelectedExperience(null);
     } catch (error: any) {
       toast({
         title: "Error",
         description: error.message,
         variant: "destructive",
       });
     }
   };
 
   const toggleActive = async (experience: Experience) => {
     try {
       const { error } = await supabase
         .from("experiences")
         .update({ is_active: !experience.is_active })
         .eq("id", experience.id);
 
       if (error) throw error;
 
       toast({
         title: experience.is_active ? "Experience hidden" : "Experience visible",
       });
       queryClient.invalidateQueries({ queryKey: ["admin", "experiences"] });
       queryClient.invalidateQueries({ queryKey: ["experiences"] });
     } catch (error: any) {
       toast({
         title: "Error",
         description: error.message,
         variant: "destructive",
       });
     }
   };
 
   return (
     <div className="space-y-6">
       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
         <div>
           <h1 className="text-2xl md:text-3xl font-semibold text-foreground">Experiences</h1>
           <p className="text-muted-foreground mt-1">Manage guest experiences and activities</p>
         </div>
         <Button onClick={openAddDialog} className="w-full sm:w-auto">
           <Plus className="w-4 h-4 mr-2" />
           Add Experience
         </Button>
       </div>
 
       {isLoading ? (
         <div className="grid gap-4">
           {[1, 2, 3].map((i) => (
             <Skeleton key={i} className="h-24 w-full" />
           ))}
         </div>
       ) : experiences?.length === 0 ? (
         <Card>
           <CardContent className="flex flex-col items-center justify-center py-12">
             <p className="text-muted-foreground mb-4">No experiences added yet</p>
             <Button onClick={openAddDialog}>
               <Plus className="w-4 h-4 mr-2" />
               Add Your First Experience
             </Button>
           </CardContent>
         </Card>
       ) : (
         <div className="grid gap-4">
           {experiences?.map((experience) => (
             <Card key={experience.id} className="overflow-hidden">
               <div className="flex flex-col sm:flex-row">
                 {/* Image */}
                 <div className="sm:w-40 h-32 sm:h-auto flex-shrink-0">
                   {experience.image_url ? (
                     <img
                       src={experience.image_url}
                       alt={experience.name}
                       className="w-full h-full object-cover"
                     />
                   ) : (
                     <div className="w-full h-full bg-muted flex items-center justify-center">
                       <span className="text-muted-foreground text-xs">No Image</span>
                     </div>
                   )}
                 </div>
 
                 {/* Content */}
                 <div className="flex-1 p-4">
                   <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                     <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2 mb-1">
                         <h3 className="font-medium text-foreground truncate">{experience.name}</h3>
                         {!experience.is_active && (
                           <span className="text-xs bg-muted px-2 py-0.5 rounded">Hidden</span>
                         )}
                       </div>
                       {experience.subtitle && (
                         <p className="text-sm text-gold mb-2">{experience.subtitle}</p>
                       )}
                       <p className="text-sm text-muted-foreground line-clamp-2">
                         {experience.description || "No description"}
                       </p>
                       <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                         {experience.duration && <span>⏱ {experience.duration}</span>}
                         {experience.best_time && <span>📅 {experience.best_time}</span>}
                       </div>
                     </div>
 
                     {/* Actions */}
                     <div className="flex gap-2 flex-shrink-0">
                       <Button
                         variant="ghost"
                         size="icon"
                         onClick={() => toggleActive(experience)}
                         title={experience.is_active ? "Hide" : "Show"}
                       >
                         {experience.is_active ? (
                           <Eye className="w-4 h-4" />
                         ) : (
                           <EyeOff className="w-4 h-4" />
                         )}
                       </Button>
                       <Button
                         variant="ghost"
                         size="icon"
                         onClick={() => openEditDialog(experience)}
                       >
                         <Pencil className="w-4 h-4" />
                       </Button>
                       <Button
                         variant="ghost"
                         size="icon"
                         onClick={() => {
                           setSelectedExperience(experience);
                           setDeleteDialogOpen(true);
                         }}
                       >
                         <Trash2 className="w-4 h-4 text-destructive" />
                       </Button>
                     </div>
                   </div>
                 </div>
               </div>
             </Card>
           ))}
         </div>
       )}
 
       {/* Add/Edit Dialog */}
       <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
         <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
           <DialogHeader>
             <DialogTitle>
               {selectedExperience ? "Edit Experience" : "Add New Experience"}
             </DialogTitle>
             <DialogDescription>
               Fill in the details for this experience. Guests will see this on the website.
             </DialogDescription>
           </DialogHeader>
 
           <form onSubmit={handleSubmit} className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="name">Name *</Label>
                 <Input
                   id="name"
                   value={formData.name}
                   onChange={(e) => handleNameChange(e.target.value)}
                   placeholder="Jungle Safari"
                   required
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="slug">Slug *</Label>
                 <Input
                   id="slug"
                   value={formData.slug}
                   onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                   placeholder="jungle-safari"
                   required
                 />
               </div>
             </div>
 
             <div className="space-y-2">
               <Label htmlFor="subtitle">Subtitle / Category</Label>
               <Input
                 id="subtitle"
                 value={formData.subtitle}
                 onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                 placeholder="Wildlife Adventure"
               />
             </div>
 
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="duration">Duration</Label>
                 <Input
                   id="duration"
                   value={formData.duration}
                   onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                   placeholder="4-6 hours"
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="best_time">Best Time</Label>
                 <Input
                   id="best_time"
                   value={formData.best_time}
                   onChange={(e) => setFormData({ ...formData, best_time: e.target.value })}
                   placeholder="October - June"
                 />
               </div>
             </div>
 
             <div className="space-y-2">
               <Label htmlFor="description">Short Description</Label>
               <Textarea
                 id="description"
                 value={formData.description}
                 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                 placeholder="A brief description shown on the experiences page..."
                 rows={3}
               />
             </div>
 
             <div className="space-y-2">
               <Label htmlFor="long_description">Full Description</Label>
               <Textarea
                 id="long_description"
                 value={formData.long_description}
                 onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
                 placeholder="Detailed description for the experience detail page..."
                 rows={5}
               />
             </div>
 
             <div className="space-y-2">
               <Label htmlFor="highlights">Highlights (one per line)</Label>
               <Textarea
                 id="highlights"
                 value={formData.highlights}
                 onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
                 placeholder="Expert naturalist guides&#10;Morning and evening safaris&#10;Chance to spot tigers and rhinos"
                 rows={4}
               />
             </div>
 
             <div className="space-y-2">
               <Label htmlFor="image">Cover Image</Label>
               <Input
                 id="image"
                 type="file"
                 accept="image/*"
                 onChange={handleImageChange}
               />
               {imagePreview && (
                 <div className="mt-2 relative w-full h-40 rounded-lg overflow-hidden">
                   <img
                     src={imagePreview}
                     alt="Preview"
                     className="w-full h-full object-cover"
                   />
                 </div>
               )}
             </div>
 
             <div className="flex items-center gap-2">
               <Switch
                 id="is_active"
                 checked={formData.is_active}
                 onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
               />
               <Label htmlFor="is_active">Visible on website</Label>
             </div>
 
             <DialogFooter>
               <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                 Cancel
               </Button>
               <Button type="submit" disabled={isSubmitting}>
                 {isSubmitting ? "Saving..." : selectedExperience ? "Update" : "Create"}
               </Button>
             </DialogFooter>
           </form>
         </DialogContent>
       </Dialog>
 
       {/* Delete Confirmation Dialog */}
       <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Delete Experience</AlertDialogTitle>
             <AlertDialogDescription>
               Are you sure you want to delete "{selectedExperience?.name}"? This action cannot be
               undone.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Cancel</AlertDialogCancel>
             <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
               Delete
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     </div>
   );
 }