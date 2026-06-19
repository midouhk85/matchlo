import * as Location from 'expo-location';

export interface Coords {
  latitude: number;
  longitude: number;
}

/**
 * Capture la position via expo-location. Retourne null si la permission est
 * refusée (repli sur saisie manuelle de la wilaya côté écran).
 */
export async function capturePosition(): Promise<Coords | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  } catch {
    return null;
  }
}
