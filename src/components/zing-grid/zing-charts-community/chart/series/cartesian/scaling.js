function isContinuousScaling(scaling) {
    return scaling.type === 'continuous' || scaling.type === 'log';
}
function isCategoryScaling(scaling) {
    return scaling.type === 'category';
}
function areEqual(a, b) {
    return (a.domain.length === b.domain.length &&
        a.range.length === b.range.length &&
        a.domain.every((val, index) => val === b.domain[index]) &&
        a.range.every((val, index) => val === b.range[index]));
}
export function areScalingEqual(a, b) {
    if (a === undefined || b === undefined) {
        return a !== undefined || b !== undefined;
    }
    if (isContinuousScaling(a) && isContinuousScaling(b)) {
        return a.type === b.type && areEqual(a, b);
    }
    if (isCategoryScaling(a) && isCategoryScaling(b)) {
        return areEqual(a, b);
    }
    return false;
}
