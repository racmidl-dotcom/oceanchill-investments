import type {} from "../deno.d.ts";
// MoneyFusion - Vérification du statut + crédit auto fallback (au retour callback)
// @ts-expect-error Deno resolves this URL import at runtime.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, service);

    const { token } = await req.json();
    if (!token) throw new Error("token requis");

    const r = await fetch(
      `https://www.pay.moneyfusion.net/paiementNotif/${token}`,
    );
    const data = await r.json();

    const statut = data?.data?.statut;
    const { data: deposit } = await admin
      .from("deposits")
      .select("*")
      .eq("reference", token)
      .maybeSingle();

    if (deposit && deposit.status === "pending" && statut === "paid") {
      const { data: u } = await admin
        .from("users")
        .select("balance")
        .eq("id", deposit.user_id)
        .maybeSingle();
      const newBalance = Number(u?.balance ?? 0) + Number(deposit.amount);
      await admin
        .from("users")
        .update({ balance: newBalance })
        .eq("id", deposit.user_id);
      await admin
        .from("deposits")
        .update({ status: "confirmed" })
        .eq("id", deposit.id);
    } else if (
      deposit &&
      deposit.status === "pending" &&
      (statut === "failure" || statut === "no paid")
    ) {
      await admin
        .from("deposits")
        .update({ status: "rejected" })
        .eq("id", deposit.id);
    }

    return new Response(JSON.stringify({ statut, data: data?.data ?? null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
