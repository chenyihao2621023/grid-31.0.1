import { Circle } from './circle';
import { Cross } from './cross';
import { Diamond } from './diamond';
import { Heart } from './heart';
import { Plus } from './plus';
import { Square } from './square';
import { Triangle } from './triangle';
const MARKER_SHAPES = {
    circle: Circle,
    cross: Cross,
    diamond: Diamond,
    heart: Heart,
    plus: Plus,
    square: Square,
    triangle: Triangle,
};
const MARKER_SUPPORTED_SHAPES = Object.keys(MARKER_SHAPES);
export function isMarkerShape(shape) {
    return typeof shape === 'string' && MARKER_SUPPORTED_SHAPES.includes(shape);
}
// This function is in its own file because putting it into SeriesMarker makes the Legend
// suddenly aware of the series (it's an agnostic component), and putting it into Marker
// introduces circular dependencies.
export function getMarker(shape = Square) {
    if (isMarkerShape(shape)) {
        return MARKER_SHAPES[shape];
    }
    if (typeof shape === 'function') {
        return shape;
    }
    return Square;
}
//# sourceMappingURL=util.js.map