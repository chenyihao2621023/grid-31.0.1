import { Line } from '../scene/shape/line';
import { Rect } from '../scene/shape/rect';
export function invertShapeDirection(...supportedShapes) {
  for (const shape of supportedShapes) {
    if (shape instanceof Rect) {
      const {
        x,
        y,
        width,
        height
      } = shape;
      shape.setProperties({
        x: y,
        y: x,
        width: height,
        height: width
      });
    } else if (shape instanceof Line) {
      const {
        x1,
        y1,
        x2,
        y2
      } = shape;
      shape.setProperties({
        x1: y1,
        y1: x1,
        x2: y2,
        y2: x2
      });
    }
  }
}