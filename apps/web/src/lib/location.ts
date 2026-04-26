export type ReverseGeocodeResult = {
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
};

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodeResult | null> {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`;

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    const address = payload?.address || {};

    return {
      address: payload?.display_name || undefined,
      city:
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        undefined,
      state: address.state || undefined,
      pincode: address.postcode || undefined,
    };
  } catch {
    return null;
  }
}

export function getCurrentPosition(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!globalThis.navigator?.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    globalThis.navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      },
    );
  });
}
