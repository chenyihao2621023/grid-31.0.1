
export function zipObject(keys, values) {
    const zipped = {};
    if (Array.isArray(values)) {
        for (let i = 0; i < keys.length; i++) {
            zipped[`${keys[i]}`] = values[i];
        }
    }
    else {
        for (let i = 0; i < keys.length; i++) {
            zipped[`${keys[i]}`] = values;
        }
    }
    return zipped;
}
