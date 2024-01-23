export function windowValue(name) {
  const WINDOW = typeof window !== 'undefined' ? window : undefined;
  return WINDOW === null || WINDOW === void 0 ? void 0 : WINDOW[name];
}