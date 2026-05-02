import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DEPOSIT_BANK_DETAILS, DEPOSIT_USDT_TRC20_ADDRESS } from "@/lib/deposit-config";

export type DepositSettings = {
  usdt_trc20_address: string;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_iban: string;
};

const DEFAULTS: DepositSettings = {
  usdt_trc20_address: DEPOSIT_USDT_TRC20_ADDRESS,
  bank_name: DEPOSIT_BANK_DETAILS.bankName,
  bank_account_name: DEPOSIT_BANK_DETAILS.accountName,
  bank_account_number: DEPOSIT_BANK_DETAILS.accountNumber,
  bank_iban: DEPOSIT_BANK_DETAILS.iban,
};

export function useDepositSettings(): DepositSettings {
  const [settings, setSettings] = useState<DepositSettings>(DEFAULTS);

  useEffect(() => {
    void supabase
      .from("deposit_settings")
      .select("key, value")
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, string> = {};
        (data as { key: string; value: string }[]).forEach((r) => { map[r.key] = r.value; });
        setSettings({
          usdt_trc20_address:  map.usdt_trc20_address  ?? DEFAULTS.usdt_trc20_address,
          bank_name:           map.bank_name           ?? DEFAULTS.bank_name,
          bank_account_name:   map.bank_account_name   ?? DEFAULTS.bank_account_name,
          bank_account_number: map.bank_account_number ?? DEFAULTS.bank_account_number,
          bank_iban:           map.bank_iban           ?? DEFAULTS.bank_iban,
        });
      });
  }, []);

  return settings;
}
