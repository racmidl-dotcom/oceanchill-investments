import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Check } from "lucide-react";
import logo from "@/assets/whirlpool-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { phoneToEmail, COUNTRIES, CountryCode } from "@/lib/countries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Register() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const refFromUrl = params.get("ref")?.toUpperCase() ?? "";
  const [country, setCountry] = useState<CountryCode>("BF");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [refCode, setRefCode] = useState(refFromUrl);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (refFromUrl) setRefCode(refFromUrl);
  }, [refFromUrl]);

  const dial = COUNTRIES.find((c) => c.code === country)!.dial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (password.length < 6)
      return setErr("Mot de passe : 6 caractères minimum");
    if (password !== confirm)
      return setErr("Les mots de passe ne correspondent pas");
    setLoading(true);
    const fullPhone = dial + phone;
    const email = phoneToEmail(fullPhone);
    const redirectUrl = `${window.location.origin}/home`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { phone: fullPhone, country, ref_code: refCode || null },
      },
    });
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    toast.success("Compte créé !");
    nav("/home", { replace: true });
  };

  return (
    <div className="app-shell flex flex-col items-center px-6 pt-12 pb-10">
      <div className="flex flex-col items-center gap-2 mb-8">
        <img src={logo} alt="Whirpol" className="h-12 w-auto" />
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block font-serif">
            Pays
          </label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value as CountryCode)}
            className="w-full bg-card border border-border rounded-sm h-12 px-3 text-sm font-medium"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name} ({c.dial})
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <div className="bg-card border border-border rounded-sm h-12 px-3 flex items-center text-sm font-semibold">
            {dial}
          </div>
          <Input
            type="tel"
            placeholder="Téléphone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="flex-1 h-12 bg-card"
          />
        </div>

        <div className="relative">
          <Input
            type={show ? "text" : "password"}
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-12 pr-10 bg-card"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {show ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
        <Input
          type={show ? "text" : "password"}
          placeholder="Confirmer le mot de passe"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          className="h-12 bg-card"
        />

        <div className="relative">
          <Input
            placeholder="Code d'invitation (optionnel)"
            value={refCode}
            onChange={(e) => setRefCode(e.target.value.toUpperCase())}
            readOnly={!!refFromUrl}
            className={`h-12 bg-card ${refFromUrl ? "pr-10" : ""}`}
          />
          {refFromUrl && (
            <Check className="absolute right-3 top-1/2 -translate-y-1/2 text-success w-5 h-5" />
          )}
        </div>

        {err && <p className="text-sm text-destructive text-center">{err}</p>}

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-sm bg-panel-dark hover:bg-panel text-panel-foreground font-serif font-semibold tracking-widest uppercase text-sm"
        >
          {loading ? "Création..." : "Créer un compte"}
        </Button>

        <p className="text-center text-sm text-muted-foreground pt-2 font-serif">
          Déjà inscrit ?{" "}
          <Link to="/login" className="text-panel-dark font-semibold underline">
            Se connecter
          </Link>
        </p>
      </form>
    </div>
  );
}
