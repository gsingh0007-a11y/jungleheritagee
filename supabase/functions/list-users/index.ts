import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client with the user's token to verify they're an admin
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the user is authenticated and is an admin
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is an admin using the is_admin function
    const { data: isAdmin, error: roleError } = await userClient.rpc("is_admin", {
      _user_id: user.id,
    });

    if (roleError || !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden - Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role client to list users
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Get pagination params from URL
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const perPage = parseInt(url.searchParams.get("per_page") || "50");

    // List users from auth.users
    const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers({
      page,
      perPage,
    });

    if (listError) {
      console.error("Error listing users:", listError);
      return new Response(JSON.stringify({ error: listError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user roles for all users
    const userIds = usersData.users.map((u) => u.id);
    const { data: roles } = await adminClient
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", userIds);

    // Map roles to users
    const rolesMap = new Map(roles?.map((r) => [r.user_id, r.role]) || []);

    // Get booking counts for users
    const { data: bookingCounts } = await adminClient
      .from("bookings")
      .select("user_id")
      .not("user_id", "is", null);

    const bookingCountMap = new Map<string, number>();
    bookingCounts?.forEach((b) => {
      if (b.user_id) {
        bookingCountMap.set(b.user_id, (bookingCountMap.get(b.user_id) || 0) + 1);
      }
    });

    // Format user data
    const users = usersData.users.map((u) => ({
      id: u.id,
      email: u.email,
      phone: u.phone,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      email_confirmed_at: u.email_confirmed_at,
      role: rolesMap.get(u.id) || "guest",
      booking_count: bookingCountMap.get(u.id) || 0,
      user_metadata: u.user_metadata,
    }));

    return new Response(
      JSON.stringify({
        users,
        total: usersData.users.length,
        page,
        per_page: perPage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
