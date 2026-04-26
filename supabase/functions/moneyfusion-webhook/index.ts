// MoneyFusion - Webhook + crédit automatique du solde
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, service);

    const payload = await req.json();
    console.log("MoneyFusion webhook:", JSON.stringify(payload));

    const event: string = payload.event ?? "";
    const tokenPay: string = payload.tokenPay ?? "";
    const personalInfo = Array.isArray(payload.personal_Info) ? payload.personal_Info[0] : null;
    const depositId: string | undefined = personalInfo?.depositId;
    const amount = Number(payload.Montant ?? 0);

    if (!tokenPay && !depositId) {
      return new Response(JSON.stringify({ ok: false, reason: "missing identifiers" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Recherche du dépôt
    let depQuery = admin.from("deposits").select("*").limit(1);
    depQuery = depositId ? depQuery.eq("id", depositId) : depQuery.eq("reference", tokenPay);
    const { data: deposit } = await depQuery.maybeSingle();

    if (!deposit) {
      return new Response(JSON.stringify({ ok: false, reason: "deposit not found" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotence : ne rien faire si déjà confirmé/rejeté
    if (deposit.status === "confirmed" || deposit.status === "rejected") {
      return new Response(JSON.stringify({ ok: true, idempotent: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (event === "payin.session.completed") {
      // Crédit du solde et passage en confirmed
      const { data: u } = await admin.from("users").select("balance").eq("id", deposit.user_id).maybeSingle();
      const newBalance = Number(u?.balance ?? 0) + Number(deposit.amount);
      await admin.from("users").update({ balance: newBalance }).eq("id", deposit.user_id);
      await admin.from("deposits").update({ status: "confirmed" }).eq("id", deposit.id);
      console.log(`Deposit ${deposit.id} confirmed (+${deposit.amount}) for user ${deposit.user_id}`);
    } else if (event === "payin.session.cancelled") {
      await admin.from("deposits").update({ status: "rejected" }).eq("id", deposit.id);
    }
    // pending => on laisse en pending

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("webhook error", e);
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
