import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatMoney } from "@/lib/countries";

export default function AdminProducts() {
  const [items, setItems] = useState<any[]>([]);
  const [imageEdits, setImageEdits] = useState<Record<string, string>>({});
  const [priceEdits, setPriceEdits] = useState<Record<string, string>>({});
  const [dailyEdits, setDailyEdits] = useState<Record<string, string>>({});
  const load = () =>
    supabase
      .from("products")
      .select("*")
      .order("sort_order")
      .then(({ data }) => setItems(data ?? []));
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    const next: Record<string, string> = {};
    const nextPrices: Record<string, string> = {};
    const nextDaily: Record<string, string> = {};
    items.forEach((p) => {
      next[p.id] = p.image_url ?? "";
      nextPrices[p.id] = String(p.price ?? "");
      nextDaily[p.id] = String(p.daily_revenue ?? "");
    });
    setImageEdits(next);
    setPriceEdits(nextPrices);
    setDailyEdits(nextDaily);
  }, [items]);

  const toggle = async (p: any) => {
    const { error } = await supabase
      .from("products")
      .update({ active: !p.active })
      .eq("id", p.id);
    if (error) toast.error(error.message);
    else load();
  };
  const del = async (id: string) => {
    if (!confirm("Supprimer ?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message);
    else load();
  };
  const saveImage = async (p: any) => {
    const url = imageEdits[p.id] ?? "";
    const { error } = await supabase
      .from("products")
      .update({ image_url: url })
      .eq("id", p.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Image mise a jour");
      load();
    }
  };
  const savePricing = async (p: any) => {
    const price = Number(priceEdits[p.id]);
    const daily = Number(dailyEdits[p.id]);
    if (!Number.isFinite(price) || price <= 0)
      return toast.error("Prix invalide");
    if (!Number.isFinite(daily) || daily < 0)
      return toast.error("Revenu quotidien invalide");
    const duration = Number(p.duration_days) || 0;
    const total = duration > 0 ? daily * duration : daily;
    const { error } = await supabase
      .from("products")
      .update({ price, daily_revenue: daily, total_revenue: total })
      .eq("id", p.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Prix et revenu mis a jour");
      load();
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Produits ({items.length})</h1>
      <div className="bg-card rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="p-3">Image</th>
              <th className="p-3">Nom</th>
              <th className="p-3">Prix</th>
              <th className="p-3">Durée</th>
              <th className="p-3">Rev/jour</th>
              <th className="p-3">Total</th>
              <th className="p-3">Actif</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-3">
                  <img
                    src={imageEdits[p.id] ?? ""}
                    alt=""
                    className="w-12 h-12 object-cover rounded"
                  />
                  <input
                    value={imageEdits[p.id] ?? ""}
                    onChange={(e) =>
                      setImageEdits((prev) => ({
                        ...prev,
                        [p.id]: e.target.value,
                      }))
                    }
                    placeholder="URL image"
                    className="mt-2 w-48 rounded border border-border bg-card px-2 py-1 text-xs"
                  />
                </td>
                <td className="p-3 font-bold text-accent">{p.name}</td>
                <td className="p-3">
                  <div className="text-xs text-muted-foreground">
                    {formatMoney(Number(p.price))}
                  </div>
                  <input
                    type="number"
                    value={priceEdits[p.id] ?? ""}
                    onChange={(e) =>
                      setPriceEdits((prev) => ({
                        ...prev,
                        [p.id]: e.target.value,
                      }))
                    }
                    className="mt-1 w-24 rounded border border-border bg-card px-2 py-1 text-xs"
                  />
                </td>
                <td className="p-3">{p.duration_days}j</td>
                <td className="p-3">
                  <div className="text-xs text-muted-foreground">
                    {formatMoney(Number(p.daily_revenue))}
                  </div>
                  <input
                    type="number"
                    value={dailyEdits[p.id] ?? ""}
                    onChange={(e) =>
                      setDailyEdits((prev) => ({
                        ...prev,
                        [p.id]: e.target.value,
                      }))
                    }
                    className="mt-1 w-24 rounded border border-border bg-card px-2 py-1 text-xs"
                  />
                </td>
                <td className="p-3">{formatMoney(Number(p.total_revenue))}</td>
                <td className="p-3">{p.active ? "✅" : "❌"}</td>
                <td className="p-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => saveImage(p)}
                  >
                    Image
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => savePricing(p)}
                  >
                    Prix
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toggle(p)}>
                    {p.active ? "Désactiver" : "Activer"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => del(p.id)}
                  >
                    Suppr
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
