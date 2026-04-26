import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  name: string;
  image_url: string | null;
  price: number;
  duration_days: number;
  daily_revenue: number;
  total_revenue: number;
  active: boolean;
  sort_order: number;
}

export const useProducts = () => {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("products").select("*").eq("active", true).order("sort_order").then(({ data }) => {
      setData((data as Product[]) ?? []);
      setLoading(false);
    });
  }, []);

  return { data, loading };
};
