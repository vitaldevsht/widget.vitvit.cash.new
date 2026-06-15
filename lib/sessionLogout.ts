import { useAppStore } from "../store";

export async function clearSession() {
  try {
    await fetch("/api/partner/session", {
      method: "DELETE",
      credentials: "include",
      cache: "no-store",
    });
  } catch (e) {
    console.error("Failed to clear server session", e);
  }
  try {
    sessionStorage.removeItem("partner.access_token");
    sessionStorage.removeItem("partner.external_address");
  } catch {}
  try {
    localStorage.removeItem("vitvit-storage");
  } catch {}
  useAppStore.getState().logout();
}
