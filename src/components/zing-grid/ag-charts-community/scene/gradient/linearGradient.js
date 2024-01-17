import { normalizeAngle360, toRadians } from '../../util/angle';
import { Gradient } from './gradient';
export class LinearGradient extends Gradient {
    constructor() {
        super(...arguments);
        this.angle = 0;
    }
    createGradient(ctx, bbox) {
        // Gradient 0° angle starts at top according to CSS spec
        const angleOffset = 90;
        const { stops, angle } = this;
        const radians = normalizeAngle360(toRadians(angle + angleOffset));
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        const w = bbox.width;
        const h = bbox.height;
        const cx = bbox.x + w * 0.5;
        const cy = bbox.y + h * 0.5;
        if (w > 0 && h > 0) {
            const diagonal = Math.sqrt(h * h + w * w) / 2;
            const diagonalAngle = Math.atan2(h, w);
            let quarteredAngle;
            if (radians < Math.PI / 2) {
                quarteredAngle = radians;
            }
            else if (radians < Math.PI) {
                quarteredAngle = Math.PI - radians;
            }
            else if (radians < (3 * Math.PI) / 2) {
                quarteredAngle = radians - Math.PI;
            }
            else {
                quarteredAngle = 2 * Math.PI - radians;
            }
            const l = diagonal * Math.abs(Math.cos(quarteredAngle - diagonalAngle));
            const gradient = ctx.createLinearGradient(cx + cos * l, cy + sin * l, cx - cos * l, cy - sin * l);
            stops.forEach((stop) => {
                gradient.addColorStop(stop.offset, stop.color);
            });
            return gradient;
        }
        return 'black';
    }
}
//# sourceMappingURL=linearGradient.js.map