import { BBox } from './bbox';
export class Matrix {
  get e() {
    return [...this.elements];
  }
  constructor(elements = [1, 0, 0, 1, 0, 0]) {
    this.elements = elements;
  }
  setElements(elements) {
    const e = this.elements;
    e[0] = elements[0];
    e[1] = elements[1];
    e[2] = elements[2];
    e[3] = elements[3];
    e[4] = elements[4];
    e[5] = elements[5];
    return this;
  }
  get identity() {
    const e = this.elements;
    return e[0] === 1 && e[1] === 0 && e[2] === 0 && e[3] === 1 && e[4] === 0 && e[5] === 0;
  }
  AxB(A, B, C) {
    const a = A[0] * B[0] + A[2] * B[1],
      b = A[1] * B[0] + A[3] * B[1],
      c = A[0] * B[2] + A[2] * B[3],
      d = A[1] * B[2] + A[3] * B[3],
      e = A[0] * B[4] + A[2] * B[5] + A[4],
      f = A[1] * B[4] + A[3] * B[5] + A[5];
    C = C !== null && C !== void 0 ? C : A;
    C[0] = a;
    C[1] = b;
    C[2] = c;
    C[3] = d;
    C[4] = e;
    C[5] = f;
  }
  multiplySelf(other) {
    this.AxB(this.elements, other.elements);
    return this;
  }
  multiply(other) {
    const elements = new Array(6);
    this.AxB(this.elements, other.elements, elements);
    return new Matrix(elements);
  }
  preMultiplySelf(other) {
    this.AxB(other.elements, this.elements, this.elements);
    return this;
  }
  inverse() {
    const el = this.elements;
    let a = el[0],
      b = el[1],
      c = el[2],
      d = el[3];
    const e = el[4],
      f = el[5];
    const rD = 1 / (a * d - b * c);
    a *= rD;
    b *= rD;
    c *= rD;
    d *= rD;
    return new Matrix([d, -b, -c, a, c * f - d * e, b * e - a * f]);
  }
  inverseTo(other) {
    const el = this.elements;
    let a = el[0],
      b = el[1],
      c = el[2],
      d = el[3];
    const e = el[4],
      f = el[5];
    const rD = 1 / (a * d - b * c);
    a *= rD;
    b *= rD;
    c *= rD;
    d *= rD;
    other.setElements([d, -b, -c, a, c * f - d * e, b * e - a * f]);
    return this;
  }
  invertSelf() {
    const el = this.elements;
    let a = el[0],
      b = el[1],
      c = el[2],
      d = el[3];
    const e = el[4],
      f = el[5];
    const rD = 1 / (a * d - b * c);
    a *= rD;
    b *= rD;
    c *= rD;
    d *= rD;
    el[0] = d;
    el[1] = -b;
    el[2] = -c;
    el[3] = a;
    el[4] = c * f - d * e;
    el[5] = b * e - a * f;
    return this;
  }
  transformPoint(x, y) {
    const e = this.elements;
    return {
      x: x * e[0] + y * e[2] + e[4],
      y: x * e[1] + y * e[3] + e[5]
    };
  }
  transformBBox(bbox, target) {
    const elements = this.elements;
    const xx = elements[0];
    const xy = elements[1];
    const yx = elements[2];
    const yy = elements[3];
    const h_w = bbox.width * 0.5;
    const h_h = bbox.height * 0.5;
    const cx = bbox.x + h_w;
    const cy = bbox.y + h_h;
    const w = Math.abs(h_w * xx) + Math.abs(h_h * yx);
    const h = Math.abs(h_w * xy) + Math.abs(h_h * yy);
    if (!target) {
      target = new BBox(0, 0, 0, 0);
    }
    target.x = cx * xx + cy * yx + elements[4] - w;
    target.y = cx * xy + cy * yy + elements[5] - h;
    target.width = w + w;
    target.height = h + h;
    return target;
  }
  toContext(ctx) {
    if (this.identity) {
      return;
    }
    const e = this.elements;
    ctx.transform(e[0], e[1], e[2], e[3], e[4], e[5]);
  }
  static flyweight(sourceMatrix) {
    return Matrix.instance.setElements(sourceMatrix.elements);
  }
  static updateTransformMatrix(matrix, scalingX, scalingY, rotation, translationX, translationY, opts) {
    const [bbcx, bbcy] = [0, 0];
    const sx = scalingX;
    const sy = scalingY;
    let scx;
    let scy;
    if (sx === 1 && sy === 1) {
      scx = 0;
      scy = 0;
    } else {
      scx = (opts === null || opts === void 0 ? void 0 : opts.scalingCenterX) == null ? bbcx : opts === null || opts === void 0 ? void 0 : opts.scalingCenterX;
      scy = (opts === null || opts === void 0 ? void 0 : opts.scalingCenterY) == null ? bbcy : opts === null || opts === void 0 ? void 0 : opts.scalingCenterY;
    }
    const r = rotation;
    const cos = Math.cos(r);
    const sin = Math.sin(r);
    let rcx;
    let rcy;
    if (r === 0) {
      rcx = 0;
      rcy = 0;
    } else {
      rcx = (opts === null || opts === void 0 ? void 0 : opts.rotationCenterX) == null ? bbcx : opts === null || opts === void 0 ? void 0 : opts.rotationCenterX;
      rcy = (opts === null || opts === void 0 ? void 0 : opts.rotationCenterY) == null ? bbcy : opts === null || opts === void 0 ? void 0 : opts.rotationCenterY;
    }
    const tx = translationX;
    const ty = translationY;
    const tx4 = scx * (1 - sx) - rcx;
    const ty4 = scy * (1 - sy) - rcy;
    matrix.setElements([cos * sx, sin * sx, -sin * sy, cos * sy, cos * tx4 - sin * ty4 + rcx + tx, sin * tx4 + cos * ty4 + rcy + ty]);
    return matrix;
  }
  static fromContext(ctx) {
    const domMatrix = ctx.getTransform();
    return new Matrix([domMatrix.a, domMatrix.b, domMatrix.c, domMatrix.d, domMatrix.e, domMatrix.f]);
  }
}
Matrix.instance = new Matrix();