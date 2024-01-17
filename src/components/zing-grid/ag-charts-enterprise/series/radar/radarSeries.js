var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { _ModuleSupport, _Scene, _Util } from '@/components/zing-grid/ag-charts-community/main.js';
import { RadarSeriesProperties } from './radarSeriesProperties';
const { ChartAxisDirection, PolarAxis, SeriesNodePickMode, valueProperty, fixNumericExtent, seriesLabelFadeInAnimation, markerFadeInAnimation, resetMarkerFn, animationValidation, ADD_PHASE, } = _ModuleSupport;
const { BBox, Group, Path, PointerEvents, Selection, Text, getMarker } = _Scene;
const { extent, isNumber, isNumberEqual, sanitizeHtml, toFixed } = _Util;
class RadarSeriesNodeClickEvent extends _ModuleSupport.SeriesNodeClickEvent {
    constructor(type, nativeEvent, datum, series) {
        super(type, nativeEvent, datum, series);
        this.angleKey = series.properties.angleKey;
        this.radiusKey = series.properties.radiusKey;
    }
}
export class RadarSeries extends _ModuleSupport.PolarSeries {
    constructor(moduleCtx) {
        super({
            moduleCtx,
            useLabelLayer: true,
            pickModes: [SeriesNodePickMode.NEAREST_NODE, SeriesNodePickMode.EXACT_SHAPE_MATCH],
            canHaveAxes: true,
            animationResetFns: {
                item: resetMarkerFn,
            },
        });
        this.properties = new RadarSeriesProperties();
        this.NodeClickEvent = RadarSeriesNodeClickEvent;
        this.nodeData = [];
        this.resetInvalidToZero = false;
        this.circleCache = { r: 0, cx: 0, cy: 0 };
        const lineGroup = new Group();
        this.contentGroup.append(lineGroup);
        this.lineSelection = Selection.select(lineGroup, Path);
        lineGroup.zIndexSubOrder = [() => this._declarationOrder, 1];
    }
    nodeFactory() {
        const { shape } = this.properties.marker;
        const MarkerShape = getMarker(shape);
        return new MarkerShape();
    }
    addChartEventListeners() {
        var _a, _b;
        (_a = this.ctx.chartEventManager) === null || _a === void 0 ? void 0 : _a.addListener('legend-item-click', (event) => this.onLegendItemClick(event));
        (_b = this.ctx.chartEventManager) === null || _b === void 0 ? void 0 : _b.addListener('legend-item-double-click', (event) => this.onLegendItemDoubleClick(event));
    }
    getSeriesDomain(direction) {
        const { dataModel, processedData } = this;
        if (!processedData || !dataModel)
            return [];
        if (direction === ChartAxisDirection.X) {
            return dataModel.getDomain(this, `angleValue`, 'value', processedData);
        }
        else {
            const domain = dataModel.getDomain(this, `radiusValue`, 'value', processedData);
            const ext = extent(domain.length === 0 ? domain : [0].concat(domain));
            return fixNumericExtent(ext);
        }
    }
    processData(dataController) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.properties.isValid()) {
                return;
            }
            const { angleKey, radiusKey } = this.properties;
            const extraProps = [];
            if (!this.ctx.animationManager.isSkipped()) {
                extraProps.push(animationValidation(this));
            }
            yield this.requestDataModel(dataController, (_a = this.data) !== null && _a !== void 0 ? _a : [], {
                props: [
                    valueProperty(this, angleKey, false, { id: 'angleValue' }),
                    valueProperty(this, radiusKey, false, { id: 'radiusValue', invalidValue: undefined }),
                    ...extraProps,
                ],
            });
            this.animationState.transition('updateData');
        });
    }
    didCircleChange() {
        const r = this.radius;
        const cx = this.centerX;
        const cy = this.centerY;
        const cache = this.circleCache;
        if (!(r === cache.r && cx === cache.cx && cy === cache.cy)) {
            this.circleCache = { r, cx, cy };
            return true;
        }
        return false;
    }
    getAxisInnerRadius() {
        const radiusAxis = this.axes[ChartAxisDirection.Y];
        return radiusAxis instanceof PolarAxis ? this.radius * radiusAxis.innerRadiusRatio : 0;
    }
    maybeRefreshNodeData() {
        return __awaiter(this, void 0, void 0, function* () {
            const didCircleChange = this.didCircleChange();
            if (!didCircleChange && !this.nodeDataRefresh)
                return;
            const [{ nodeData = [] } = {}] = yield this.createNodeData();
            this.nodeData = nodeData;
            this.nodeDataRefresh = false;
        });
    }
    createNodeData() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const { processedData, dataModel } = this;
            if (!processedData || !dataModel || !this.properties.isValid()) {
                return [];
            }
            const { angleKey, radiusKey, angleName, radiusName, marker, label } = this.properties;
            const angleScale = (_a = this.axes[ChartAxisDirection.X]) === null || _a === void 0 ? void 0 : _a.scale;
            const radiusScale = (_b = this.axes[ChartAxisDirection.Y]) === null || _b === void 0 ? void 0 : _b.scale;
            if (!angleScale || !radiusScale) {
                return [];
            }
            const angleIdx = dataModel.resolveProcessedDataIndexById(this, `angleValue`).index;
            const radiusIdx = dataModel.resolveProcessedDataIndexById(this, `radiusValue`).index;
            const axisInnerRadius = this.getAxisInnerRadius();
            const nodeData = processedData.data.map((group) => {
                const { datum, values } = group;
                const angleDatum = values[angleIdx];
                const radiusDatum = values[radiusIdx];
                const angle = angleScale.convert(angleDatum);
                const radius = this.radius + axisInnerRadius - radiusScale.convert(radiusDatum);
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);
                const x = cos * radius;
                const y = sin * radius;
                let labelNodeDatum;
                if (label.enabled) {
                    const labelText = this.getLabelText(label, { value: radiusDatum, datum, angleKey, radiusKey, angleName, radiusName }, (value) => (isNumber(value) ? value.toFixed(2) : String(value)));
                    if (labelText) {
                        labelNodeDatum = {
                            x: x + cos * marker.size,
                            y: y + sin * marker.size,
                            text: labelText,
                            textAlign: isNumberEqual(cos, 0) ? 'center' : cos > 0 ? 'left' : 'right',
                            textBaseline: isNumberEqual(sin, 0) ? 'middle' : sin > 0 ? 'top' : 'bottom',
                        };
                    }
                }
                return {
                    series: this,
                    datum,
                    point: { x, y, size: marker.size },
                    midPoint: { x, y },
                    label: labelNodeDatum,
                    angleValue: angleDatum,
                    radiusValue: radiusDatum,
                };
            });
            return [{ itemId: radiusKey, nodeData, labelData: nodeData }];
        });
    }
    update({ seriesRect }) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const resize = this.checkResize(seriesRect);
            const animationEnabled = !this.ctx.animationManager.isSkipped();
            const { series } = (_b = (_a = this.ctx.highlightManager) === null || _a === void 0 ? void 0 : _a.getActiveHighlight()) !== null && _b !== void 0 ? _b : {};
            this.highlightGroup.visible = (animationEnabled || this.visible) && !!(series === this);
            yield this.maybeRefreshNodeData();
            this.contentGroup.translationX = this.centerX;
            this.contentGroup.translationY = this.centerY;
            this.highlightGroup.translationX = this.centerX;
            this.highlightGroup.translationY = this.centerY;
            if (this.labelGroup) {
                this.labelGroup.translationX = this.centerX;
                this.labelGroup.translationY = this.centerY;
            }
            this.updatePathSelections();
            this.updateMarkers(this.itemSelection, false);
            this.updateMarkers(this.highlightSelection, true);
            this.updateLabels();
            if (resize) {
                this.animationState.transition('resize');
            }
            this.animationState.transition('update');
        });
    }
    updatePathSelections() {
        const pathData = this.visible ? [true] : [];
        this.lineSelection.update(pathData);
    }
    getMarkerFill(highlightedStyle) {
        var _a;
        return (_a = highlightedStyle === null || highlightedStyle === void 0 ? void 0 : highlightedStyle.fill) !== null && _a !== void 0 ? _a : this.properties.marker.fill;
    }
    updateMarkers(selection, highlight) {
        var _a;
        const { angleKey, radiusKey, marker, visible } = this.properties;
        let selectionData = [];
        if (visible && marker.shape && marker.enabled) {
            if (highlight) {
                const highlighted = (_a = this.ctx.highlightManager) === null || _a === void 0 ? void 0 : _a.getActiveHighlight();
                if (highlighted === null || highlighted === void 0 ? void 0 : highlighted.datum) {
                    selectionData = [highlighted];
                }
            }
            else {
                selectionData = this.nodeData;
            }
        }
        const highlightedStyle = highlight ? this.properties.highlightStyle.item : undefined;
        selection.update(selectionData).each((node, datum) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
            const fill = this.getMarkerFill(highlightedStyle);
            const stroke = (_b = (_a = highlightedStyle === null || highlightedStyle === void 0 ? void 0 : highlightedStyle.stroke) !== null && _a !== void 0 ? _a : marker.stroke) !== null && _b !== void 0 ? _b : this.properties.stroke;
            const strokeWidth = (_e = (_d = (_c = highlightedStyle === null || highlightedStyle === void 0 ? void 0 : highlightedStyle.strokeWidth) !== null && _c !== void 0 ? _c : marker.strokeWidth) !== null && _d !== void 0 ? _d : this.properties.strokeWidth) !== null && _e !== void 0 ? _e : 1;
            const format = marker.formatter
                ? this.ctx.callbackCache.call(marker.formatter, {
                    datum: datum.datum,
                    angleKey,
                    radiusKey,
                    fill,
                    stroke,
                    strokeWidth,
                    size: marker.size,
                    highlighted: highlight,
                    seriesId: this.id,
                })
                : undefined;
            node.fill = (_f = format === null || format === void 0 ? void 0 : format.fill) !== null && _f !== void 0 ? _f : fill;
            node.stroke = (_g = format === null || format === void 0 ? void 0 : format.stroke) !== null && _g !== void 0 ? _g : stroke;
            node.strokeWidth = (_h = format === null || format === void 0 ? void 0 : format.strokeWidth) !== null && _h !== void 0 ? _h : strokeWidth;
            node.fillOpacity = (_k = (_j = highlightedStyle === null || highlightedStyle === void 0 ? void 0 : highlightedStyle.fillOpacity) !== null && _j !== void 0 ? _j : marker.fillOpacity) !== null && _k !== void 0 ? _k : 1;
            node.strokeOpacity = (_m = (_l = marker.strokeOpacity) !== null && _l !== void 0 ? _l : this.properties.strokeOpacity) !== null && _m !== void 0 ? _m : 1;
            node.size = (_o = format === null || format === void 0 ? void 0 : format.size) !== null && _o !== void 0 ? _o : marker.size;
            const { x, y } = datum.point;
            node.translationX = x;
            node.translationY = y;
            node.visible = visible && node.size > 0 && !isNaN(x) && !isNaN(y);
        });
    }
    updateLabels() {
        const { label } = this.properties;
        this.labelSelection.update(this.nodeData).each((node, datum) => {
            if (label.enabled && datum.label) {
                node.x = datum.label.x;
                node.y = datum.label.y;
                node.fill = label.color;
                node.fontFamily = label.fontFamily;
                node.fontSize = label.fontSize;
                node.fontStyle = label.fontStyle;
                node.fontWeight = label.fontWeight;
                node.text = datum.label.text;
                node.textAlign = datum.label.textAlign;
                node.textBaseline = datum.label.textBaseline;
                node.visible = true;
            }
            else {
                node.visible = false;
            }
        });
    }
    getTooltipHtml(nodeDatum) {
        var _a;
        if (!this.properties.isValid()) {
            return '';
        }
        const { id: seriesId } = this;
        const { angleKey, radiusKey, angleName, radiusName, marker, tooltip } = this.properties;
        const { datum, angleValue, radiusValue } = nodeDatum;
        const formattedAngleValue = typeof angleValue === 'number' ? toFixed(angleValue) : String(angleValue);
        const formattedRadiusValue = typeof radiusValue === 'number' ? toFixed(radiusValue) : String(radiusValue);
        const title = sanitizeHtml(radiusName);
        const content = sanitizeHtml(`${formattedAngleValue}: ${formattedRadiusValue}`);
        const { formatter: markerFormatter, fill, stroke, strokeWidth: markerStrokeWidth, size } = marker;
        const strokeWidth = markerStrokeWidth !== null && markerStrokeWidth !== void 0 ? markerStrokeWidth : this.properties.strokeWidth;
        const { fill: color } = (_a = (markerFormatter &&
            this.ctx.callbackCache.call(markerFormatter, {
                datum,
                angleKey,
                radiusKey,
                fill,
                stroke,
                strokeWidth,
                size,
                highlighted: false,
                seriesId,
            }))) !== null && _a !== void 0 ? _a : { fill };
        return tooltip.toTooltipHtml({ title, content, backgroundColor: color }, { datum, angleKey, angleName, radiusKey, radiusName, title, color, seriesId });
    }
    getLegendData(legendType) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        if (!((_a = this.data) === null || _a === void 0 ? void 0 : _a.length) || !this.properties.isValid() || legendType !== 'category') {
            return [];
        }
        const { radiusKey, radiusName, stroke, strokeWidth, strokeOpacity, lineDash, visible, marker } = this.properties;
        return [
            {
                legendType: 'category',
                id: this.id,
                itemId: radiusKey,
                seriesId: this.id,
                enabled: visible,
                label: {
                    text: radiusName !== null && radiusName !== void 0 ? radiusName : radiusKey,
                },
                marker: {
                    shape: marker.shape,
                    fill: (_d = (_c = (_b = this.getMarkerFill()) !== null && _b !== void 0 ? _b : marker.stroke) !== null && _c !== void 0 ? _c : stroke) !== null && _d !== void 0 ? _d : 'rgba(0, 0, 0, 0)',
                    stroke: (_f = (_e = marker.stroke) !== null && _e !== void 0 ? _e : stroke) !== null && _f !== void 0 ? _f : 'rgba(0, 0, 0, 0)',
                    fillOpacity: (_g = marker.fillOpacity) !== null && _g !== void 0 ? _g : 1,
                    strokeOpacity: (_j = (_h = marker.strokeOpacity) !== null && _h !== void 0 ? _h : strokeOpacity) !== null && _j !== void 0 ? _j : 1,
                    strokeWidth: (_k = marker.strokeWidth) !== null && _k !== void 0 ? _k : 0,
                    enabled: marker.enabled || strokeWidth <= 0,
                },
                line: {
                    stroke,
                    strokeOpacity,
                    strokeWidth,
                    lineDash,
                },
            },
        ];
    }
    onLegendItemClick(event) {
        const { enabled, itemId, series } = event;
        if (series.id === this.id) {
            this.toggleSeriesItem(itemId, enabled);
        }
    }
    onLegendItemDoubleClick(event) {
        const { enabled, itemId, series, numVisibleItems } = event;
        const wasClicked = series.id === this.id;
        const newEnabled = wasClicked || (enabled && numVisibleItems === 1);
        this.toggleSeriesItem(itemId, newEnabled);
    }
    pickNodeClosestDatum(point) {
        var _a, _b;
        const { x, y } = point;
        const { rootGroup, nodeData, centerX: cx, centerY: cy } = this;
        const hitPoint = rootGroup.transformPoint(x, y);
        const radius = this.radius;
        const distanceFromCenter = Math.sqrt(Math.pow((x - cx), 2) + Math.pow((y - cy), 2));
        if (distanceFromCenter > radius + this.properties.marker.size) {
            return;
        }
        let minDistance = Infinity;
        let closestDatum;
        for (const datum of nodeData) {
            const { point: { x: datumX = NaN, y: datumY = NaN } = {} } = datum;
            if (isNaN(datumX) || isNaN(datumY)) {
                continue;
            }
            const distance = Math.sqrt(Math.pow((hitPoint.x - datumX - cx), 2) + Math.pow((hitPoint.y - datumY - cy), 2));
            if (distance < minDistance) {
                minDistance = distance;
                closestDatum = datum;
            }
        }
        if (closestDatum) {
            const distance = Math.max(minDistance - ((_b = (_a = closestDatum.point) === null || _a === void 0 ? void 0 : _a.size) !== null && _b !== void 0 ? _b : 0), 0);
            return { datum: closestDatum, distance };
        }
    }
    computeLabelsBBox() {
        return __awaiter(this, void 0, void 0, function* () {
            const { label } = this.properties;
            yield this.maybeRefreshNodeData();
            const textBoxes = [];
            const tempText = new Text();
            this.nodeData.forEach((nodeDatum) => {
                if (!label.enabled || !nodeDatum.label) {
                    return;
                }
                tempText.text = nodeDatum.label.text;
                tempText.x = nodeDatum.label.x;
                tempText.y = nodeDatum.label.y;
                tempText.setFont(label);
                tempText.setAlign(nodeDatum.label);
                const box = tempText.computeBBox();
                textBoxes.push(box);
            });
            if (textBoxes.length === 0) {
                return null;
            }
            return BBox.merge(textBoxes);
        });
    }
    getLineNode() {
        return this.lineSelection.nodes()[0];
    }
    beforePathAnimation() {
        const lineNode = this.getLineNode();
        lineNode.fill = undefined;
        lineNode.lineJoin = 'round';
        lineNode.lineCap = 'round';
        lineNode.pointerEvents = PointerEvents.None;
        lineNode.stroke = this.properties.stroke;
        lineNode.strokeWidth = this.getStrokeWidth(this.properties.strokeWidth);
        lineNode.strokeOpacity = this.properties.strokeOpacity;
        lineNode.lineDash = this.properties.lineDash;
        lineNode.lineDashOffset = this.properties.lineDashOffset;
    }
    getLinePoints() {
        const { nodeData, resetInvalidToZero } = this;
        const { connectMissingData } = this.properties;
        if (nodeData.length === 0) {
            return [];
        }
        const radiusAxis = this.axes[ChartAxisDirection.Y];
        const angleAxis = this.axes[ChartAxisDirection.X];
        const reversedAngleAxis = angleAxis === null || angleAxis === void 0 ? void 0 : angleAxis.isReversed();
        const reversedRadiusAxis = radiusAxis === null || radiusAxis === void 0 ? void 0 : radiusAxis.isReversed();
        // For inverted radar area the inner line shape points must be anti-clockwise and the zero line points (outer
        // shape must be clockwise) to create a hole in the middle of the shape
        const data = reversedRadiusAxis && !reversedAngleAxis ? [...nodeData].reverse() : nodeData;
        const points = [];
        let prevPointInvalid = false;
        let firstValid;
        data.forEach((datum, index) => {
            let { x, y } = datum.point;
            const isPointInvalid = isNaN(x) || isNaN(y);
            if (!isPointInvalid) {
                firstValid !== null && firstValid !== void 0 ? firstValid : (firstValid = datum);
            }
            if (isPointInvalid && !connectMissingData) {
                x = 0;
                y = 0;
            }
            const moveTo = index === 0 || (!resetInvalidToZero && !connectMissingData && (isPointInvalid || prevPointInvalid));
            points.push({ x, y, moveTo });
            prevPointInvalid = isPointInvalid;
        });
        if (firstValid !== undefined) {
            points.push({ x: firstValid.point.x, y: firstValid.point.y, moveTo: false });
        }
        return points;
    }
    animateSinglePath(pathNode, points, ratio) {
        const { path } = pathNode;
        path.clear({ trackChanges: true });
        const axisInnerRadius = this.getAxisInnerRadius();
        const radiusAxis = this.axes[ChartAxisDirection.Y];
        const reversedRadiusAxis = radiusAxis === null || radiusAxis === void 0 ? void 0 : radiusAxis.isReversed();
        const radiusZero = reversedRadiusAxis
            ? this.radius + axisInnerRadius - (radiusAxis === null || radiusAxis === void 0 ? void 0 : radiusAxis.scale.convert(0))
            : axisInnerRadius;
        points.forEach((point) => {
            const { x: x1, y: y1, arc, radius = 0, startAngle = 0, endAngle = 0, moveTo } = point;
            const angle = Math.atan2(y1, x1);
            const x0 = radiusZero * Math.cos(angle);
            const y0 = radiusZero * Math.sin(angle);
            const t = ratio;
            const x = x0 * (1 - t) + x1 * t;
            const y = y0 * (1 - t) + y1 * t;
            if (arc) {
                path.arc(x1, y1, radius, startAngle, endAngle);
            }
            else if (moveTo) {
                path.moveTo(x, y);
            }
            else {
                path.lineTo(x, y);
            }
        });
        pathNode.checkPathDirty();
    }
    animatePaths(ratio) {
        const linePoints = this.getLinePoints();
        this.animateSinglePath(this.getLineNode(), linePoints, ratio);
    }
    animateEmptyUpdateReady() {
        const { itemSelection, labelSelection } = this;
        const { animationManager } = this.ctx;
        const duration = animationManager.defaultDuration * (1 - ADD_PHASE.animationDuration);
        const animationOptions = { from: 0, to: 1 };
        this.beforePathAnimation();
        animationManager.animate(Object.assign(Object.assign({ id: `${this.id}_'path`, groupId: this.id }, animationOptions), { duration, onUpdate: (ratio) => this.animatePaths(ratio), onStop: () => this.animatePaths(1) }));
        markerFadeInAnimation(this, animationManager, [itemSelection], 'added');
        seriesLabelFadeInAnimation(this, 'labels', animationManager, [labelSelection]);
    }
    animateWaitingUpdateReady(data) {
        super.animateWaitingUpdateReady(data);
        this.resetPaths();
    }
    animateReadyResize(data) {
        super.animateReadyResize(data);
        this.resetPaths();
    }
    resetPaths() {
        const lineNode = this.getLineNode();
        if (lineNode) {
            const { path: linePath } = lineNode;
            const linePoints = this.getLinePoints();
            lineNode.fill = undefined;
            lineNode.stroke = this.properties.stroke;
            lineNode.strokeWidth = this.getStrokeWidth(this.properties.strokeWidth);
            lineNode.strokeOpacity = this.properties.strokeOpacity;
            lineNode.lineDash = this.properties.lineDash;
            lineNode.lineDashOffset = this.properties.lineDashOffset;
            linePath.clear({ trackChanges: true });
            linePoints.forEach(({ x, y, moveTo }) => {
                if (moveTo) {
                    linePath.moveTo(x, y);
                }
                else {
                    linePath.lineTo(x, y);
                }
            });
            lineNode.checkPathDirty();
        }
    }
}
RadarSeries.className = 'RadarSeries';
//# sourceMappingURL=radarSeries.js.map