import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Star, GripVertical } from "lucide-react";

interface Review {
  id: string;
  reviewer_name: string;
  reviewer_location: string | null;
  occasion: string | null;
  rating: number;
  review_text: string;
  source: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

const ReviewsPage = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [formData, setFormData] = useState({
    reviewer_name: "",
    reviewer_location: "",
    occasion: "",
    rating: 5,
    review_text: "",
    source: "google",
    is_active: true,
  });

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as Review[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("reviews").insert({
        ...data,
        display_order: reviews?.length || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Review added successfully");
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to add review: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from("reviews").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Review updated successfully");
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to update review: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Review deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete review: " + error.message);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("reviews").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
  });

  const resetForm = () => {
    setFormData({
      reviewer_name: "",
      reviewer_location: "",
      occasion: "",
      rating: 5,
      review_text: "",
      source: "google",
      is_active: true,
    });
    setEditingReview(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (review: Review) => {
    setEditingReview(review);
    setFormData({
      reviewer_name: review.reviewer_name,
      reviewer_location: review.reviewer_location || "",
      occasion: review.occasion || "",
      rating: review.rating,
      review_text: review.review_text,
      source: review.source || "google",
      is_active: review.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingReview) {
      updateMutation.mutate({ id: editingReview.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Reviews</h1>
          <p className="text-muted-foreground mt-1">
            Manage guest reviews displayed on the homepage
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Review
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingReview ? "Edit Review" : "Add New Review"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reviewer_name">Reviewer Name *</Label>
                  <Input
                    id="reviewer_name"
                    value={formData.reviewer_name}
                    onChange={(e) =>
                      setFormData({ ...formData, reviewer_name: e.target.value })
                    }
                    required
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reviewer_location">Location</Label>
                  <Input
                    id="reviewer_location"
                    value={formData.reviewer_location}
                    onChange={(e) =>
                      setFormData({ ...formData, reviewer_location: e.target.value })
                    }
                    placeholder="New Delhi"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="occasion">Occasion</Label>
                  <Input
                    id="occasion"
                    value={formData.occasion}
                    onChange={(e) =>
                      setFormData({ ...formData, occasion: e.target.value })
                    }
                    placeholder="Anniversary, Family Trip, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rating">Rating</Label>
                  <Select
                    value={formData.rating.toString()}
                    onValueChange={(v) =>
                      setFormData({ ...formData, rating: parseInt(v) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 4, 3, 2, 1].map((r) => (
                        <SelectItem key={r} value={r.toString()}>
                          {r} Star{r !== 1 ? "s" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="review_text">Review Text *</Label>
                <Textarea
                  id="review_text"
                  value={formData.review_text}
                  onChange={(e) =>
                    setFormData({ ...formData, review_text: e.target.value })
                  }
                  required
                  rows={4}
                  placeholder="Paste the review text from Google..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Select
                    value={formData.source}
                    onValueChange={(v) => setFormData({ ...formData, source: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">Google</SelectItem>
                      <SelectItem value="tripadvisor">TripAdvisor</SelectItem>
                      <SelectItem value="booking">Booking.com</SelectItem>
                      <SelectItem value="direct">Direct</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <Label htmlFor="is_active">Show on website</Label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingReview ? "Update" : "Add"} Review
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reviews?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No reviews yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Add your Google reviews to display them on the homepage
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Review
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews?.map((review) => (
            <Card
              key={review.id}
              className={!review.is_active ? "opacity-60" : ""}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-forest flex items-center justify-center text-ivory font-medium shrink-0">
                    {getInitials(review.reviewer_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-foreground">
                        {review.reviewer_name}
                      </h3>
                      <div className="flex items-center gap-0.5">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star
                            key={i}
                            className="w-4 h-4 fill-gold text-gold"
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground capitalize px-2 py-0.5 bg-muted rounded">
                        {review.source}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {[review.reviewer_location, review.occasion]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>
                    <p className="text-foreground line-clamp-2">
                      "{review.review_text}"
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={review.is_active}
                      onCheckedChange={(checked) =>
                        toggleActiveMutation.mutate({
                          id: review.id,
                          is_active: checked,
                        })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(review)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm("Delete this review?")) {
                          deleteMutation.mutate(review.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewsPage;
