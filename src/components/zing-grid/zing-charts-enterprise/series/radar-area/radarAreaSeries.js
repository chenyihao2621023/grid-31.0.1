import { _ModuleSupport, _Scene } from '@/components/zing-grid/zing-charts-community/main.js';
import { RadarSeries } from '../radar/radarSeries';
import { RadarAreaSeriesProperties } from './radarAreaSeriesProperties';
const { Group, Path, PointerEvents, Selection } = _Scene;
const { ChartAxisDirection } = _ModuleSupport;
export class RadarAreaSeries extends RadarSeries {
    constructor(moduleCtx) {
        super(moduleCtx);
        this.properties = new RadarAreaSeriesProperties();
        this.resetInvalidToZero = true;
        const areaGroup = new Group();
        areaGroup.zIndexSubOrder = [() => this._declarationOrder, 0];
        this.contentGroup.append(areaGroup);
        this.areaSelection = Selection.select(areaGroup, Path);
    }
    updatePathSelections() {
        const pathData = this.visible ? [true] : [];
        this.areaSelection.update(pathData);
        super.updatePathSelections();
    }
    getAreaNode() {
        return this.areaSelection.nodes()[0];
    }
    getMarkerFill(highlightedStyle) {
        var _a, _b;
        return (_b = (_a = highlightedStyle === null || highlightedStyle === void 0 ? void 0 : highlightedStyle.fill) !== null && _a !== void 0 ? _a : this.properties.marker.fill) !== null && _b !== void 0 ? _b : this.properties.fill;
    }
    beforePathAnimation() {
        super.beforePathAnimation();
        const areaNode = this.getAreaNode();
        areaNode.fill = this.properties.fill;
        areaNode.fillOpacity = this.properties.fillOpacity;
        areaNode.pointerEvents = PointerEvents.None;
        areaNode.stroke = undefined;
    }
    animatePaths(ratio) {
        super.animatePaths(ratio);
        this.animateSinglePath(this.getAreaNode(), this.getAreaPoints(), ratio);
    }
    getAreaPoints() {
        var _a, _b;
        const points = this.getLinePoints();
        const getPolarAxis = (direction) => {
            const axis = this.axes[direction];
            return axis instanceof _ModuleSupport.PolarAxis ? axis : undefined;
        };
        const radiusAxis = getPolarAxis(ChartAxisDirection.Y);
        const angleAxis = getPolarAxis(ChartAxisDirection.X);
        const reversedRadiusAxis = radiusAxis === null || radiusAxis === void 0 ? void 0 : radiusAxis.isReversed();
        if (!reversedRadiusAxis) {
            return points;
        }
        const { points: zeroLinePoints = [] } = (_b = (_a = angleAxis === null || angleAxis === void 0 ? void 0 : angleAxis.getAxisLinePoints) === null || _a === void 0 ? void 0 : _a.call(angleAxis)) !== null && _b !== void 0 ? _b : {};
        return points.concat(...zeroLinePoints);
    }
    resetPaths() {
        super.resetPaths();
        const areaNode = this.getAreaNode();
        if (areaNode) {
            const { path: areaPath } = areaNode;
            const areaPoints = this.getAreaPoints();
            areaNode.fill = this.properties.fill;
            areaNode.fillOpacity = this.properties.fillOpacity;
            areaNode.stroke = undefined;
            areaNode.lineDash = this.properties.lineDash;
            areaNode.lineDashOffset = this.properties.lineDashOffset;
            areaNode.lineJoin = areaNode.lineCap = 'round';
            areaPath.clear({ trackChanges: true });
            areaPoints.forEach(({ x, y, moveTo, arc, radius = 0, startAngle = 0, endAngle = 0 }) => {
                if (arc) {
                    areaPath.arc(x, y, radius, startAngle, endAngle);
                }
                else if (moveTo) {
                    areaPath.moveTo(x, y);
                }
                else {
                    areaPath.lineTo(x, y);
                }
            });
            areaPath.closePath();
            areaNode.checkPathDirty();
        }
    }
}
RadarAreaSeries.className = 'RadarAreaSeries';
RadarAreaSeries.type = 'radar-area';
