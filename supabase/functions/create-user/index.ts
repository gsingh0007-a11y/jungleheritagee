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

        // Parse request body
        const { email, password, fullName, role } = await req.json();

        if (!email || !password || !fullName) {
            return new Response(JSON.stringify({ error: "Email, password, and name are required" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Use service role client to create the user
        const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { persistSession: false },
        });

        // Create the user
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
            email,
            password,
            user_metadata: { full_name: fullName },
            email_confirm: true,
        });

        if (createError) {
            return new Response(JSON.stringify({ error: createError.message }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Assign the role
        if (newUser.user) {
            const { error: roleAssignmentError } = await adminClient
                .from("user_roles")
                .insert({
                    user_id: newUser.user.id,
                    role: role || "staff", // Default to staff
                });

            if (roleAssignmentError) {
                // Rollback user creation if role assignment fails? 
                // For now, return error but user remains created (can be assigned role manually)
                console.error("Error assigning role:", roleAssignmentError);
                return new Response(JSON.stringify({
                    user: newUser.user,
                    warning: "User created but role assignment failed: " + roleAssignmentError.message
                }), {
                    status: 200, // Partial success
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }
        }

        return new Response(
            JSON.stringify({
                user: newUser.user,
                message: "User created successfully",
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
