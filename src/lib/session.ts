import { cookies } from "next/headers";
import { userRepository, type ProfileView } from "@market/data";

export const SESSION_COOKIE = "velin_session";

export async function getSessionUser(): Promise<ProfileView | null> {
  const store = await cookies();
  const userId = store.get(SESSION_COOKIE)?.value;
  if (!userId) return null;
  const user = await userRepository.findById(userId);
  return user ? userRepository.toProfile(user) : null;
}

export async function requireSessionUser(): Promise<ProfileView> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireAdminUser(): Promise<ProfileView> {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") throw new Error("FORBIDDEN");
  return user;
}
