import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, ToggleLeft, ToggleRight, Users, IndianRupee, X, Upload, Loader2, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";

interface RoomCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  max_adults: number;
  max_children: number;
  base_occupancy: number;
  base_price_per_night: number;
  extra_adult_price: number;
  extra_child_price: number;
  total_rooms: number;
  is_active: boolean;
  display_order: number | null;
  images: Json;
}

interface RoomFormData {
  name: string;
  slug: string;
  description: string;
  max_adults: number;
  max_children: number;
  base_occupancy: number;
  base_price_per_night: number;
  extra_adult_price: number;
  extra_child_price: number;
  total_rooms: number;
  is_active: boolean;
  images: string[];
}

const defaultFormData: RoomFormData = {
  name: "",
  slug: "",
  description: "",
  max_adults: 2,
  max_children: 1,
  base_occupancy: 2,
  base_price_per_night: 5000,
  extra_adult_price: 1000,
  extra_child_price: 500,
  total_rooms: 1,
  is_active: true,
  images: [],
};

export default function RoomsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomCategory | null>(null);
  const [formData, setFormData] = useState<RoomFormData>(defaultFormData);
  const [uploading, setUploading] = useState(false);

  const { data: rooms, isLoading } = useQuery({
    queryKey: ["admin", "rooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("room_categories")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as RoomCategory[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: RoomFormData & { id?: string }) => {
      const { id, ...rest } = data;
      if (id) {
        const { error } = await supabase
          .from("room_categories")
          .update(rest)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("room_categories")
          .insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "rooms"] });
      setDialogOpen(false);
      setEditingRoom(null);
      setFormData(defaultFormData);
      toast({ title: "Room saved successfully" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("room_categories")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "rooms"] });
      toast({ title: "Status updated" });
    },
  });

  const handleEdit = (room: RoomCategory) => {
    setEditingRoom(room);
    const images = Array.isArray(room.images) ? (room.images as string[]) : [];
    setFormData({
      name: room.name,
      slug: room.slug,
      description: room.description || "",
      max_adults: room.max_adults,
      max_children: room.max_children,
      base_occupancy: room.base_occupancy,
      base_price_per_night: room.base_price_per_night,
      extra_adult_price: room.extra_adult_price,
      extra_child_price: room.extra_child_price,
      total_rooms: room.total_rooms,
      is_active: room.is_active,
      images,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ ...formData, id: editingRoom?.id });
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("rooms")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("rooms").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadImage(files[i]);
        uploadedUrls.push(url);
      }
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));
      toast({ title: `${uploadedUrls.length} image(s) uploaded` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload failed", description: error.message });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-medium">Room Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage room types and pricing</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingRoom(null);
            setFormData(defaultFormData);
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Room
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRoom ? "Edit Room" : "Add New Room"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Room Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ 
                        ...formData, 
                        name: e.target.value,
                        slug: editingRoom ? formData.slug : generateSlug(e.target.value)
                      });
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Image Upload Section */}
              <div className="space-y-3">
                <Label>Room Images</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {formData.images.map((url, index) => (
                    <div key={index} className="relative group aspect-video">
                      <img
                        src={url}
                        alt={`Room ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      {index === 0 && (
                        <span className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded">
                          Cover
                        </span>
                      )}
                    </div>
                  ))}
                  <label className="aspect-video flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                    {uploading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground mt-1">Upload</span>
                      </>
                    )}
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  First image will be used as cover. You can upload multiple images.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="max_adults">Max Adults</Label>
                  <Input
                    id="max_adults"
                    type="number"
                    min={1}
                    value={formData.max_adults}
                    onChange={(e) => setFormData({ ...formData, max_adults: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_children">Max Children</Label>
                  <Input
                    id="max_children"
                    type="number"
                    min={0}
                    value={formData.max_children}
                    onChange={(e) => setFormData({ ...formData, max_children: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="base_occupancy">Base Occupancy</Label>
                  <Input
                    id="base_occupancy"
                    type="number"
                    min={1}
                    value={formData.base_occupancy}
                    onChange={(e) => setFormData({ ...formData, base_occupancy: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="base_price">Base Price/Night (₹)</Label>
                  <Input
                    id="base_price"
                    type="number"
                    min={0}
                    value={formData.base_price_per_night}
                    onChange={(e) => setFormData({ ...formData, base_price_per_night: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="extra_adult">Extra Adult (₹)</Label>
                  <Input
                    id="extra_adult"
                    type="number"
                    min={0}
                    value={formData.extra_adult_price}
                    onChange={(e) => setFormData({ ...formData, extra_adult_price: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="extra_child">Extra Child (₹)</Label>
                  <Input
                    id="extra_child"
                    type="number"
                    min={0}
                    value={formData.extra_child_price}
                    onChange={(e) => setFormData({ ...formData, extra_child_price: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="total_rooms">Total Rooms</Label>
                  <Input
                    id="total_rooms"
                    type="number"
                    min={1}
                    value={formData.total_rooms}
                    onChange={(e) => setFormData({ ...formData, total_rooms: parseInt(e.target.value) })}
                  />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <Label>Active</Label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending || uploading}>
                  {saveMutation.isPending ? "Saving..." : "Save Room"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Room Name</TableHead>
              <TableHead className="text-center">Capacity</TableHead>
              <TableHead className="text-center">Total Rooms</TableHead>
              <TableHead className="text-right">Base Price</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : rooms?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No room categories found. Add your first room category.
                </TableCell>
              </TableRow>
            ) : (
              rooms?.map((room) => {
                const images = Array.isArray(room.images) ? (room.images as string[]) : [];
                const coverImage = images[0];
                return (
                  <TableRow key={room.id}>
                    <TableCell>
                      {coverImage ? (
                        <img
                          src={coverImage}
                          alt={room.name}
                          className="h-10 w-14 object-cover rounded"
                        />
                      ) : (
                        <div className="h-10 w-14 bg-muted rounded flex items-center justify-center">
                          <Image className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{room.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{room.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 text-sm">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        {room.max_adults}A / {room.max_children}C
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium">{room.total_rooms}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <IndianRupee className="h-3.5 w-3.5" />
                        {Number(room.base_price_per_night).toLocaleString("en-IN")}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={room.is_active ? "default" : "secondary"}>
                        {room.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(room)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleStatusMutation.mutate({
                            id: room.id,
                            is_active: !room.is_active
                          })}
                        >
                          {room.is_active ? (
                            <ToggleRight className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
