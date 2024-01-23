export function windowValue(name) {
    
    const WINDOW = typeof window !== 'undefined'
        ? window
        : // typeof global !== 'undefined' ? (global as any) :
            undefined;
    return WINDOW === null || WINDOW === void 0 ? void 0 : WINDOW[name];
}
