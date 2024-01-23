const twoPi = Math.PI * 2;
export function normalizeAngle360(radians) {
  radians %= twoPi;
  radians += twoPi;
  radians %= twoPi;
  return radians;
}
export function normalizeAngle360Inclusive(radians) {
  radians %= twoPi;
  radians += twoPi;
  if (radians !== twoPi) {
    radians %= twoPi;
  }
  return radians;
}
export function normalizeAngle180(radians) {
  radians %= twoPi;
  if (radians < -Math.PI) {
    radians += twoPi;
  } else if (radians >= Math.PI) {
    radians -= twoPi;
  }
  return radians;
}
export function toRadians(degrees) {
  return degrees / 180 * Math.PI;
}
export function toDegrees(radians) {
  return radians / Math.PI * 180;
}
export function angleBetween(angle0, angle1) {
  angle0 = normalizeAngle360(angle0);
  angle1 = normalizeAngle360(angle1);
  return angle1 - angle0 + (angle0 > angle1 ? 2 * Math.PI : 0);
}