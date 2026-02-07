import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus, Edit, Trash2, Calendar, Percent, DollarSign, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { SeasonType } from "@/types/booking";

// Seasons
interface Season {
  id: string;
  name: string;
  season_type: SeasonType;
  start_date: string;
  end_date: string;
  price_multiplier: number;
  is_active: boolean;
}

// Taxes
interface TaxConfig {
  id: string;
  name: string;
  percentage: number;
  is_active: boolean;
}

// Meal Plans
interface MealPlan {
  id: string;
  meal_plan: string;
  name: string;
  adult_price: number;
  child_price: number;
  is_active: boolean;
}

const seasonTypes: { value: SeasonType; label: string }[] = [
  { value: "peak", label: "Peak Season" },
  { value: "regular", label: "Regular Season" },
  { value: "off_peak", label: "Off-Peak Season" },
];

export default function PricingPage() {
  const queryClient = useQueryClient();
  const [seasonDialogOpen, setSeasonDialogOpen] = useState(false);
  const [taxDialogOpen, setTaxDialogOpen] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [editingTax, setEditingTax] = useState<TaxConfig | null>(null);

  // Form states
  const [seasonForm, setSeasonForm] = useState({
    name: "",
    season_type: "regular" as SeasonType,
    start_date: undefined as Date | undefined,
    end_date: undefined as Date | undefined,
    price_multiplier: 1.0,
    is_active: true,
  });

  const [taxForm, setTaxForm] = useState({
    name: "",
    percentage: 18,
    is_active: true,
  });

  // Queries
  const { data: seasons, isLoading: seasonsLoading } = useQuery({
    queryKey: ["admin", "seasons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("seasons").select("*").order("start_date");
      if (error) throw error;
      return data as Season[];
    },
  });

  const { data: taxes, isLoading: taxesLoading } = useQuery({
    queryKey: ["admin", "taxes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tax_config").select("*");
      if (error) throw error;
      return data as TaxConfig[];
    },
  });

  const { data: mealPlans, isLoading: mealPlansLoading } = useQuery({
    queryKey: ["admin", "mealPlans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("meal_plan_prices").select("*");
      if (error) throw error;
      return data as MealPlan[];
    },
  });

  // Meal Plan mutations
  const saveMealPlanMutation = useMutation({
    mutationFn: async (data: typeof mealPlanForm & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase.from("meal_plan_prices").update(data).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("meal_plan_prices").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "mealPlans"] });
      setMealPlanDialogOpen(false);
      setEditingMealPlan(null);
      resetMealPlanForm();
      toast({ title: "Meal plan saved" });
    },
    onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.message }),
  });

  const deleteMealPlanMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("meal_plan_prices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "mealPlans"] });
      toast({ title: "Meal plan deleted" });
    },
  });

  const [mealPlanDialogOpen, setMealPlanDialogOpen] = useState(false);
  const [editingMealPlan, setEditingMealPlan] = useState<MealPlan | null>(null);
  const [mealPlanForm, setMealPlanForm] = useState({
    meal_plan: "EP",
    name: "",
    adult_price: 0,
    child_price: 0,
    is_active: true,
  });

  const resetMealPlanForm = () => {
    setMealPlanForm({
      meal_plan: "EP",
      name: "",
      adult_price: 0,
      child_price: 0,
      is_active: true,
    });
  };

  const handleEditMealPlan = (plan: MealPlan) => {
    setEditingMealPlan(plan);
    setMealPlanForm({
      meal_plan: plan.meal_plan,
      name: plan.name,
      adult_price: plan.adult_price,
      child_price: plan.child_price,
      is_active: plan.is_active,
    });
    setMealPlanDialogOpen(true);
  };

  // Season mutations
  const saveSeasonMutation = useMutation({
    mutationFn: async (data: typeof seasonForm & { id?: string }) => {
      const payload = {
        ...data,
        start_date: data.start_date?.toISOString().split("T")[0],
        end_date: data.end_date?.toISOString().split("T")[0],
      };
      if (data.id) {
        const { error } = await supabase.from("seasons").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("seasons").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "seasons"] });
      setSeasonDialogOpen(false);
      setEditingSeason(null);
      resetSeasonForm();
      toast({ title: "Season saved" });
    },
    onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.message }),
  });

  const deleteSeasonMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("seasons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "seasons"] });
      toast({ title: "Season deleted" });
    },
  });

  // Tax mutations
  const saveTaxMutation = useMutation({
    mutationFn: async (data: typeof taxForm & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase.from("tax_config").update(data).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tax_config").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "taxes"] });
      setTaxDialogOpen(false);
      setEditingTax(null);
      setTaxForm({ name: "", percentage: 18, is_active: true });
      toast({ title: "Tax saved" });
    },
    onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.message }),
  });

  const resetSeasonForm = () => {
    setSeasonForm({
      name: "",
      season_type: "regular",
      start_date: undefined,
      end_date: undefined,
      price_multiplier: 1.0,
      is_active: true,
    });
  };

  const handleEditSeason = (season: Season) => {
    setEditingSeason(season);
    setSeasonForm({
      name: season.name,
      season_type: season.season_type,
      start_date: new Date(season.start_date),
      end_date: new Date(season.end_date),
      price_multiplier: season.price_multiplier,
      is_active: season.is_active,
    });
    setSeasonDialogOpen(true);
  };

  const handleEditTax = (tax: TaxConfig) => {
    setEditingTax(tax);
    setTaxForm({
      name: tax.name,
      percentage: tax.percentage,
      is_active: tax.is_active,
    });
    setTaxDialogOpen(true);
  };

  const validateSeasonForm = () => {
    if (!seasonForm.name) return "Name is required";
    if (!seasonForm.start_date) return "Start date is required";
    if (!seasonForm.end_date) return "End date is required";
    if (seasonForm.end_date < seasonForm.start_date) return "End date must be after start date";
    return null;
  };

  const handleSeasonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateSeasonForm();
    if (error) {
      toast({ variant: "destructive", title: "Validation Error", description: error });
      return;
    }
    saveSeasonMutation.mutate({ ...seasonForm, id: editingSeason?.id });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-medium">Pricing & Seasons</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage seasonal pricing, taxes, and meal plans</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Seasons */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[hsl(var(--gold))]" />
              Seasonal Pricing
            </CardTitle>
            <Dialog open={seasonDialogOpen} onOpenChange={(open) => {
              setSeasonDialogOpen(open);
              if (!open) { setEditingSeason(null); resetSeasonForm(); }
            }}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingSeason ? "Edit Season" : "Add Season"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSeasonSubmit} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={seasonForm.name} onChange={(e) => setSeasonForm({ ...seasonForm, name: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={seasonForm.season_type} onValueChange={(v) => setSeasonForm({ ...seasonForm, season_type: v as SeasonType })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-popover">
                        {seasonTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !seasonForm.start_date && "text-muted-foreground")}>
                            {seasonForm.start_date ? format(seasonForm.start_date, "MMM dd, yyyy") : "Pick date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-popover">
                          <CalendarComponent mode="single" selected={seasonForm.start_date} onSelect={(d) => setSeasonForm({ ...seasonForm, start_date: d })} className="pointer-events-auto" />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !seasonForm.end_date && "text-muted-foreground")}>
                            {seasonForm.end_date ? format(seasonForm.end_date, "MMM dd, yyyy") : "Pick date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-popover">
                          <CalendarComponent mode="single" selected={seasonForm.end_date} onSelect={(d) => setSeasonForm({ ...seasonForm, end_date: d })} className="pointer-events-auto" />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Price Multiplier</Label>
                    <Input type="number" step="0.01" min="0.5" max="3" value={seasonForm.price_multiplier} onChange={(e) => setSeasonForm({ ...seasonForm, price_multiplier: parseFloat(e.target.value) })} />
                    <p className="text-xs text-muted-foreground">1.0 = normal, 1.25 = 25% increase, 0.8 = 20% discount</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={seasonForm.is_active} onCheckedChange={(c) => setSeasonForm({ ...seasonForm, is_active: c })} />
                    <Label>Active</Label>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setSeasonDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={saveSeasonMutation.isPending}>Save</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {seasonsLoading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : seasons?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No seasons configured</p>
            ) : (
              <div className="space-y-2">
                {seasons?.map((season) => (
                  <div key={season.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="font-medium text-sm">{season.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(season.start_date), "MMM dd")} - {format(new Date(season.end_date), "MMM dd, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={season.is_active ? "default" : "secondary"}>×{season.price_multiplier}</Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditSeason(season)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Season</AlertDialogTitle>
                            <AlertDialogDescription>Are you sure? This cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteSeasonMutation.mutate(season.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Taxes */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <Percent className="h-5 w-5 text-[hsl(var(--gold))]" />
              Tax Configuration
            </CardTitle>
            <Dialog open={taxDialogOpen} onOpenChange={(open) => {
              setTaxDialogOpen(open);
              if (!open) { setEditingTax(null); setTaxForm({ name: "", percentage: 18, is_active: true }); }
            }}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingTax ? "Edit Tax" : "Add Tax"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); saveTaxMutation.mutate({ ...taxForm, id: editingTax?.id }); }} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Tax Name</Label>
                    <Input value={taxForm.name} onChange={(e) => setTaxForm({ ...taxForm, name: e.target.value })} placeholder="e.g., GST" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Percentage (%)</Label>
                    <Input type="number" step="0.01" min="0" max="100" value={taxForm.percentage} onChange={(e) => setTaxForm({ ...taxForm, percentage: parseFloat(e.target.value) })} />
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={taxForm.is_active} onCheckedChange={(c) => setTaxForm({ ...taxForm, is_active: c })} />
                    <Label>Active</Label>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setTaxDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={saveTaxMutation.isPending}>Save</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {taxesLoading ? (
              <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : taxes?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No taxes configured</p>
            ) : (
              <div className="space-y-2">
                {taxes?.map((tax) => (
                  <div key={tax.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="font-medium text-sm">{tax.name}</p>
                      <p className="text-xs text-muted-foreground">{tax.percentage}%</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={tax.is_active ? "default" : "secondary"}>
                        {tax.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditTax(tax)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Meal Plans */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg font-serif flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-[hsl(var(--gold))]" />
            Meal Plan Pricing
          </CardTitle>
          <Dialog open={mealPlanDialogOpen} onOpenChange={(open) => {
            setMealPlanDialogOpen(open);
            if (!open) { setEditingMealPlan(null); resetMealPlanForm(); }
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingMealPlan ? "Edit Meal Plan" : "Add Meal Plan"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); saveMealPlanMutation.mutate({ ...mealPlanForm, id: editingMealPlan?.id }); }} className="space-y-4 py-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Plan Code</Label>
                    <Select value={mealPlanForm.meal_plan} onValueChange={(v) => setMealPlanForm({ ...mealPlanForm, meal_plan: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="EP">EP</SelectItem>
                        <SelectItem value="CP">CP</SelectItem>
                        <SelectItem value="MAP">MAP</SelectItem>
                        <SelectItem value="AP">AP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={mealPlanForm.name} onChange={(e) => setMealPlanForm({ ...mealPlanForm, name: e.target.value })} placeholder="e.g. European Plan" required />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Adult Price</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input type="number" className="pl-8" min="0" value={mealPlanForm.adult_price} onChange={(e) => setMealPlanForm({ ...mealPlanForm, adult_price: parseFloat(e.target.value) })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Child Price</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input type="number" className="pl-8" min="0" value={mealPlanForm.child_price} onChange={(e) => setMealPlanForm({ ...mealPlanForm, child_price: parseFloat(e.target.value) })} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={mealPlanForm.is_active} onCheckedChange={(c) => setMealPlanForm({ ...mealPlanForm, is_active: c })} />
                  <Label>Active</Label>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setMealPlanDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={saveMealPlanMutation.isPending}>Save</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {mealPlansLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Plan</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Adult Price</TableHead>
                  <TableHead className="text-right">Child Price</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mealPlans?.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.meal_plan}</TableCell>
                    <TableCell className="text-muted-foreground">{plan.name}</TableCell>
                    <TableCell className="text-right">₹{Number(plan.adult_price).toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right">₹{Number(plan.child_price).toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={plan.is_active ? "default" : "secondary"}>
                        {plan.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditMealPlan(plan)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Meal Plan</AlertDialogTitle>
                              <AlertDialogDescription>Are you sure? This cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMealPlanMutation.mutate(plan.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
