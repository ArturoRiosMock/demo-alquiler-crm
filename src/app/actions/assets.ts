"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { rowToAsset, assetToRow } from "@/lib/supabase/db";
import type { Asset } from "@/lib/types";
import { requireAdmin, requireAdminOrVendor, requireEditPermission, requireAssetAccess } from "@/lib/auth-server";

/** Lectura completa para el panel admin (login demo sin JWT Supabase: el anon no pasa RLS). */
export async function fetchAssets(): Promise<Asset[]> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToAsset);
}

export async function fetchPublicAssets(): Promise<Asset[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .eq("pub", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToAsset);
}

export async function fetchAssetById(id: string): Promise<Asset | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToAsset(data) : null;
}

export async function upsertAssets(assets: Asset[]): Promise<{ inserted: number; updated: number; errors: string[] }> {
  await requireAdmin();
  const supabase = await createServiceClient();
  const errors: string[] = [];
  let inserted = 0;
  let updated = 0;

  // Process in batches of 50
  const BATCH_SIZE = 50;
  for (let i = 0; i < assets.length; i += BATCH_SIZE) {
    const batch = assets.slice(i, i + BATCH_SIZE);

    // Check which IDs already exist
    const batchIds = batch.map(a => a.id);
    const { data: existingRows, error: fetchErr } = await supabase
      .from("assets")
      .select("id")
      .in("id", batchIds);
    if (fetchErr) {
      errors.push(`Batch ${i}: ${fetchErr.message}`);
      continue;
    }
    const existingIds = new Set((existingRows ?? []).map(r => r.id));

    const rows = batch.map(a => assetToRow(a));
    const { error: upsertErr } = await supabase
      .from("assets")
      .upsert(rows, { onConflict: "id", ignoreDuplicates: false });

    if (upsertErr) {
      errors.push(`Batch ${i}: ${upsertErr.message}`);
    } else {
      for (const r of rows) {
        if (existingIds.has(r.id)) updated++;
        else inserted++;
      }
    }
  }

  return { inserted, updated, errors };
}

export async function toggleAssetPub(id: string): Promise<void> {
  const session = await requireEditPermission("activos");
  await requireAssetAccess(session, id);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assets")
    .select("pub")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return;
  const newPub = !data.pub;
  const { error: updateErr } = await supabase
    .from("assets")
    .update({
      pub: newPub,
      fase: newPub ? "Publicado" : "Suspendido",
      fase_c: newPub ? "fp-pub" : "fp-sus",
    })
    .eq("id", id);
  if (updateErr) throw new Error(updateErr.message);
}

export async function updateAssetFields(
  id: string,
  fields: Record<string, string | null>
): Promise<void> {
  if (Object.keys(fields).length === 0) return;
  const session = await requireEditPermission("activos");
  await requireAssetAccess(session, id);
  const supabase = await createClient();
  const { error } = await supabase
    .from("assets")
    .update(fields)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function toggleAssetFav(id: string): Promise<void> {
  await requireAdminOrVendor();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assets")
    .select("fav")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return;
  const { error: updateErr } = await supabase
    .from("assets")
    .update({ fav: !data.fav })
    .eq("id", id);
  if (updateErr) throw new Error(updateErr.message);
}
