import supabase from "./supabaseClient";

const DEFAULT_SETTINGS = {
  app_name: "CBT-Eschool",
  school_logo: "",
  theme_color: "#0d6efd",
  sync_interval_seconds: 60,
  hide_scores: false,
  allow_multiple_login: false,
  app_version: "2.0.0",
};

export async function getSettings() {
  const { data, error } = await supabase
    .from("settings")
    .select("data")
    .eq("id", 1)
    .single();

  if (error) {
    if (error.message?.toLowerCase().includes("row level security")) {
      return {
        success: false,
        message:
          "Akses ditolak. Silakan login ulang menggunakan akun yang memiliki akses.",
      };
    }
    if (error.code === "PGRST116") {
      return { success: true, data: DEFAULT_SETTINGS };
    }
    return { success: false, message: error.message };
  }

  return { success: true, data: data.data };
}

export async function updateSettings(newSettings) {
  const { data: current } = await supabase
    .from("settings")
    .select("data")
    .eq("id", 1)
    .single();

  const merged = { ...(current?.data || DEFAULT_SETTINGS), ...newSettings };

  const { error } = await supabase
    .from("settings")
    .upsert({ id: 1, data: merged }, { onConflict: "id" });

  if (error) {
    if (error.message?.toLowerCase().includes("row level security")) {
      return {
        success: false,
        message:
          "Akses ditolak. Hanya admin yang dapat mengubah pengaturan. Pastikan Anda login dengan akun admin.",
      };
    }
    return { success: false, message: error.message };
  }

  return { success: true, data: merged };
}
