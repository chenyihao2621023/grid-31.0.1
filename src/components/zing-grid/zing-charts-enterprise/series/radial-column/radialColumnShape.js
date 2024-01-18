var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _Scene, _Util } from '@/components/zing-grid/zing-charts-community/main.js';
const { Path, Path2D, ScenePathChangeDetection } = _Scene;
const { angleBetween, isNumberEqual, normalizeAngle360 } = _Util;
function rotatePoint(x, y, rotation) {
    const radius = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    const angle = Math.atan2(y, x);
    const rotated = angle + rotation;
    return {
        x: Math.cos(rotated) * radius,
        y: Math.sin(rotated) * radius,
    };
}
export class RadialColumnShape extends Path {
    constructor() {
        super(...arguments);
        this.borderPath = new Path2D();
        this.isBeveled = true;
        this.columnWidth = 0;
        this.startAngle = 0;
        this.endAngle = 0;
        this.outerRadius = 0;
        this.innerRadius = 0;
        this.axisInnerRadius = 0;
        this.axisOuterRadius = 0;
        this.isRadiusAxisReversed = false;
    }
    getRotation() {
        const { startAngle, endAngle } = this;
        const midAngle = angleBetween(startAngle, endAngle);
        return normalizeAngle360(startAngle + midAngle / 2 + Math.PI / 2);
    }
    updatePath() {
        const { isBeveled } = this;
        if (isBeveled) {
            this.updateBeveledPath();
        }
        else {
            this.updateRectangularPath();
        }
        this.checkPathDirty();
    }
    updateRectangularPath() {
        const { columnWidth, innerRadius, outerRadius, path } = this;
        const left = -columnWidth / 2;
        const right = columnWidth / 2;
        const top = -outerRadius;
        const bottom = -innerRadius;
        const rotation = this.getRotation();
        const points = [
            [left, bottom],
            [left, top],
            [right, top],
            [right, bottom],
            [left, bottom],
        ].map(([x, y]) => rotatePoint(x, y, rotation));
        path.clear({ trackChanges: true });
        path.moveTo(points[0].x, points[0].y);
        path.lineTo(points[1].x, points[1].y);
        path.lineTo(points[2].x, points[2].y);
        path.lineTo(points[3].x, points[3].y);
        path.lineTo(points[0].x, points[0].y);
        path.closePath();
    }
    updateBeveledPath() {
        const { columnWidth, path, outerRadius, innerRadius, axisInnerRadius, axisOuterRadius, isRadiusAxisReversed } = this;
        const isStackBottom = isNumberEqual(innerRadius, axisInnerRadius);
        const sideRotation = Math.asin(columnWidth / 2 / innerRadius);
        const pointRotation = this.getRotation();
        const rotate = (x, y) => rotatePoint(x, y, pointRotation);
        const getTriangleHypotenuse = (leg, otherLeg) => Math.sqrt(Math.pow(leg, 2) + Math.pow(otherLeg, 2));
        const getTriangleLeg = (hypotenuse, otherLeg) => {
            if (otherLeg > hypotenuse) {
                return 0;
            }
            return Math.sqrt(Math.pow(hypotenuse, 2) - Math.pow(otherLeg, 2));
        };
        const compare = (value, otherValue, lessThan) => lessThan ? value < otherValue : value > otherValue;
        // Avoid the connecting lines to be too long
        const shouldConnectBottomCircle = isStackBottom && !isNaN(sideRotation) && sideRotation < Math.PI / 6;
        let left = -columnWidth / 2;
        let right = columnWidth / 2;
        const top = -outerRadius;
        const bottom = -innerRadius * (shouldConnectBottomCircle ? Math.cos(sideRotation) : 1);
        const hasBottomIntersection = compare(axisOuterRadius, getTriangleHypotenuse(innerRadius, columnWidth / 2), !isRadiusAxisReversed);
        if (hasBottomIntersection) {
            // Crop bottom side overflowing outer radius
            const bottomIntersectionX = getTriangleLeg(axisOuterRadius, innerRadius);
            left = -bottomIntersectionX;
            right = bottomIntersectionX;
        }
        path.clear({ trackChanges: true });
        // Bottom-left point
        const bottomLeftPt = rotate(left, bottom);
        path.moveTo(bottomLeftPt.x, bottomLeftPt.y);
        // Top
        const isEmpty = isNumberEqual(innerRadius, outerRadius);
        const hasSideIntersection = compare(axisOuterRadius, getTriangleHypotenuse(outerRadius, columnWidth / 2), !isRadiusAxisReversed);
        if (isEmpty && shouldConnectBottomCircle) {
            // A single line across the axis inner radius
            path.arc(0, 0, innerRadius, normalizeAngle360(-sideRotation - Math.PI / 2) + pointRotation, normalizeAngle360(sideRotation - Math.PI / 2) + pointRotation, false);
        }
        else if (hasSideIntersection) {
            // Crop top side overflowing outer radius
            const sideIntersectionY = -getTriangleLeg(axisOuterRadius, columnWidth / 2);
            const topIntersectionX = getTriangleLeg(axisOuterRadius, outerRadius);
            if (!hasBottomIntersection) {
                const topLeftPt = rotate(left, sideIntersectionY);
                path.lineTo(topLeftPt.x, topLeftPt.y);
            }
            path.arc(0, 0, axisOuterRadius, Math.atan2(sideIntersectionY, left) + pointRotation, Math.atan2(top, -topIntersectionX) + pointRotation, false);
            if (!isNumberEqual(topIntersectionX, 0)) {
                // Connecting line between two top bevels
                const topRightBevelPt = rotate(topIntersectionX, top);
                path.lineTo(topRightBevelPt.x, topRightBevelPt.y);
            }
            path.arc(0, 0, axisOuterRadius, Math.atan2(top, topIntersectionX) + pointRotation, Math.atan2(sideIntersectionY, right) + pointRotation, false);
        }
        else {
            // Basic connecting line
            const topLeftPt = rotate(left, top);
            const topRightPt = rotate(right, top);
            path.lineTo(topLeftPt.x, topLeftPt.y);
            path.lineTo(topRightPt.x, topRightPt.y);
        }
        // Bottom
        const bottomRightPt = rotate(right, bottom);
        path.lineTo(bottomRightPt.x, bottomRightPt.y);
        if (shouldConnectBottomCircle) {
            // Connect column with inner circle
            path.arc(0, 0, innerRadius, normalizeAngle360(sideRotation - Math.PI / 2) + pointRotation, normalizeAngle360(-sideRotation - Math.PI / 2) + pointRotation, true);
        }
        else {
            const bottomLeftPt = rotate(left, bottom);
            path.lineTo(bottomLeftPt.x, bottomLeftPt.y);
        }
        path.closePath();
    }
}
RadialColumnShape.className = 'RadialColumnShape';
__decorate([
    ScenePathChangeDetection()
], RadialColumnShape.prototype, "isBeveled", void 0);
__decorate([
    ScenePathChangeDetection()
], RadialColumnShape.prototype, "columnWidth", void 0);
__decorate([
    ScenePathChangeDetection()
], RadialColumnShape.prototype, "startAngle", void 0);
__decorate([
    ScenePathChangeDetection()
], RadialColumnShape.prototype, "endAngle", void 0);
__decorate([
    ScenePathChangeDetection()
], RadialColumnShape.prototype, "outerRadius", void 0);
__decorate([
    ScenePathChangeDetection()
], RadialColumnShape.prototype, "innerRadius", void 0);
__decorate([
    ScenePathChangeDetection()
], RadialColumnShape.prototype, "axisInnerRadius", void 0);
__decorate([
    ScenePathChangeDetection()
], RadialColumnShape.prototype, "axisOuterRadius", void 0);
__decorate([
    ScenePathChangeDetection()
], RadialColumnShape.prototype, "isRadiusAxisReversed", void 0);
export function getRadialColumnWidth(startAngle, endAngle, axisOuterRadius, columnWidthRatio, maxColumnWidthRatio) {
    const rotation = angleBetween(startAngle, endAngle);
    const pad = (rotation * (1 - columnWidthRatio)) / 2;
    startAngle += pad;
    endAngle -= pad;
    if (rotation >= 2 * Math.PI) {
        const midAngle = startAngle + rotation / 2;
        startAngle = midAngle - Math.PI;
        endAngle = midAngle + Math.PI;
    }
    const startX = axisOuterRadius * Math.cos(startAngle);
    const startY = axisOuterRadius * Math.sin(startAngle);
    const endX = axisOuterRadius * Math.cos(endAngle);
    const endY = axisOuterRadius * Math.sin(endAngle);
    const colWidth = Math.floor(Math.sqrt(Math.pow((startX - endX), 2) + Math.pow((startY - endY), 2)));
    const maxWidth = 2 * axisOuterRadius * maxColumnWidthRatio;
    return Math.max(1, Math.min(maxWidth, colWidth));
}
//# sourceMappingURL=radialColumnShape.js.map