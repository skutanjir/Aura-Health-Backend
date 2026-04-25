import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

export function validateImageFile(mimetype, size) {
  if (!ALLOWED_MIME.includes(mimetype)) {
    throw new Error('Hanya file JPEG, PNG, dan WebP yang diizinkan');
  }
  if (size > MAX_SIZE_BYTES) {
    throw new Error('Ukuran file maksimal 2MB');
  }
}

export async function uploadToSupabase(bucket, path, buffer, mimetype) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType: mimetype,
      upsert: true,
    });

  if (error) throw new Error(`Upload gagal: ${error.message}`);

  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return publicData.publicUrl;
}

export async function deleteFromSupabase(bucket, path) {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw new Error(`Hapus file gagal: ${error.message}`);
}
