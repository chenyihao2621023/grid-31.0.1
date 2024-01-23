var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { isPointInSector } from '../../util/sector';
import { BBox } from '../bbox';
import { Path, ScenePathChangeDetection } from './path';
export class Sector extends Path {
    constructor() {
        super(...arguments);
        this.centerX = 0;
        this.centerY = 0;
        this.innerRadius = 10;
        this.outerRadius = 20;
        this.startAngle = 0;
        this.endAngle = Math.PI * 2;
        this.angleOffset = 0;
        this.inset = 0;
    }
    computeBBox() {
        const radius = this.outerRadius;
        return new BBox(this.centerX - radius, this.centerY - radius, radius * 2, radius * 2);
    }
    updatePath() {
        const path = this.path;
        const { angleOffset, inset } = this;
        const startAngle = this.startAngle + angleOffset;
        const endAngle = this.endAngle + angleOffset;
        const sweep = startAngle <= endAngle ? endAngle - startAngle : Math.PI * 2 - (startAngle - endAngle);
        const innerRadius = Math.max(Math.min(this.innerRadius, this.outerRadius) + inset, 0);
        const outerRadius = Math.max(Math.max(this.innerRadius, this.outerRadius) - inset, 0);
        const fullPie = sweep >= 2 * Math.PI;
        const centerX = this.centerX;
        const centerY = this.centerY;
        path.clear();
        if (fullPie) {
            path.arc(centerX, centerY, outerRadius, startAngle, endAngle);
            if (innerRadius > inset) {
                path.moveTo(centerX + innerRadius * Math.cos(endAngle), centerY + innerRadius * Math.sin(endAngle));
                path.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
            }
        }
        else {
            const innerAngleOffset = innerRadius > 0 ? inset / innerRadius : 0;
            const outerAngleOffset = outerRadius > 0 ? inset / outerRadius : 0;
            const outerAngleExceeded = sweep < 2 * outerAngleOffset;
            if (outerAngleExceeded)
                return;
            const innerAngleExceeded = innerRadius <= inset || sweep < 2 * innerAngleOffset;
            if (innerAngleExceeded) {
                // Draw a wedge on a cartesian co-ordinate with radius `sweep`
                // Inset from bottom - i.e. y = innerRadius
                // Inset the top - i.e. y = (x - x0) * tan(sweep)
                // Form a right angle from the wedge with hypotenuse x0 and an opposite side of innerRadius
                // Gives x0 = inset * sin(sweep)
                // y = inset = (x - inset * sin(sweep)) * tan(sweep) - solve for x
                // This formula has limits (i.e. sweep being >= a quarter turn),
                // but the bounds for x should be [innerRadius, outerRadius)
                const x = sweep < Math.PI * 0.5 ? (inset * (1 + Math.cos(sweep))) / Math.sin(sweep) : NaN;
                // r = sqrt(x**2 + y**2)
                let r;
                if (x > 0 && x < outerRadius) {
                    // Even within the formula limits, floating point precision isn't always enough,
                    // so ensure we never go less than the inner radius
                    r = Math.max(Math.hypot(inset, x), innerRadius);
                }
                else {
                    // Formula limits exceeded - just use the inner radius
                    r = innerRadius;
                }
                const midAngle = startAngle + sweep * 0.5;
                path.moveTo(centerX + r * Math.cos(midAngle), centerY + r * Math.sin(midAngle));
            }
            else {
                path.moveTo(centerX + innerRadius * Math.cos(startAngle + innerAngleOffset), centerY + innerRadius * Math.sin(startAngle + innerAngleOffset));
            }
            path.arc(centerX, centerY, outerRadius, startAngle + outerAngleOffset, endAngle - outerAngleOffset);
            if (innerAngleExceeded) {
                // Ignore - completed by closePath
            }
            else if (innerRadius > 0) {
                path.arc(centerX, centerY, innerRadius, endAngle - innerAngleOffset, startAngle + innerAngleOffset, true);
            }
            else {
                path.lineTo(centerX, centerY);
            }
        }
        path.closePath();
        this.dirtyPath = false;
    }
    isPointInPath(x, y) {
        const { angleOffset } = this;
        const startAngle = this.startAngle + angleOffset;
        const endAngle = this.endAngle + angleOffset;
        const innerRadius = Math.min(this.innerRadius, this.outerRadius);
        const outerRadius = Math.max(this.innerRadius, this.outerRadius);
        const point = this.transformPoint(x, y);
        return isPointInSector(point.x, point.y, { startAngle, endAngle, innerRadius, outerRadius });
    }
}
Sector.className = 'Sector';
__decorate([
    ScenePathChangeDetection()
], Sector.prototype, "centerX", void 0);
__decorate([
    ScenePathChangeDetection()
], Sector.prototype, "centerY", void 0);
__decorate([
    ScenePathChangeDetection()
], Sector.prototype, "innerRadius", void 0);
__decorate([
    ScenePathChangeDetection()
], Sector.prototype, "outerRadius", void 0);
__decorate([
    ScenePathChangeDetection()
], Sector.prototype, "startAngle", void 0);
__decorate([
    ScenePathChangeDetection()
], Sector.prototype, "endAngle", void 0);
__decorate([
    ScenePathChangeDetection()
], Sector.prototype, "angleOffset", void 0);
__decorate([
    ScenePathChangeDetection()
], Sector.prototype, "inset", void 0);
