import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatMoney } from "@/lib/countries";

export default function AdminPromoters() {
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState<any | null>(null);
  const [productId, setProductId] = useState<string>("");

  const load = async () => {
    const { data: u } = await supabase.from("users").select("*").order("is_promoter", { ascending: false }).order("created_at", { ascending: false });
    setUsers(u ?? []);
    const { data: p } = await supabase.from("products").select("*").eq("active", true).order("sort_order");
    setProducts(p ?? []);
  };
  useEffect(() => { load(); }, []);

  const togglePromoter = async (u: any) => {
    const { error } = await supabase.from("users").update({ is_promoter: !u.is_promoter }).eq("id", u.id);
    if (error) toast.error(error.message);
    else { toast.success(u.is_promoter ? "Promoteur désactivé" : "Promoteur activé"); load(); }
  };

  const assignProduct = async () => {
    if (!target || !productId) return;
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const end = new Date(Date.now() + product.duration_days * 86400000).toISOString();
    const { error } = await supabase.from("investments").insert({
      user_id: target.id,
      product_id: product.id,
      amount: product.price,
      daily_revenue: product.daily_revenue,
      total_revenue: product.total_revenue,
      end_date: end,
    });
    if (error) toast.error(error.message);
    else {
      toast.success(`Produit attribué à ${target.phone}`);
      setTarget(null);
      setProductId("");
      load();
    }
  };

  const filtered = users.filter(u =>
    !search || u.phone?.toLowerCase().includes(search.toLowerCase()) || u.ref_code?.toLowerCase().includes(search.toLowerCase())
  );

  const promoters = filtered.filter(u => u.is_promoter);
  const others = filtered.filter(u => !u.is_promoter);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Promoteurs</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Les promoteurs ne génèrent <strong>aucune commission</strong> de parrainage pour leurs parrains lors de leurs achats de produits.
      </p>

      <Input
        placeholder="Rechercher par téléphone ou code..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 max-w-sm"
      />

      <div className="bg-card rounded-xl mb-6">
        <div className="p-3 bg-accent/10 font-semibold text-accent rounded-t-xl">
          ⭐ Promoteurs actifs ({promoters.length})
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="p-3">Téléphone</th>
              <th className="p-3">Code</th>
              <th className="p-3">Solde</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {promoters.map(u => (
              <tr key={u.id} className="border-t border-border">
                <td className="p-3 font-mono text-xs">{u.phone}</td>
                <td className="p-3 font-bold">{u.ref_code}</td>
                <td className="p-3">{formatMoney(Number(u.balance))}</td>
                <td className="p-3 flex gap-2">
                  <Button size="sm" onClick={() => setTarget(u)}>Attribuer produit</Button>
                  <Button size="sm" variant="destructive" onClick={() => togglePromoter(u)}>Désactiver</Button>
                </td>
              </tr>
            ))}
            {promoters.length === 0 && (
              <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">Aucun promoteur</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-card rounded-xl">
        <div className="p-3 bg-muted font-semibold rounded-t-xl">
          Utilisateurs réguliers ({others.length})
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="p-3">Téléphone</th>
              <th className="p-3">Code</th>
              <th className="p-3">Solde</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {others.slice(0, 50).map(u => (
              <tr key={u.id} className="border-t border-border">
                <td className="p-3 font-mono text-xs">{u.phone}</td>
                <td className="p-3 font-bold">{u.ref_code}</td>
                <td className="p-3">{formatMoney(Number(u.balance))}</td>
                <td className="p-3">
                  <Button size="sm" variant="outline" onClick={() => togglePromoter(u)}>Nommer promoteur</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Attribuer un produit à {target?.phone}</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">L'investissement sera créé sans débiter le solde du promoteur.</p>
          <select value={productId} onChange={(e) => setProductId(e.target.value)} className="w-full bg-secondary rounded-lg h-11 px-3 text-sm">
            <option value="">— Choisir un produit —</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name} · {formatMoney(Number(p.price))} · {p.duration_days}j</option>
            ))}
          </select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)}>Annuler</Button>
            <Button onClick={assignProduct} disabled={!productId}>Confirmer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
