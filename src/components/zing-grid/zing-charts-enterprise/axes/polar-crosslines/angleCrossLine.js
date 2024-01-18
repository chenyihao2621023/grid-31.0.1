import { _ModuleSupport, _Scale, _Scene, _Util } from '@/components/zing-grid/zing-charts-community/main.js';
import { PolarCrossLine } from './polarCrossLine';
const { ChartAxisDirection, validateCrossLineValues } = _ModuleSupport;
const { Path, Sector, Text } = _Scene;
const { normalizeAngle360, isNumberEqual } = _Util;
export class AngleCrossLine extends PolarCrossLine {
    constructor() {
        super();
        this.direction = ChartAxisDirection.X;
        this.polygonNode = new Path();
        this.sectorNode = new Sector();
        this.lineNode = new Path();
        this.labelNode = new Text();
        this.group.append(this.polygonNode);
        this.group.append(this.sectorNode);
        this.group.append(this.lineNode);
        this.labelGroup.append(this.labelNode);
    }
    update(visible) {
        const { scale, shape, type, value, range } = this;
        if (!scale || !type || !validateCrossLineValues(type, value, range, scale)) {
            this.group.visible = false;
            this.labelGroup.visible = false;
            return;
        }
        this.group.visible = visible;
        this.labelGroup.visible = visible;
        if (type === 'line' && shape === 'circle' && scale instanceof _Scale.BandScale) {
            this.type = 'range';
            this.range = [value, value];
        }
        this.updateLineNode(visible);
        this.updatePolygonNode(visible);
        this.updateSectorNode(visible);
        this.updateLabelNode(visible);
    }
    updateLineNode(visible) {
        var _a, _b;
        const { scale, type, value, lineNode: line } = this;
        let angle;
        if (!visible || type !== 'line' || !scale || isNaN((angle = scale.convert(value)))) {
            line.visible = false;
            return;
        }
        const { axisInnerRadius, axisOuterRadius } = this;
        line.visible = true;
        line.stroke = this.stroke;
        line.strokeOpacity = (_a = this.strokeOpacity) !== null && _a !== void 0 ? _a : 1;
        line.strokeWidth = (_b = this.strokeWidth) !== null && _b !== void 0 ? _b : 1;
        line.fill = undefined;
        line.lineDash = this.lineDash;
        const x = axisOuterRadius * Math.cos(angle);
        const y = axisOuterRadius * Math.sin(angle);
        const x0 = axisInnerRadius * Math.cos(angle);
        const y0 = axisInnerRadius * Math.sin(angle);
        line.path.clear({ trackChanges: true });
        line.path.moveTo(x0, y0);
        line.path.lineTo(x, y);
        this.group.zIndex = AngleCrossLine.LINE_LAYER_ZINDEX;
    }
    updatePolygonNode(visible) {
        var _a;
        const { polygonNode: polygon, range, scale, shape, type } = this;
        let ticks;
        if (!visible || type !== 'range' || shape !== 'polygon' || !scale || !range || !(ticks = (_a = scale.ticks) === null || _a === void 0 ? void 0 : _a.call(scale))) {
            polygon.visible = false;
            return;
        }
        const { axisInnerRadius, axisOuterRadius } = this;
        const startIndex = ticks.indexOf(range[0]);
        const endIndex = ticks.indexOf(range[1]);
        const stops = startIndex <= endIndex
            ? ticks.slice(startIndex, endIndex + 1)
            : ticks.slice(startIndex).concat(ticks.slice(0, endIndex + 1));
        const angles = stops.map((value) => scale.convert(value));
        polygon.visible = true;
        this.setSectorNodeProps(polygon);
        const { path } = polygon;
        path.clear({ trackChanges: true });
        angles.forEach((angle, index) => {
            const x = axisOuterRadius * Math.cos(angle);
            const y = axisOuterRadius * Math.sin(angle);
            if (index === 0) {
                path.moveTo(x, y);
            }
            else {
                path.lineTo(x, y);
            }
        });
        if (axisInnerRadius === 0) {
            path.lineTo(0, 0);
        }
        else {
            angles
                .slice()
                .reverse()
                .forEach((angle) => {
                const x = axisInnerRadius * Math.cos(angle);
                const y = axisInnerRadius * Math.sin(angle);
                path.lineTo(x, y);
            });
        }
        polygon.path.closePath();
        this.group.zIndex = AngleCrossLine.RANGE_LAYER_ZINDEX;
    }
    updateSectorNode(visible) {
        var _a;
        const { sectorNode: sector, range, scale, shape, type } = this;
        if (!visible || type !== 'range' || shape !== 'circle' || !scale || !range) {
            sector.visible = false;
            return;
        }
        const { axisInnerRadius, axisOuterRadius } = this;
        const angles = range.map((value) => scale.convert(value));
        const step = (_a = scale.step) !== null && _a !== void 0 ? _a : 0;
        const padding = scale instanceof _Scale.BandScale ? step / 2 : 0;
        sector.visible = true;
        this.setSectorNodeProps(sector);
        sector.centerX = 0;
        sector.centerY = 0;
        sector.innerRadius = axisInnerRadius;
        sector.outerRadius = axisOuterRadius;
        sector.startAngle = angles[0] - padding;
        sector.endAngle = angles[1] + padding;
        this.group.zIndex = AngleCrossLine.RANGE_LAYER_ZINDEX;
    }
    updateLabelNode(visible) {
        var _a, _b;
        const { label, labelNode: node, range, scale, type } = this;
        if (!visible || label.enabled === false || !label.text || !scale || (type === 'range' && !range)) {
            node.visible = true;
            return;
        }
        const { axisInnerRadius, axisOuterRadius } = this;
        let labelX;
        let labelY;
        let rotation;
        let textBaseline;
        if (type === 'line') {
            const angle = normalizeAngle360(scale.convert(this.value));
            const angle270 = (3 * Math.PI) / 2;
            const isRightSide = isNumberEqual(angle, angle270) || angle > angle270 || angle < Math.PI / 2;
            const midX = ((axisInnerRadius + axisOuterRadius) / 2) * Math.cos(angle);
            const midY = ((axisInnerRadius + axisOuterRadius) / 2) * Math.sin(angle);
            labelX = midX + label.padding * Math.cos(angle + Math.PI / 2);
            labelY = midY + label.padding * Math.sin(angle + Math.PI / 2);
            textBaseline = isRightSide ? 'top' : 'bottom';
            rotation = isRightSide ? angle : angle - Math.PI;
        }
        else {
            const [startAngle, endAngle] = range.map((value) => normalizeAngle360(scale.convert(value)));
            let angle = (startAngle + endAngle) / 2;
            if (startAngle > endAngle) {
                angle -= Math.PI;
            }
            angle = normalizeAngle360(angle);
            const isBottomSide = (isNumberEqual(angle, 0) || angle > 0) && angle < Math.PI;
            let distance;
            const ticks = (_b = (_a = scale.ticks) === null || _a === void 0 ? void 0 : _a.call(scale)) !== null && _b !== void 0 ? _b : [];
            if (this.shape === 'circle' || ticks.length < 3) {
                distance = axisOuterRadius - label.padding;
            }
            else {
                distance = axisOuterRadius * Math.cos(Math.PI / ticks.length) - label.padding;
            }
            labelX = distance * Math.cos(angle);
            labelY = distance * Math.sin(angle);
            textBaseline = isBottomSide ? 'bottom' : 'top';
            rotation = isBottomSide ? angle - Math.PI / 2 : angle + Math.PI / 2;
        }
        this.setLabelNodeProps(node, labelX, labelY, textBaseline, rotation);
    }
}
AngleCrossLine.className = 'AngleCrossLine';
//# sourceMappingURL=angleCrossLine.js.map