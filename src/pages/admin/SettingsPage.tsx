import { useQuery } from "@tanstack/react-query";
import { Settings, Building2, Percent, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export default function SettingsPage() {
  const { data: taxes, isLoading: taxesLoading } = useQuery({
    queryKey: ["admin", "taxes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tax_config").select("*");
      if (error) throw error;
      return data;
    },
  });

  const activeTax = taxes?.find((t) => t.is_active);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-medium">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          System configuration and preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Resort Info */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[hsl(var(--gold))]" />
              Resort Information
            </CardTitle>
            <CardDescription>Basic resort details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Resort Name</p>
              <p className="font-medium">Aranya Forest Resort</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Location</p>
              <p className="font-medium">Maharashtra, India</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Contact</p>
              <p className="font-medium">+91 98765 43210</p>
              <p className="text-sm text-muted-foreground">contact@aranyaresort.com</p>
            </div>
          </CardContent>
        </Card>

        {/* Tax Settings */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <Percent className="h-5 w-5 text-[hsl(var(--gold))]" />
              Tax Configuration
            </CardTitle>
            <CardDescription>Active tax rates applied to bookings</CardDescription>
          </CardHeader>
          <CardContent>
            {taxesLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : activeTax ? (
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{activeTax.name}</p>
                    <p className="text-2xl font-bold text-[hsl(var(--gold))]">
                      {activeTax.percentage}%
                    </p>
                  </div>
                  <Badge>Active</Badge>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No active tax configured</p>
            )}
            <p className="text-xs text-muted-foreground mt-3">
              Configure taxes in the Pricing section
            </p>
          </CardContent>
        </Card>

        {/* Future Features */}
        <Card className="border-0 shadow-sm md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <Info className="h-5 w-5 text-[hsl(var(--gold))]" />
              Coming Soon
            </CardTitle>
            <CardDescription>Features planned for future updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Email Notifications", desc: "Automated booking emails" },
                { title: "WhatsApp Integration", desc: "Send updates via WhatsApp" },
                { title: "Payment Tracking", desc: "Track payments and deposits" },
                { title: "Invoice Generation", desc: "Auto-generate GST invoices" },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="p-4 rounded-lg border border-dashed border-border"
                >
                  <p className="font-medium text-sm">{feature.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{feature.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
