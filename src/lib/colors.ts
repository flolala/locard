export const COLOR_HEX: Record<string, string> = {
  gold: "#a8822a",
  ink: "#2b2724",
  sage: "#5d7059",
  clay: "#a3623f",
  slate: "#4f5b6b",
};

export const DEVICE_COLORS = ["gold", "ink", "sage", "clay", "slate"] as const;
export type DeviceColor = (typeof DEVICE_COLORS)[number];

export const DEVICE_KINDS = ["cardholder", "tag", "keys", "bag", "other"] as const;
