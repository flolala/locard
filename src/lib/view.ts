import type { DeviceSummary } from "./locard";

export type DeviceView = {
  id: string;
  name: string;
  kind: string;
  provider: string;
  color: string;
  api_key: string;
  share_slug: string;
  lost_mode: boolean;
  last_seen_at: string | null;
  last_lat: number | null;
  last_lng: number | null;
  last_accuracy: number | null;
  last_battery: number | null;
  last_source: string | null;
  geofence: {
    name: string;
    lat: number;
    lng: number;
    radius_m: number;
  } | null;
  distanceToFence: number | null;
};

export function toDeviceView(device: DeviceSummary): DeviceView {
  return {
    id: device.id,
    name: device.name,
    kind: device.kind,
    provider: device.provider,
    color: device.color,
    api_key: device.api_key,
    share_slug: device.share_slug,
    lost_mode: device.lost_mode,
    last_seen_at: device.last_seen_at,
    last_lat: device.last_lat,
    last_lng: device.last_lng,
    last_accuracy: device.last_accuracy,
    last_battery: device.last_battery,
    last_source: device.last_source,
    geofence: device.geofence
      ? {
          name: device.geofence.name,
          lat: device.geofence.lat,
          lng: device.geofence.lng,
          radius_m: device.geofence.radius_m,
        }
      : null,
    distanceToFence: device.distanceToFence,
  };
}
