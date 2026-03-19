"use server";

import { createClient } from "@/lib/supabase/server";
import { rowToComprador, compradorToRow } from "@/lib/supabase/db";
import type { Comprador } from "@/lib/types";

export async function fetchCompradores(): Promise<Comprador[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("compradores")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToComprador);
}

export async function fetchCompradorById(id: string): Promise<Comprador | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("compradores")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToComprador(data) : null;
}

export async function upsertComprador(c: Comprador): Promise<void> {
  const supabase = await createClient();
  const row = compradorToRow(c);
  const { error } = await supabase
    .from("compradores")
    .upsert(row, { onConflict: "id", ignoreDuplicates: false });
  if (error) throw new Error(error.message);
}
