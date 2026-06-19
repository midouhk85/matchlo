import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

/**
 * Téléverse une image locale (uri) vers un bucket Supabase Storage.
 * Le fichier est rangé sous {userId}/... pour respecter les RLS de Storage.
 * Retourne l'URL publique (photos/logos) ou le chemin (documents, privé).
 */
export async function uploadImage(
  bucket: 'photos' | 'logos' | 'documents',
  uri: string,
  userId: string,
): Promise<{ path: string; publicUrl: string | null }> {
  const ext = uri.split('.').pop()?.split('?')[0] || 'jpg';
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  // Méthode recommandée Expo : récupérer l'ArrayBuffer du fichier local
  const arrayBuffer = await fetch(uri).then((res) => res.arrayBuffer());

  const { error } = await supabase.storage.from(bucket).upload(path, arrayBuffer, {
    contentType,
    upsert: false,
  });
  if (error) throw error;

  const publicUrl =
    bucket === 'documents'
      ? null
      : supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  return { path, publicUrl };
}

/** Ouvre la galerie et retourne l'uri sélectionnée (ou null). */
export async function pickImage(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [3, 4],
    quality: 0.7,
  });
  if (result.canceled || !result.assets.length) return null;
  return result.assets[0].uri;
}
