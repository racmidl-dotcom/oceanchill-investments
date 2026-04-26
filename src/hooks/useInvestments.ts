import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface Investment {
  id: string;
  product_id: string;
  amount: number;
  daily_revenue: number;
  total_revenue: number;
  earned: number;
  start_date: string;
  end_date: string;
  status: string;
}

export const useInvestments = () => {
  const { user } = useAuth();
  const [data, setData] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("investments").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setData((data as Investment[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { reload(); }, [reload]);

  return { data, loading, reload };
};
