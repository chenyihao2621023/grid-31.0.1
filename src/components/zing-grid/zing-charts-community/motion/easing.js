export const linear = (n) => n;
export const easeIn = (n) => 1 - Math.cos((n * Math.PI) / 2);
export const easeOut = (n) => Math.sin((n * Math.PI) / 2);
export const easeInOut = (n) => -(Math.cos(n * Math.PI) - 1) / 2;
export const easeInQuad = (n) => n * n;
export const easeOutQuad = (n) => 1 - Math.pow((1 - n), 2);
export const easeInOutQuad = (n) => (n < 0.5 ? 2 * n * n : 1 - Math.pow((-2 * n + 2), 2) / 2);
export const inverseEaseOut = (x) => (2 * Math.asin(x)) / Math.PI;
