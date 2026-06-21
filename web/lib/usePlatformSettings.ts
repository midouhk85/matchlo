"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export type PlatformSettings = {
  chargily_enabled: boolean;
  escrow_enabled: boolean;
};

const DEFAULT: PlatformSettings = { chargily_enabled: false, escrow_enabled: false };

export function usePlatformSettings() {
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("platform_settings")
      .select("chargily_enabled, escrow_enabled")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (data) setSettings(data as PlatformSettings);
        setLoading(false);
      });
  }, []);

  return { settings, loading };
}
