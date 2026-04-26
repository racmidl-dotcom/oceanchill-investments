import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatMoney } from "@/lib/countries";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Eye, EyeOff, KeyRound } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [edit, setEdit] = useState<{ id: string; balance: number } | null>(null);
  const [pwTarget, setPwTarget] = useState<any | null>(null);
  const [newPw, setNewPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);

  const load = () => supabase.from("users").select("*").order("created_at", { ascending: false }).then(({ data }) => setUsers(data ?? []));
  useEffect(() => { load(); }, []);

  const updateBalance = async () => {
    if (!edit) return;
    const { error } = await supabase.from("users").update({ balance: edit.balance }).eq("id", edit.id);
    if (error) toast.error(error.message); else { toast.success("Solde mis à jour"); setEdit(null); load(); }
  };

  const adjustBalance = async (u: any, delta: number) => {
    const { error } = await supabase.from("users").update({ balance: Number(u.balance) + delta }).eq("id", u.id);
    if (error) toast.error(error.message); else { toast.success(`${delta > 0 ? "+" : ""}${delta} F`); load(); }
  };

  const toggleStatus = async (u: any) => {
    const { error } = await supabase.from("users").update({ status: u.status === "active" ? "blocked" : "active" }).eq("id", u.id);
    if (error) toast.error(error.message); else load();
  };

  const resetPassword = async () => {
    if (!pwTarget || newPw.length < 6) return toast.error("Mot de passe : 6 caractères min");
    setPwBusy(true);
    const { data, error } = await supabase.functions.invoke("admin-reset-password", {
      body: { user_id: pwTarget.id, new_password: newPw },
    });
    setPwBusy(false);
    if (error || data?.error) {
      toast.error(error?.message || data?.error || "Erreur");
    } else {
      toast.success(`Mot de passe réinitialisé pour ${pwTarget.phone}`);
      setPwTarget(null);
      setNewPw("");
    }
  };

  const filtered = users.filter(u =>
    !search || u.phone?.toLowerCase().includes(search.toLowerCase()) || u.ref_code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Utilisateurs ({users.length})</h1>

      <Input
        placeholder="Rechercher par téléphone ou code..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 max-w-sm"
      />

      <div className="bg-card rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="p-3">Téléphone</th>
              <th className="p-3">Pays</th>
              <th className="p-3">Code</th>
              <th className="p-3">Type</th>
              <th className="p-3">Solde</th>
              <th className="p-3">Revenu</th>
              <th className="p-3">Statut</th>
              <th className="p-3">Date</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-t border-border">
                <td className="p-3 font-mono text-xs">{u.phone}</td>
                <td className="p-3">{u.country}</td>
                <td className="p-3 font-bold">{u.ref_code}</td>
                <td className="p-3">
                  {u.is_promoter
                    ? <span className="px-2 py-0.5 rounded text-xs bg-accent/20 text-accent font-semibold">⭐ Promoteur</span>
                    : <span className="text-xs text-muted-foreground">Standard</span>}
                </td>
                <td className="p-3">
                  {edit?.id === u.id ? (
                    <Input type="number" value={edit.balance} onChange={(e) => setEdit({ id: u.id, balance: Number(e.target.value) })} className="h-8 w-28" />
                  ) : <span className="font-semibold">{formatMoney(Number(u.balance))}</span>}
                </td>
                <td className="p-3">{formatMoney(Number(u.total_revenue))}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${u.status === "active" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>{u.status}</span>
                </td>
                <td className="p-3 text-xs">{new Date(u.created_at).toLocaleDateString("fr-FR")}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {edit?.id === u.id ? (
                      <>
                        <Button size="sm" onClick={updateBalance}>OK</Button>
                        <Button size="sm" variant="outline" onClick={() => setEdit(null)}>X</Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setEdit({ id: u.id, balance: Number(u.balance) })}>Solde</Button>
                        <Button size="sm" variant="outline" onClick={() => adjustBalance(u, 1000)}>+1k</Button>
                        <Button size="sm" variant="outline" onClick={() => adjustBalance(u, -1000)}>-1k</Button>
                        <Button size="sm" variant="outline" onClick={() => { setPwTarget(u); setNewPw(""); }}>
                          <KeyRound className="w-3 h-3 mr-1" />MdP
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => toggleStatus(u)}>
                          {u.status === "active" ? "Bloquer" : "Débloquer"}
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!pwTarget} onOpenChange={(o) => !o && setPwTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Réinitialiser le mot de passe</DialogTitle></DialogHeader>
          <p className="text-sm">
            Utilisateur : <strong className="font-mono">{pwTarget?.phone}</strong>
          </p>
          <p className="text-xs text-muted-foreground">
            Pour des raisons de sécurité, les mots de passe sont chiffrés et ne peuvent pas être lus.
            Vous pouvez en définir un nouveau qui sera communiqué à l'utilisateur.
          </p>
          <div className="relative">
            <Input
              type={showPw ? "text" : "password"}
              placeholder="Nouveau mot de passe (6 car. min)"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className="pr-10"
            />
            <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwTarget(null)}>Annuler</Button>
            <Button onClick={resetPassword} disabled={pwBusy || newPw.length < 6}>
              {pwBusy ? "..." : "Réinitialiser"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
