var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BBox } from '../bbox';
import { Path2D } from '../path2D';
import { Path, ScenePathChangeDetection } from './path';
import { Shape } from './shape';
const epsilon = 1e-6;
const cornerEdges = (leadingEdge, trailingEdge, leadingInset, trailingInset, cornerRadius) => {
  let leadingClipped = false;
  let trailingClipped = false;
  let leading0 = trailingInset - Math.sqrt(Math.max(Math.pow(cornerRadius, 2) - Math.pow(leadingInset, 2), 0));
  let leading1 = 0;
  let trailing0 = 0;
  let trailing1 = leadingInset - Math.sqrt(Math.max(Math.pow(cornerRadius, 2) - Math.pow(trailingInset, 2), 0));
  if (leading0 > leadingEdge) {
    leadingClipped = true;
    leading0 = leadingEdge;
    leading1 = leadingInset - Math.sqrt(Math.max(Math.pow(cornerRadius, 2) - Math.pow(trailingInset - leadingEdge, 2)));
  } else if (leading0 < epsilon) {
    leading0 = 0;
  }
  if (trailing1 > trailingEdge) {
    trailingClipped = true;
    trailing0 = trailingInset - Math.sqrt(Math.max(Math.pow(cornerRadius, 2) - Math.pow(leadingInset - trailingEdge, 2)));
    trailing1 = trailingEdge;
  } else if (trailing1 < epsilon) {
    trailing1 = 0;
  }
  return {
    leading0,
    leading1,
    trailing0,
    trailing1,
    leadingClipped,
    trailingClipped
  };
};
const drawCorner = (path, {
  x0,
  y0,
  x1,
  y1,
  cx,
  cy
}, cornerRadius, move) => {
  if (move) {
    path.moveTo(x0, y0);
  }
  if (x0 !== x1 || y0 !== y1) {
    const r0 = Math.atan2(y0 - cy, x0 - cx);
    const r1 = Math.atan2(y1 - cy, x1 - cx);
    path.arc(cx, cy, cornerRadius, r0, r1);
  } else {
    path.lineTo(x0, y0);
  }
};
const insetCornerRadiusRect = (path, x, y, width, height, cornerRadii, cornerRadiusBbox) => {
  let {
    topLeft: topLeftCornerRadius,
    topRight: topRightCornerRadius,
    bottomRight: bottomRightCornerRadius,
    bottomLeft: bottomLeftCornerRadius
  } = cornerRadii;
  const maxVerticalCornerRadius = Math.max(topLeftCornerRadius + bottomLeftCornerRadius, topRightCornerRadius + bottomRightCornerRadius);
  const maxHorizontalCornerRadius = Math.max(topLeftCornerRadius + topRightCornerRadius, bottomLeftCornerRadius + bottomRightCornerRadius);
  if (maxVerticalCornerRadius <= 0 && maxHorizontalCornerRadius <= 0) {
    path.rect(x, y, width, height);
    return;
  } else if (cornerRadiusBbox == null && topLeftCornerRadius === topRightCornerRadius && topLeftCornerRadius === bottomRightCornerRadius && topLeftCornerRadius === bottomLeftCornerRadius) {
    path.roundRect(x, y, width, height, topLeftCornerRadius);
    return;
  }
  if (width < 0) {
    x += width;
    width = Math.abs(width);
  }
  if (height < 0) {
    y += height;
    height = Math.abs(height);
  }
  if (cornerRadiusBbox != null) {
    const x0 = Math.max(x, cornerRadiusBbox.x);
    const x1 = Math.min(x + width, cornerRadiusBbox.x + cornerRadiusBbox.width);
    const y0 = Math.max(y, cornerRadiusBbox.y);
    const y1 = Math.min(y + height, cornerRadiusBbox.y + cornerRadiusBbox.height);
    x = x0;
    y = y0;
    width = x1 - x0;
    height = y1 - y0;
  }
  if (width <= 0 || height <= 0) return;
  cornerRadiusBbox !== null && cornerRadiusBbox !== void 0 ? cornerRadiusBbox : cornerRadiusBbox = new BBox(x, y, width, height);
  const borderScale = Math.max(maxVerticalCornerRadius / cornerRadiusBbox.height, maxHorizontalCornerRadius / cornerRadiusBbox.width, 1);
  if (borderScale > 1) {
    topLeftCornerRadius /= borderScale;
    topRightCornerRadius /= borderScale;
    bottomRightCornerRadius /= borderScale;
    bottomLeftCornerRadius /= borderScale;
  }
  let drawTopLeftCorner = true;
  let drawTopRightCorner = true;
  let drawBottomRightCorner = true;
  let drawBottomLeftCorner = true;
  let topLeftCorner;
  let topRightCorner;
  let bottomRightCorner;
  let bottomLeftCorner;
  if (drawTopLeftCorner) {
    const nodes = cornerEdges(height, width, Math.max(cornerRadiusBbox.x + topLeftCornerRadius - x, 0), Math.max(cornerRadiusBbox.y + topLeftCornerRadius - y, 0), topLeftCornerRadius);
    if (nodes.leadingClipped) drawBottomLeftCorner = false;
    if (nodes.trailingClipped) drawTopRightCorner = false;
    const x0 = Math.max(x + nodes.leading1, x);
    const y0 = Math.max(y + nodes.leading0, y);
    const x1 = Math.max(x + nodes.trailing1, x);
    const y1 = Math.max(y + nodes.trailing0, y);
    const cx = cornerRadiusBbox.x + topLeftCornerRadius;
    const cy = cornerRadiusBbox.y + topLeftCornerRadius;
    topLeftCorner = {
      x0,
      y0,
      x1,
      y1,
      cx,
      cy
    };
  }
  if (drawTopRightCorner) {
    const nodes = cornerEdges(width, height, Math.max(cornerRadiusBbox.y + topRightCornerRadius - y, 0), Math.max(x + width - (cornerRadiusBbox.x + cornerRadiusBbox.width - topRightCornerRadius), 0), topRightCornerRadius);
    if (nodes.leadingClipped) drawTopLeftCorner = false;
    if (nodes.trailingClipped) drawBottomRightCorner = false;
    const x0 = Math.min(x + width - nodes.leading0, x + width);
    const y0 = Math.max(y + nodes.leading1, y);
    const x1 = Math.min(x + width - nodes.trailing0, x + width);
    const y1 = Math.max(y + nodes.trailing1, y);
    const cx = cornerRadiusBbox.x + cornerRadiusBbox.width - topRightCornerRadius;
    const cy = cornerRadiusBbox.y + topRightCornerRadius;
    topRightCorner = {
      x0,
      y0,
      x1,
      y1,
      cx,
      cy
    };
  }
  if (drawBottomRightCorner) {
    const nodes = cornerEdges(height, width, Math.max(x + width - (cornerRadiusBbox.x + cornerRadiusBbox.width - bottomRightCornerRadius), 0), Math.max(y + height - (cornerRadiusBbox.y + cornerRadiusBbox.height - bottomRightCornerRadius), 0), bottomRightCornerRadius);
    if (nodes.leadingClipped) drawTopRightCorner = false;
    if (nodes.trailingClipped) drawBottomLeftCorner = false;
    const x0 = Math.min(x + width - nodes.leading1, x + width);
    const y0 = Math.min(y + height - nodes.leading0, y + height);
    const x1 = Math.min(x + width - nodes.trailing1, x + width);
    const y1 = Math.min(y + height - nodes.trailing0, y + height);
    const cx = cornerRadiusBbox.x + cornerRadiusBbox.width - bottomRightCornerRadius;
    const cy = cornerRadiusBbox.y + cornerRadiusBbox.height - bottomRightCornerRadius;
    bottomRightCorner = {
      x0,
      y0,
      x1,
      y1,
      cx,
      cy
    };
  }
  if (drawBottomLeftCorner) {
    const nodes = cornerEdges(width, height, Math.max(y + height - (cornerRadiusBbox.y + cornerRadiusBbox.height - bottomLeftCornerRadius), 0), Math.max(cornerRadiusBbox.x + bottomLeftCornerRadius - x, 0), bottomLeftCornerRadius);
    if (nodes.leadingClipped) drawBottomRightCorner = false;
    if (nodes.trailingClipped) drawTopLeftCorner = false;
    const x0 = Math.max(x + nodes.leading0, x);
    const y0 = Math.min(y + height - nodes.leading1, y + height);
    const x1 = Math.max(x + nodes.trailing0, x);
    const y1 = Math.min(y + height - nodes.trailing1, y + height);
    const cx = cornerRadiusBbox.x + bottomLeftCornerRadius;
    const cy = cornerRadiusBbox.y + cornerRadiusBbox.height - bottomLeftCornerRadius;
    bottomLeftCorner = {
      x0,
      y0,
      x1,
      y1,
      cx,
      cy
    };
  }
  let didMove = false;
  if (drawTopLeftCorner && topLeftCorner != null) {
    drawCorner(path, topLeftCorner, topLeftCornerRadius, !didMove);
    didMove || (didMove = true);
  }
  if (drawTopRightCorner && topRightCorner != null) {
    drawCorner(path, topRightCorner, topRightCornerRadius, !didMove);
    didMove || (didMove = true);
  }
  if (drawBottomRightCorner && bottomRightCorner != null) {
    drawCorner(path, bottomRightCorner, bottomRightCornerRadius, !didMove);
    didMove || (didMove = true);
  }
  if (drawBottomLeftCorner && bottomLeftCorner != null) {
    drawCorner(path, bottomLeftCorner, bottomLeftCornerRadius, !didMove);
    didMove || (didMove = true);
  }
  path.closePath();
};
export class Rect extends Path {
  constructor() {
    super(...arguments);
    this.borderPath = new Path2D();
    this.x = 0;
    this.y = 0;
    this.width = 10;
    this.height = 10;
    this.topLeftCornerRadius = 0;
    this.topRightCornerRadius = 0;
    this.bottomRightCornerRadius = 0;
    this.bottomLeftCornerRadius = 0;
    this.cornerRadiusBbox = undefined;
    this.crisp = false;
    this.lastUpdatePathStrokeWidth = Shape.defaultStyles.strokeWidth;
    this.effectiveStrokeWidth = Shape.defaultStyles.strokeWidth;
    this.microPixelEffectOpacity = 1;
  }
  set cornerRadius(cornerRadius) {
    this.topLeftCornerRadius = cornerRadius;
    this.topRightCornerRadius = cornerRadius;
    this.bottomRightCornerRadius = cornerRadius;
    this.bottomLeftCornerRadius = cornerRadius;
  }
  isDirtyPath() {
    var _a;
    if (this.lastUpdatePathStrokeWidth !== this.strokeWidth) {
      return true;
    }
    return !!(this.path.isDirty() || this.borderPath.isDirty() || ((_a = this.clipPath) === null || _a === void 0 ? void 0 : _a.isDirty()));
  }
  updatePath() {
    var _a, _b, _c;
    const {
      path,
      borderPath,
      crisp,
      topLeftCornerRadius,
      topRightCornerRadius,
      bottomRightCornerRadius,
      bottomLeftCornerRadius
    } = this;
    let {
      x,
      y,
      width: w,
      height: h,
      strokeWidth,
      cornerRadiusBbox
    } = this;
    const pixelRatio = (_b = (_a = this.layerManager) === null || _a === void 0 ? void 0 : _a.canvas.pixelRatio) !== null && _b !== void 0 ? _b : 1;
    const pixelSize = 1 / pixelRatio;
    let microPixelEffectOpacity = 1;
    path.clear({
      trackChanges: true
    });
    borderPath.clear({
      trackChanges: true
    });
    if (crisp) {
      if (w <= pixelSize) {
        microPixelEffectOpacity *= w / pixelSize;
      }
      if (h <= pixelSize) {
        microPixelEffectOpacity *= h / pixelSize;
      }
      w = this.align(x, w);
      h = this.align(y, h);
      x = this.align(x);
      y = this.align(y);
      cornerRadiusBbox = cornerRadiusBbox != null ? new BBox(this.align(cornerRadiusBbox.x), this.align(cornerRadiusBbox.y), this.align(cornerRadiusBbox.x, cornerRadiusBbox.width), this.align(cornerRadiusBbox.y, cornerRadiusBbox.height)) : undefined;
    }
    if (strokeWidth) {
      if (w < pixelSize) {
        const lx = x + pixelSize / 2;
        borderPath.moveTo(lx, y);
        borderPath.lineTo(lx, y + h);
        strokeWidth = pixelSize;
        this.borderClipPath = undefined;
      } else if (h < pixelSize) {
        const ly = y + pixelSize / 2;
        borderPath.moveTo(x, ly);
        borderPath.lineTo(x + w, ly);
        strokeWidth = pixelSize;
        this.borderClipPath = undefined;
      } else if (strokeWidth < w && strokeWidth < h) {
        const halfStrokeWidth = strokeWidth / 2;
        x += halfStrokeWidth;
        y += halfStrokeWidth;
        w -= strokeWidth;
        h -= strokeWidth;
        const adjustedCornerRadiusBbox = cornerRadiusBbox === null || cornerRadiusBbox === void 0 ? void 0 : cornerRadiusBbox.clone().shrink(halfStrokeWidth);
        const cornerRadii = {
          topLeft: topLeftCornerRadius > 0 ? topLeftCornerRadius - strokeWidth : 0,
          topRight: topRightCornerRadius > 0 ? topRightCornerRadius - strokeWidth : 0,
          bottomRight: bottomRightCornerRadius > 0 ? bottomRightCornerRadius - strokeWidth : 0,
          bottomLeft: bottomLeftCornerRadius > 0 ? bottomLeftCornerRadius - strokeWidth : 0
        };
        this.borderClipPath = undefined;
        insetCornerRadiusRect(path, x, y, w, h, cornerRadii, adjustedCornerRadiusBbox);
        insetCornerRadiusRect(borderPath, x, y, w, h, cornerRadii, adjustedCornerRadiusBbox);
      } else {
        this.borderClipPath = (_c = this.borderClipPath) !== null && _c !== void 0 ? _c : new Path2D();
        this.borderClipPath.clear({
          trackChanges: true
        });
        this.borderClipPath.rect(x, y, w, h);
        borderPath.rect(x, y, w, h);
      }
    } else {
      const cornerRadii = {
        topLeft: topLeftCornerRadius,
        topRight: topRightCornerRadius,
        bottomRight: bottomRightCornerRadius,
        bottomLeft: bottomLeftCornerRadius
      };
      this.borderClipPath = undefined;
      insetCornerRadiusRect(path, x, y, w, h, cornerRadii, cornerRadiusBbox);
    }
    this.effectiveStrokeWidth = strokeWidth;
    this.lastUpdatePathStrokeWidth = strokeWidth;
    this.microPixelEffectOpacity = microPixelEffectOpacity;
  }
  computeBBox() {
    const {
      x,
      y,
      width,
      height
    } = this;
    return new BBox(x, y, width, height);
  }
  isPointInPath(x, y) {
    const point = this.transformPoint(x, y);
    const bbox = this.computeBBox();
    return bbox.containsPoint(point.x, point.y);
  }
  applyFillAlpha(ctx) {
    const {
      fillOpacity,
      microPixelEffectOpacity,
      opacity
    } = this;
    const {
      globalAlpha
    } = ctx;
    ctx.globalAlpha = globalAlpha * opacity * fillOpacity * microPixelEffectOpacity;
  }
  renderStroke(ctx) {
    const {
      stroke,
      effectiveStrokeWidth,
      borderPath,
      borderClipPath,
      opacity,
      microPixelEffectOpacity
    } = this;
    const borderActive = !!stroke && !!effectiveStrokeWidth;
    if (borderActive) {
      const {
        strokeOpacity,
        lineDash,
        lineDashOffset,
        lineCap,
        lineJoin
      } = this;
      if (borderClipPath) {
        borderClipPath.draw(ctx);
        ctx.clip();
      }
      borderPath.draw(ctx);
      const {
        globalAlpha
      } = ctx;
      ctx.strokeStyle = stroke;
      ctx.globalAlpha = globalAlpha * opacity * strokeOpacity * microPixelEffectOpacity;
      ctx.lineWidth = effectiveStrokeWidth;
      if (lineDash) {
        ctx.setLineDash(lineDash);
      }
      if (lineDashOffset) {
        ctx.lineDashOffset = lineDashOffset;
      }
      if (lineCap) {
        ctx.lineCap = lineCap;
      }
      if (lineJoin) {
        ctx.lineJoin = lineJoin;
      }
      ctx.stroke();
      ctx.globalAlpha = globalAlpha;
    }
  }
}
Rect.className = 'Rect';
__decorate([ScenePathChangeDetection()], Rect.prototype, "x", void 0);
__decorate([ScenePathChangeDetection()], Rect.prototype, "y", void 0);
__decorate([ScenePathChangeDetection()], Rect.prototype, "width", void 0);
__decorate([ScenePathChangeDetection()], Rect.prototype, "height", void 0);
__decorate([ScenePathChangeDetection()], Rect.prototype, "topLeftCornerRadius", void 0);
__decorate([ScenePathChangeDetection()], Rect.prototype, "topRightCornerRadius", void 0);
__decorate([ScenePathChangeDetection()], Rect.prototype, "bottomRightCornerRadius", void 0);
__decorate([ScenePathChangeDetection()], Rect.prototype, "bottomLeftCornerRadius", void 0);
__decorate([ScenePathChangeDetection()], Rect.prototype, "cornerRadiusBbox", void 0);
__decorate([ScenePathChangeDetection()], Rect.prototype, "crisp", void 0);