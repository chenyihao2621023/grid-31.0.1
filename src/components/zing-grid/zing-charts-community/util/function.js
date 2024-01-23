const doOnceFlags = {};

export function doOnce(func, key) {
    if (doOnceFlags[key]) {
        return;
    }
    func();
    doOnceFlags[key] = true;
}

export function clearDoOnceFlags() {
    for (const key in doOnceFlags) {
        delete doOnceFlags[key];
    }
}
