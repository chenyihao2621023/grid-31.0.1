import { FROM_TO_MIXINS } from '../../motion/fromToMotion';
export function prepareAxisAnimationContext(axis) {
    const requestedRangeMin = Math.min(...axis.range);
    const requestedRangeMax = Math.max(...axis.range);
    const min = Math.floor(requestedRangeMin);
    const max = Math.ceil(requestedRangeMax);
    const visible = min !== max;
    return { min, max, visible };
}
const fullCircle = Math.PI * 2;
const halfCircle = fullCircle / 2;
function normaliseEndRotation(start, end) {
    const directDistance = Math.abs(end - start);
    if (directDistance < halfCircle)
        return end;
    if (start > end)
        return end + fullCircle;
    return end - fullCircle;
}
export function prepareAxisAnimationFunctions(ctx) {
    const outOfBounds = (y, range) => {
        const min = range != null ? Math.min(...range) : ctx.min;
        const max = range != null ? Math.max(...range) : ctx.max;
        return y < min || y > max;
    };
    const calculateStatus = (node, datum, status) => {
        if (status !== 'removed' && outOfBounds(node.translationY, node.datum.range)) {
            return 'removed';
        }
        else if (status !== 'added' && outOfBounds(datum.translationY, datum.range)) {
            return 'added';
        }
        return status;
    };
    const tick = {
        fromFn(node, datum, status) {
            // Default to starting at the same position that the node is currently in.
            let y = node.y1 + node.translationY;
            let opacity = node.opacity;
            if (status === 'added' || outOfBounds(node.datum.translationY, node.datum.range)) {
                y = datum.translationY;
                opacity = 0;
            }
            // Animate translationY so we don't constantly regenerate the line path data
            return Object.assign({ y: 0, translationY: y, opacity }, FROM_TO_MIXINS[status]);
        },
        toFn(_node, datum, status) {
            const y = datum.translationY;
            let opacity = 1;
            if (status === 'removed') {
                opacity = 0;
            }
            return {
                y: 0,
                translationY: y,
                opacity,
                finish: {
                    // Set explicit y after animation so it's pixel aligned
                    y: y,
                    translationY: 0,
                },
            };
        },
        intermediateFn(node, _datum, _status) {
            return { visible: !outOfBounds(node.y) };
        },
    };
    const label = {
        fromFn(node, newDatum, status) {
            var _a;
            const datum = (_a = node.previousDatum) !== null && _a !== void 0 ? _a : newDatum;
            status = calculateStatus(node, newDatum, status);
            // Default to starting at the same position that the node is currently in.
            const x = datum.x;
            const y = datum.y;
            const rotationCenterX = datum.rotationCenterX;
            let translationY = Math.round(node.translationY);
            let rotation = datum.rotation;
            let opacity = node.opacity;
            if (status === 'removed' || outOfBounds(datum.y, datum.range)) {
                // rotation = newDatum.rotation;
            }
            else if (status === 'added' || outOfBounds(node.datum.y, node.datum.range)) {
                translationY = Math.round(datum.translationY);
                opacity = 0;
                rotation = newDatum.rotation;
            }
            return Object.assign({ x, y, rotationCenterX, translationY, rotation, opacity }, FROM_TO_MIXINS[status]);
        },
        toFn(node, datum, status) {
            var _a, _b;
            const x = datum.x;
            const y = datum.y;
            const rotationCenterX = datum.rotationCenterX;
            const translationY = Math.round(datum.translationY);
            let rotation = 0;
            let opacity = 1;
            status = calculateStatus(node, datum, status);
            if (status === 'added') {
                opacity = 1;
                rotation = datum.rotation;
            }
            else if (status === 'removed') {
                opacity = 0;
                rotation = datum.rotation;
            }
            else {
                rotation = normaliseEndRotation((_b = (_a = node.previousDatum) === null || _a === void 0 ? void 0 : _a.rotation) !== null && _b !== void 0 ? _b : datum.rotation, datum.rotation);
            }
            return { x, y, rotationCenterX, translationY, rotation, opacity, finish: { rotation: datum.rotation } };
        },
    };
    const line = {
        fromFn(node, datum) {
            var _a;
            return Object.assign(Object.assign({}, ((_a = node.previousDatum) !== null && _a !== void 0 ? _a : datum)), FROM_TO_MIXINS['updated']);
        },
        toFn(_node, datum) {
            return Object.assign({}, datum);
        },
    };
    const group = {
        fromFn(group, _datum) {
            const { rotation, translationX, translationY } = group;
            return Object.assign({ rotation,
                translationX,
                translationY }, FROM_TO_MIXINS['updated']);
        },
        toFn(_group, datum) {
            const { rotation, translationX, translationY } = datum;
            return {
                rotation,
                translationX,
                translationY,
            };
        },
    };
    return { tick, line, label, group };
}
export function resetAxisGroupFn() {
    return (_node, datum) => {
        return {
            rotation: datum.rotation,
            rotationCenterX: datum.rotationCenterX,
            rotationCenterY: datum.rotationCenterY,
            translationX: datum.translationX,
            translationY: datum.translationY,
        };
    };
}
export function resetAxisSelectionFn(ctx) {
    const { visible: rangeVisible, min, max } = ctx;
    return (_node, datum) => {
        const y = datum.translationY;
        const visible = rangeVisible && y >= min && y <= max;
        return {
            y,
            translationY: 0,
            opacity: 1,
            visible,
        };
    };
}
export function resetAxisLabelSelectionFn() {
    return (_node, datum) => {
        return {
            x: datum.x,
            y: datum.y,
            translationY: datum.translationY,
            rotation: datum.rotation,
            rotationCenterX: datum.rotationCenterX,
        };
    };
}
export function resetAxisLineSelectionFn() {
    return (_node, datum) => {
        return Object.assign({}, datum);
    };
}
