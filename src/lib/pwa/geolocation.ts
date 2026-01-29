"use client";

/**
 * Funções de geolocalização para validação de ponto
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp?: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

/**
 * Obter posição atual do usuário
 */
export async function getCurrentPosition(
  options?: PositionOptions
): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        code: 0,
        message: 'Geolocalização não suportada pelo navegador',
      });
      return;
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      ...options,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        reject({
          code: error.code,
          message: getGeolocationErrorMessage(error.code),
        });
      },
      defaultOptions
    );
  });
}

/**
 * Assistir mudanças de posição (tracking contínuo)
 */
export function watchPosition(
  onSuccess: (coords: Coordinates) => void,
  onError: (error: GeolocationError) => void,
  options?: PositionOptions
): number | null {
  if (!navigator.geolocation) {
    onError({
      code: 0,
      message: 'Geolocalização não suportada pelo navegador',
    });
    return null;
  }

  const defaultOptions: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
    ...options,
  };

  return navigator.geolocation.watchPosition(
    (position) => {
      onSuccess({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp,
      });
    },
    (error) => {
      onError({
        code: error.code,
        message: getGeolocationErrorMessage(error.code),
      });
    },
    defaultOptions
  );
}

/**
 * Parar de assistir mudanças de posição
 */
export function clearWatch(watchId: number): void {
  if (navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
}

/**
 * Calcular distância entre duas coordenadas usando fórmula de Haversine
 * Retorna distância em metros
 */
export function calculateDistance(
  coords1: Coordinates,
  coords2: Coordinates
): number {
  const R = 6371e3; // Raio da Terra em metros
  const φ1 = (coords1.latitude * Math.PI) / 180;
  const φ2 = (coords2.latitude * Math.PI) / 180;
  const Δφ = ((coords2.latitude - coords1.latitude) * Math.PI) / 180;
  const Δλ = ((coords2.longitude - coords1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distância em metros
}

/**
 * Verificar se o usuário está no local de trabalho
 */
export function checkIfAtWorkplace(
  userCoords: Coordinates,
  workplaceCoords: Coordinates,
  radiusInMeters: number = 100
): {
  isAtWorkplace: boolean;
  distance: number;
  message: string;
} {
  const distance = calculateDistance(userCoords, workplaceCoords);
  const isAtWorkplace = distance <= radiusInMeters;

  let message = '';
  if (isAtWorkplace) {
    message = `Você está no local de trabalho (${Math.round(distance)}m)`;
  } else {
    message = `Você está a ${Math.round(distance)}m do local de trabalho`;
  }

  return {
    isAtWorkplace,
    distance,
    message,
  };
}

/**
 * Formatar coordenadas para display
 */
export function formatCoordinates(coords: Coordinates): string {
  const lat = coords.latitude.toFixed(6);
  const lng = coords.longitude.toFixed(6);
  return `${lat}, ${lng}`;
}

/**
 * Obter link do Google Maps
 */
export function getGoogleMapsLink(coords: Coordinates): string {
  return `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`;
}

/**
 * Obter mensagem de erro de geolocalização
 */
function getGeolocationErrorMessage(code: number): string {
  switch (code) {
    case 1:
      return 'Permissão de localização negada';
    case 2:
      return 'Localização indisponível';
    case 3:
      return 'Timeout ao obter localização';
    default:
      return 'Erro desconhecido ao obter localização';
  }
}

/**
 * Verificar se permissão de geolocalização está concedida
 */
export async function checkGeolocationPermission(): Promise<PermissionState> {
  if (!('permissions' in navigator)) {
    return 'prompt';
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state;
  } catch (error) {
    console.error('[Geolocation] Erro ao verificar permissão:', error);
    return 'prompt';
  }
}

/**
 * Calcular bearing (direção) entre duas coordenadas
 * Retorna ângulo em graus (0-360)
 */
export function calculateBearing(
  coords1: Coordinates,
  coords2: Coordinates
): number {
  const φ1 = (coords1.latitude * Math.PI) / 180;
  const φ2 = (coords2.latitude * Math.PI) / 180;
  const Δλ = ((coords2.longitude - coords1.longitude) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  const bearing = ((θ * 180) / Math.PI + 360) % 360;

  return bearing;
}

/**
 * Obter direção cardinal (N, NE, E, SE, S, SW, W, NW)
 */
export function getCardinalDirection(bearing: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

/**
 * Validar coordenadas
 */
export function isValidCoordinates(coords: Coordinates): boolean {
  return (
    coords.latitude >= -90 &&
    coords.latitude <= 90 &&
    coords.longitude >= -180 &&
    coords.longitude <= 180
  );
}

/**
 * Mock de coordenadas para desenvolvimento/testes
 */
export const MOCK_COORDINATES: Record<string, Coordinates> = {
  office: {
    latitude: -23.5505,
    longitude: -46.6333,
    accuracy: 10,
  },
  home: {
    latitude: -23.5489,
    longitude: -46.6388,
    accuracy: 10,
  },
  remote: {
    latitude: -23.5600,
    longitude: -46.6500,
    accuracy: 20,
  },
};

/**
 * Obter coordenadas mock (para desenvolvimento)
 */
export function getMockPosition(
  location: keyof typeof MOCK_COORDINATES = 'office'
): Promise<Coordinates> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_COORDINATES[location]);
    }, 500);
  });
}
