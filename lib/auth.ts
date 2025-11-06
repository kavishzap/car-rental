import { supabase } from "./supabase";

export async function login(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
}
export async function isAuthenticated() {
  const { data } = await supabase.auth.getSession();
  return !!data.session?.user;
}
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
