import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  "https://dcqqrpyhryijebqumtpn.supabase.co";

const supabasePublishableKey =
  "sb_publishable_k7sJi_d-oZqAc3b7A9rYLA_82Wv-pjL";

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
);
