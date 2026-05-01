import type {} from "../deno.d.ts";
// @ts-expect-error Deno resolves this URL import at runtime.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, service);

    const payload = await req.json();
    console.log("Webhook reçu:", JSON.stringify(payload));

    const event: string = payload.event ?? "";
    const tokenPay: string = payload.tokenPay ?? "";
    const personalInfo = Array.isArray(payload.personal_Info)
      ? payload.personal_Info[0]
      : null;
    const depositId: string | undefined = personalInfo?.depositId;

    if (!tokenPay && !depositId) {
      return new Response(
        JSON.stringify({ ok: false, reason: "missing identifiers" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Trouver le dépôt
    let depQuery = admin.from("deposits").select("*").limit(1);
    depQuery = depositId
      ? depQuery.eq("id", depositId)
      : depQuery.eq("reference", tokenPay);

    const { data: deposit } = await depQuery.maybeSingle();

    if (!deposit) {
      return new Response(
        JSON.stringify({ ok: false, reason: "deposit not found" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // IDEMPOTENCE STRICTE - ne rien faire si déjà traité
    if (deposit.status === "confirmed" || deposit.status === "rejected") {
      console.log(`Dépôt ${deposit.id} déjà traité: ${deposit.status}`);
      return new Response(JSON.stringify({ ok: true, idempotent: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (event === "payin.session.completed") {
      // 1. Marquer EN COURS immédiatement pour éviter
      //    les doubles traitements (race condition)
      const { error: lockError } = await admin
        .from("deposits")
        .update({ status: "processing" })
        .eq("id", deposit.id)
        .eq("status", "pending");

      if (lockError) {
        console.log("Dépôt déjà en cours de traitement");
        return new Response(JSON.stringify({ ok: true, locked: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 2. Créditer le solde de l'utilisateur
      const { data: userData } = await admin
        .from("users")
        .select("balance, referred_by")
        .eq("id", deposit.user_id)
        .maybeSingle();

      const newBalance =
        Number(userData?.balance ?? 0) + Number(deposit.amount);

      await admin
        .from("users")
        .update({ balance: newBalance })
        .eq("id", deposit.user_id);

      // 3. Confirmer le dépôt
      await admin
        .from("deposits")
        .update({ status: "confirmed" })
        .eq("id", deposit.id);

      console.log(
        `✅ Dépôt ${deposit.id} confirmé 
                   +${deposit.amount} → user ${deposit.user_id}`,
      );

      // 4. Distribuer les commissions sur 3 niveaux
      //    SEULEMENT si pas déjà distribuées pour ce dépôt
      const RATES: Record<number, number> = {
        1: 0.15,
        2: 0.03,
        3: 0.02,
      };

      let currentUserId = deposit.user_id;

      for (let level = 1; level <= 3; level++) {
        // Trouver le parrain du niveau actuel
        const { data: currentUser } = await admin
          .from("users")
          .select("referred_by")
          .eq("id", currentUserId)
          .maybeSingle();

        const referrerId = currentUser?.referred_by;
        if (!referrerId) {
          console.log(`Niveau ${level}: pas de parrain, arrêt`);
          break;
        }

        const rate = RATES[level];
        const commission =
          Math.round(Number(deposit.amount) * rate * 100) / 100;

        if (commission > 0) {
          // Insérer la commission
          const { error: refError } = await admin.from("referrals").insert({
            referrer_id: referrerId,
            referred_id: deposit.user_id,
            level,
            commission,
            created_at: new Date().toISOString(),
          });

          if (!refError) {
            // Créditer le parrain
            const { data: referrer } = await admin
              .from("users")
              .select("balance, total_revenue")
              .eq("id", referrerId)
              .maybeSingle();

            await admin
              .from("users")
              .update({
                balance: Number(referrer?.balance ?? 0) + commission,
                total_revenue:
                  Number(referrer?.total_revenue ?? 0) + commission,
              })
              .eq("id", referrerId);

            console.log(
              `💰 Commission N${level}: ${commission} FCFA 
               → parrain ${referrerId}`,
            );
          }
        }

        // Monter d'un niveau
        currentUserId = referrerId;
      }
    } else if (event === "payin.session.cancelled") {
      await admin
        .from("deposits")
        .update({ status: "rejected" })
        .eq("id", deposit.id);

      console.log(`❌ Dépôt ${deposit.id} annulé`);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response(
      JSON.stringify({ ok: false, error: (e as Error).message }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
