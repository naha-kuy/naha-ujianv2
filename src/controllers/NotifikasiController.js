import supabase from "../models/supabaseClient";
import { getCurrentUser } from "./AuthController";

export async function getNotifications(role = null) {
  const user = getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };

  let query = supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (role) {
    query = query.eq("role", role);
  } else {
    query = query.eq("user_id", user.id);
  }

  const { data, error } = await query;
  if (error) return { success: false, message: error.message };
  return { success: true, data: data || [] };
}

export async function getUnreadCount() {
  const user = getCurrentUser();
  if (!user) return 0;

  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  return count || 0;
}

export async function markAsRead(id) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id);

  if (error) return { success: false, message: error.message };
  return { success: true };
}

export async function markAllAsRead() {
  const user = getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) return { success: false, message: error.message };
  return { success: true };
}

export async function createNotification({ user_id, role, title, message, type = "info", link = null }) {
  const { error } = await supabase.from("notifications").insert({
    user_id, role, title, message, type, link,
  });

  if (error) return { success: false, message: error.message };
  return { success: true };
}

export async function deleteNotification(id) {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", id);

  if (error) return { success: false, message: error.message };
  return { success: true };
}

export function playNotifSound() {
  try {
    const audio = new Audio("/notif.mp3");
    audio.volume = 0.3;
    audio.play().catch(() => {});
  } catch (e) {
    // ignore
  }
}
