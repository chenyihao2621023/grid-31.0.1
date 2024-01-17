export function extent(values) {
    const { length } = values;
    if (length === 0) {
        return undefined;
    }
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < length; i++) {
        let v = values[i];
        if (v instanceof Date) {
            v = v.getTime();
        }
        if (typeof v !== 'number') {
            continue;
        }
        if (v < min) {
            min = v;
        }
        if (v > max) {
            max = v;
        }
    }
    const extent = [min, max];
    if (extent.some((v) => !isFinite(v))) {
        return undefined;
    }
    return extent;
}
export function normalisedExtent(d, min, max) {
    return normalisedExtentWithMetadata(d, min, max).extent;
}
export function normalisedExtentWithMetadata(d, min, max) {
    var _a;
    let clipped = false;
    if (d.length > 2) {
        d = (_a = extent(d)) !== null && _a !== void 0 ? _a : [NaN, NaN];
    }
    if (!isNaN(min)) {
        clipped || (clipped = min > d[0]);
        d = [min, d[1]];
    }
    if (!isNaN(max)) {
        clipped || (clipped = max < d[1]);
        d = [d[0], max];
    }
    if (d[0] > d[1]) {
        d = [];
    }
    return { extent: d, clipped };
}
export function arraysEqual(a, b) {
    if (a == null || b == null || a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (Array.isArray(a[i]) && Array.isArray(b[i])) {
            if (!arraysEqual(a[i], b[i])) {
                return false;
            }
        }
        else if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}
export function toArray(value) {
    if (typeof value === 'undefined') {
        return [];
    }
    return Array.isArray(value) ? value : [value];
}
export function unique(array) {
    return Array.from(new Set(array));
}
//# sourceMappingURL=array.js.map