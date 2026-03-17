import type { Boundaries, Sensor, SensorType } from "./types";

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function getBoundaryColor(
  value: number,
  boundaries: Boundaries
): string {
  if (value >= boundaries.high) return "var(--color-danger)";
  if (value >= boundaries.medium) return "var(--color-warning)";
  if (value >= boundaries.low) return "var(--color-success)";
  return "var(--color-success)";
}

export function formatValue(value: number, decimals = 0): string {
  if (isNaN(value) || !isFinite(value)) return "0";
  return value.toFixed(decimals);
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes.toFixed(0)} B`;
}

export function formatNetworkRate(bytesPerSec: number): string {
  if (bytesPerSec >= 1048576) return `${(bytesPerSec / 1048576).toFixed(1)} MB/s`;
  if (bytesPerSec >= 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
  return `${bytesPerSec.toFixed(0)} B/s`;
}

export function findSensorByTypeAndHardware(
  sensors: Sensor[],
  sensorType: SensorType,
  hardwareIdentifier?: string
): Sensor | undefined {
  return sensors.find(
    (s) =>
      s.sensorType === sensorType &&
      (!hardwareIdentifier || s.hardwareIdentifier === hardwareIdentifier)
  );
}

export function findSensorById(
  sensors: Sensor[],
  id: string
): Sensor | undefined {
  if (!id) return undefined;
  return sensors.find((s) => s.identifier === id);
}
