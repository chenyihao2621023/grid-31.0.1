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
  triangle: Triangle
};
const MARKER_SUPPORTED_SHAPES = Object.keys(MARKER_SHAPES);
export function isMarkerShape(shape) {
  return typeof shape === 'string' && MARKER_SUPPORTED_SHAPES.includes(shape);
}
export function getMarker(shape = Square) {
  if (isMarkerShape(shape)) {
    return MARKER_SHAPES[shape];
  }
  if (typeof shape === 'function') {
    return shape;
  }
  return Square;
}