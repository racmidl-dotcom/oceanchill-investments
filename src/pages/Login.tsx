import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import logo from "@/assets/whirlpool-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { phoneToEmail, COUNTRIES } from "@/lib/countries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Login() {
  const nav = useNavigate();
  const [dial, setDial] = useState("+226");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    const email = phoneToEmail(dial + phone);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setErr("Numéro ou mot de passe incorrect");
      return;
    }
    toast.success("Connecté");
    nav("/home", { replace: true });
  };

  return (
    <div className="app-shell flex flex-col items-center px-6 pt-16">
      <div className="flex flex-col items-center gap-2 mb-10">
        <img src={logo} alt="Whirpol" className="h-14 w-auto" />
        <p className="text-sm text-muted-foreground mt-2 font-serif italic">
          Investissez dans nos réfrigérateurs
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <div className="flex gap-2">
          <select
            value={dial}
            onChange={(e) => setDial(e.target.value)}
            className="bg-card border border-border rounded-sm px-3 text-sm font-medium"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.dial}>
                {c.flag} {c.dial}
              </option>
            ))}
          </select>
          <Input
            type="tel"
            placeholder="Numéro de téléphone"
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

        {err && <p className="text-sm text-destructive text-center">{err}</p>}

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-sm bg-panel-dark hover:bg-panel text-panel-foreground font-serif font-semibold tracking-widest uppercase text-sm"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </Button>

        <p className="text-center text-sm text-muted-foreground pt-3 font-serif">
          Pas encore de compte ?{" "}
          <Link
            to="/register"
            className="text-panel-dark font-semibold underline"
          >
            Créer un compte
          </Link>
        </p>
      </form>
    </div>
  );
}
