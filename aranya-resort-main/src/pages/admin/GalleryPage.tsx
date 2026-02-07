import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Image, Loader2 } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["Property", "Rooms", "Experiences", "Dining", "Weddings", "Events"];

interface GalleryImage {
  id: string;
  title: string;
  alt_text: string;
  category: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

interface FormData {
  title: string;
  alt_text: string;
  category: string;
  display_order: number;
  is_active: boolean;
}

export default function GalleryPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    alt_text: "",
    category: "Property",
    display_order: 0,
    is_active: true,
  });

  const { data: images, isLoading } = useQuery({
    queryKey: ["admin-gallery-images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as GalleryImage[];
    },
  });

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("gallery")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("gallery").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const createMutation = useMutation({
    mutationFn: async (data: FormData & { image_url: string }) => {
      const { error } = await supabase.from("gallery_images").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gallery-images"] });
      toast.success("Image added successfully");
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to add image: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<GalleryImage> & { id: string }) => {
      const { error } = await supabase
        .from("gallery_images")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gallery-images"] });
      toast.success("Image updated successfully");
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to update image: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gallery_images").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gallery-images"] });
      toast.success("Image deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete image: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      alt_text: "",
      category: "Property",
      display_order: 0,
      is_active: true,
    });
    setImageFile(null);
    setPreviewUrl(null);
    setEditingImage(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (image: GalleryImage) => {
    setEditingImage(image);
    setFormData({
      title: image.title,
      alt_text: image.alt_text,
      category: image.category,
      display_order: image.display_order,
      is_active: image.is_active,
    });
    setPreviewUrl(image.image_url);
    setIsDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      if (editingImage) {
        let updateData: Partial<GalleryImage> & { id: string } = {
          id: editingImage.id,
          ...formData,
        };

        if (imageFile) {
          const imageUrl = await uploadImage(imageFile);
          updateData.image_url = imageUrl;
        }

        await updateMutation.mutateAsync(updateData);
      } else {
        if (!imageFile) {
          toast.error("Please select an image");
          setUploading(false);
          return;
        }

        const imageUrl = await uploadImage(imageFile);
        await createMutation.mutateAsync({ ...formData, image_url: imageUrl });
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (image: GalleryImage) => {
    await updateMutation.mutateAsync({
      id: image.id,
      is_active: !image.is_active,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Gallery Management</h1>
          <p className="text-muted-foreground">
            Manage images displayed on the gallery page
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Image
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingImage ? "Edit Image" : "Add New Image"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image">Image</Label>
                <div className="flex flex-col gap-4">
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="h-40 w-full rounded-lg object-cover"
                    />
                  )}
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Image title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alt_text">Alt Text</Label>
                <Input
                  id="alt_text"
                  value={formData.alt_text}
                  onChange={(e) =>
                    setFormData({ ...formData, alt_text: e.target.value })
                  }
                  placeholder="Describe the image"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      display_order: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingImage ? "Update" : "Add"} Image
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : images && images.length > 0 ? (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {images.map((image) => (
                <TableRow key={image.id}>
                  <TableCell>
                    <img
                      src={image.image_url}
                      alt={image.alt_text}
                      className="h-12 w-16 rounded object-cover"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{image.title}</TableCell>
                  <TableCell>{image.category}</TableCell>
                  <TableCell>{image.display_order}</TableCell>
                  <TableCell>
                    <Switch
                      checked={image.is_active}
                      onCheckedChange={() => toggleActive(image)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(image)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Delete this image?")) {
                            deleteMutation.mutate(image.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <Image className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No images yet</h3>
          <p className="text-muted-foreground">Add images to display in the gallery</p>
        </div>
      )}
    </div>
  );
}
