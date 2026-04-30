import type {} from "../deno.d.ts";
// MoneyFusion - Création d'une session de paiement (PayIn)
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
    const apiUrl = Deno.env.get("MONEYFUSION_API_URL");
    if (!apiUrl) throw new Error("MONEYFUSION_API_URL non configurée");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const amount = Number(body.amount);
    if (!amount || amount < 200) {
      return new Response(
        JSON.stringify({ error: "Montant invalide (min 200)" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const admin = createClient(supabaseUrl, service);
    const { data: profile } = await admin
      .from("users")
      .select("phone")
      .eq("id", user.id)
      .maybeSingle();

    // Pré-création du dépôt en pending (sans token, on l'updatera)
    const { data: deposit, error: depErr } = await admin
      .from("deposits")
      .insert({
        user_id: user.id,
        amount,
        channel: "moneyfusion",
        status: "pending",
        reference: `MF-${Date.now()}`,
      })
      .select()
      .single();
    if (depErr) throw depErr;

    const origin = req.headers.get("origin") ?? "https://whirlpool.app";
    const projectRef = supabaseUrl.replace("https://", "").split(".")[0];
    const webhookUrl = `https://${projectRef}.supabase.co/functions/v1/moneyfusion-webhook`;

    const payload = {
      totalPrice: amount,
      article: [{ "Recharge compte Whirpol": amount }],
      personal_Info: [{ userId: user.id, depositId: deposit.id }],
      numeroSend: profile?.phone ?? "00000000",
      nomclient: profile?.phone ?? "Client",
      return_url: `${origin}/history`,
      webhook_url: webhookUrl,
    };

    const mfRes = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const mfData = await mfRes.json();

    if (!mfRes.ok || !mfData?.statut) {
      await admin
        .from("deposits")
        .update({ status: "rejected" })
        .eq("id", deposit.id);
      return new Response(
        JSON.stringify({ error: mfData?.message ?? "Erreur MoneyFusion" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Stocke le token MoneyFusion dans la référence pour matcher au webhook
    await admin
      .from("deposits")
      .update({ reference: mfData.token })
      .eq("id", deposit.id);

    return new Response(
      JSON.stringify({
        url: mfData.url,
        token: mfData.token,
        depositId: deposit.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("create-payment error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
