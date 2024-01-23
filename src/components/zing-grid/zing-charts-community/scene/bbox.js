import { nearestSquared } from './nearest';
export class BBox {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
  clone() {
    const {
      x,
      y,
      width,
      height
    } = this;
    return new BBox(x, y, width, height);
  }
  equals(other) {
    return this.x === other.x && this.y === other.y && this.width === other.width && this.height === other.height;
  }
  containsPoint(x, y) {
    return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;
  }
  collidesBBox(other) {
    return this.x < other.x + other.width && this.x + this.width > other.x && this.y < other.y + other.height && this.y + this.height > other.y;
  }
  isInfinite() {
    return Math.abs(this.x) === Infinity || Math.abs(this.y) === Infinity || Math.abs(this.width) === Infinity || Math.abs(this.height) === Infinity;
  }
  distanceSquared(point) {
    if (this.containsPoint(point.x, point.y)) {
      return 0;
    }
    const dx = point.x - Math.max(this.x, Math.min(point.x, this.x + this.width));
    const dy = point.y - Math.max(this.y, Math.min(point.y, this.y + this.height));
    return dx * dx + dy * dy;
  }
  static nearestBox(point, boxes) {
    return nearestSquared(point, boxes);
  }
  shrink(amount, position) {
    const apply = (pos, amt) => {
      switch (pos) {
        case 'top':
          this.y += amt;
        case 'bottom':
          this.height -= amt;
          break;
        case 'left':
          this.x += amt;
        case 'right':
          this.width -= amt;
          break;
        case 'vertical':
          this.y += amt;
          this.height -= amt * 2;
          break;
        case 'horizontal':
          this.x += amt;
          this.width -= amt * 2;
          break;
        case undefined:
          this.x += amt;
          this.width -= amt * 2;
          this.y += amt;
          this.height -= amt * 2;
          break;
        default:
      }
    };
    if (typeof amount === 'number') {
      apply(position, amount);
    } else if (typeof amount === 'object') {
      Object.entries(amount).forEach(([pos, amt]) => apply(pos, amt));
    }
    return this;
  }
  grow(amount, position) {
    if (typeof amount === 'number') {
      this.shrink(-amount, position);
    } else {
      const paddingCopy = Object.assign({}, amount);
      for (const key in paddingCopy) {
        paddingCopy[key] *= -1;
      }
      this.shrink(paddingCopy);
    }
    return this;
  }
  static merge(boxes) {
    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;
    boxes.forEach(box => {
      if (box.x < left) {
        left = box.x;
      }
      if (box.y < top) {
        top = box.y;
      }
      if (box.x + box.width > right) {
        right = box.x + box.width;
      }
      if (box.y + box.height > bottom) {
        bottom = box.y + box.height;
      }
    });
    return new BBox(left, top, right - left, bottom - top);
  }
}
BBox.zero = new BBox(0, 0, 0, 0);