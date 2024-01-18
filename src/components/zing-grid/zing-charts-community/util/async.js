export function sleep(sleepTimeoutMs) {
    return new Promise((resolve) => {
        setTimeout(() => resolve(undefined), sleepTimeoutMs);
    });
}
//# sourceMappingURL=async.js.map