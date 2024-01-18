var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _ModuleSupport, _Scene, _Util } from '@/components/zing-grid/zing-charts-community/main.js';
import { RadiusCrossLine } from '../polar-crosslines/radiusCrossLine';
const { assignJsonApplyConstructedArray, ChartAxisDirection, Default, Layers, DEGREE, MIN_SPACING, BOOLEAN, Validate } = _ModuleSupport;
const { Caption, Group, Path, Selection } = _Scene;
const { isNumberEqual, normalizeAngle360, toRadians } = _Util;
class RadiusAxisTick extends _ModuleSupport.AxisTick {
    constructor() {
        super(...arguments);
        this.maxSpacing = NaN;
    }
}
__decorate([
    Validate(MIN_SPACING),
    Default(NaN)
], RadiusAxisTick.prototype, "maxSpacing", void 0);
class RadiusAxisLabel extends _ModuleSupport.AxisLabel {
    constructor() {
        super(...arguments);
        this.autoRotateAngle = 335;
    }
}
__decorate([
    Validate(BOOLEAN, { optional: true })
], RadiusAxisLabel.prototype, "autoRotate", void 0);
__decorate([
    Validate(DEGREE)
], RadiusAxisLabel.prototype, "autoRotateAngle", void 0);
export class RadiusAxis extends _ModuleSupport.PolarAxis {
    constructor(moduleCtx, scale) {
        super(moduleCtx, scale);
        this.positionAngle = 0;
        this.gridPathGroup = this.gridGroup.appendChild(new Group({
            name: `${this.id}-gridPaths`,
            zIndex: Layers.AXIS_GRID_ZINDEX,
        }));
        this.gridPathSelection = Selection.select(this.gridPathGroup, Path);
    }
    get direction() {
        return ChartAxisDirection.Y;
    }
    assignCrossLineArrayConstructor(crossLines) {
        assignJsonApplyConstructedArray(crossLines, RadiusCrossLine);
    }
    getAxisTransform() {
        const maxRadius = this.scale.range[0];
        const { translation, positionAngle, innerRadiusRatio } = this;
        const innerRadius = maxRadius * innerRadiusRatio;
        const rotation = toRadians(positionAngle);
        return {
            translationX: translation.x,
            translationY: translation.y - maxRadius - innerRadius,
            rotation,
            rotationCenterX: 0,
            rotationCenterY: maxRadius + innerRadius,
        };
    }
    updateSelections(lineData, data, params) {
        var _a;
        super.updateSelections(lineData, data, params);
        const { gridLine: { enabled, style, width }, shape, } = this;
        if (!style) {
            return;
        }
        const ticks = this.prepareTickData(data);
        const styleCount = style.length;
        const setStyle = (node, index) => {
            const { stroke, lineDash } = style[index % styleCount];
            node.stroke = stroke;
            node.strokeWidth = width;
            node.lineDash = lineDash;
            node.fill = undefined;
        };
        const [startAngle, endAngle] = (_a = this.gridRange) !== null && _a !== void 0 ? _a : [0, 2 * Math.PI];
        const isFullCircle = isNumberEqual(endAngle - startAngle, 2 * Math.PI);
        const drawCircleShape = (node, value) => {
            const { path } = node;
            path.clear({ trackChanges: true });
            const radius = this.getTickRadius(value);
            if (isFullCircle) {
                path.moveTo(radius, 0);
                path.arc(0, 0, radius, 0, 2 * Math.PI);
            }
            else {
                path.moveTo(radius * Math.cos(startAngle), radius * Math.sin(startAngle));
                path.arc(0, 0, radius, normalizeAngle360(startAngle), normalizeAngle360(endAngle));
            }
            if (isFullCircle) {
                path.closePath();
            }
        };
        const drawPolygonShape = (node, value) => {
            const { path } = node;
            const angles = this.gridAngles;
            path.clear({ trackChanges: true });
            if (!angles || angles.length < 3) {
                return;
            }
            const radius = this.getTickRadius(value);
            angles.forEach((angle, i) => {
                const x = radius * Math.cos(angle);
                const y = radius * Math.sin(angle);
                if (i === 0) {
                    path.moveTo(x, y);
                }
                else {
                    path.lineTo(x, y);
                }
                angles.forEach((angle, i) => {
                    const x = radius * Math.cos(angle);
                    const y = radius * Math.sin(angle);
                    if (i === 0) {
                        path.moveTo(x, y);
                    }
                    else {
                        path.lineTo(x, y);
                    }
                });
                path.closePath();
            });
            path.closePath();
        };
        this.gridPathSelection.update(enabled ? ticks : []).each((node, value, index) => {
            setStyle(node, index);
            if (shape === 'circle') {
                drawCircleShape(node, value);
            }
            else {
                drawPolygonShape(node, value);
            }
        });
    }
    updateTitle() {
        var _a;
        const identityFormatter = (params) => params.defaultValue;
        const { title, _titleCaption, range: requestedRange, moduleCtx: { callbackCache }, } = this;
        const { formatter = identityFormatter } = (_a = this.title) !== null && _a !== void 0 ? _a : {};
        if (!title) {
            _titleCaption.enabled = false;
            return;
        }
        _titleCaption.enabled = title.enabled;
        _titleCaption.fontFamily = title.fontFamily;
        _titleCaption.fontSize = title.fontSize;
        _titleCaption.fontStyle = title.fontStyle;
        _titleCaption.fontWeight = title.fontWeight;
        _titleCaption.color = title.color;
        _titleCaption.wrapping = title.wrapping;
        let titleVisible = false;
        const titleNode = _titleCaption.node;
        if (title.enabled) {
            titleVisible = true;
            titleNode.rotation = Math.PI / 2;
            titleNode.x = Math.floor((requestedRange[0] + requestedRange[1]) / 2);
            titleNode.y = -Caption.SMALL_PADDING;
            titleNode.textAlign = 'center';
            titleNode.textBaseline = 'bottom';
            titleNode.text = callbackCache.call(formatter, this.getTitleFormatterParams());
        }
        titleNode.visible = titleVisible;
    }
    createTick() {
        return new RadiusAxisTick();
    }
    updateCrossLines() {
        var _a;
        (_a = this.crossLines) === null || _a === void 0 ? void 0 : _a.forEach((crossLine) => {
            if (crossLine instanceof RadiusCrossLine) {
                const { shape, gridAngles, range, innerRadiusRatio } = this;
                const radius = range[0];
                crossLine.shape = shape;
                crossLine.gridAngles = gridAngles;
                crossLine.axisOuterRadius = radius;
                crossLine.axisInnerRadius = radius * innerRadiusRatio;
            }
        });
        super.updateCrossLines({ rotation: 0, parallelFlipRotation: 0, regularFlipRotation: 0 });
    }
    createLabel() {
        return new RadiusAxisLabel();
    }
}
__decorate([
    Validate(DEGREE),
    Default(0)
], RadiusAxis.prototype, "positionAngle", void 0);
//# sourceMappingURL=radiusAxis.js.map