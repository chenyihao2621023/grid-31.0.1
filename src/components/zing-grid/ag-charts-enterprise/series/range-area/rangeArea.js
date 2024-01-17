var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { _ModuleSupport, _Scene, _Util } from '@/components/zing-grid/ag-charts-community/main.js';
import { RangeAreaProperties } from './rangeAreaProperties';
const { valueProperty, trailingValueProperty, keyProperty, ChartAxisDirection, mergeDefaults, updateLabelNode, fixNumericExtent, AreaSeriesTag, buildResetPathFn, resetLabelFn, resetMarkerFn, resetMarkerPositionFn, pathSwipeInAnimation, resetMotion, markerSwipeScaleInAnimation, seriesLabelFadeInAnimation, animationValidation, diff, updateClipPath, } = _ModuleSupport;
const { getMarker, PointerEvents } = _Scene;
const { sanitizeHtml, extent, isNumber } = _Util;
const DEFAULT_DIRECTION_KEYS = {
    [_ModuleSupport.ChartAxisDirection.X]: ['xKey'],
    [_ModuleSupport.ChartAxisDirection.Y]: ['yLowKey', 'yHighKey'],
};
const DEFAULT_DIRECTION_NAMES = {
    [ChartAxisDirection.X]: ['xName'],
    [ChartAxisDirection.Y]: ['yLowName', 'yHighName', 'yName'],
};
class RangeAreaSeriesNodeClickEvent extends _ModuleSupport.SeriesNodeClickEvent {
    constructor(type, nativeEvent, datum, series) {
        super(type, nativeEvent, datum, series);
        this.xKey = series.properties.xKey;
        this.yLowKey = series.properties.yLowKey;
        this.yHighKey = series.properties.yHighKey;
    }
}
export class RangeAreaSeries extends _ModuleSupport.CartesianSeries {
    constructor(moduleCtx) {
        super({
            moduleCtx,
            hasHighlightedLabels: true,
            hasMarkers: true,
            pathsPerSeries: 2,
            directionKeys: DEFAULT_DIRECTION_KEYS,
            directionNames: DEFAULT_DIRECTION_NAMES,
            animationResetFns: {
                path: buildResetPathFn({ getOpacity: () => this.getOpacity() }),
                label: resetLabelFn,
                marker: (node, datum) => (Object.assign(Object.assign({}, resetMarkerFn(node)), resetMarkerPositionFn(node, datum))),
            },
        });
        this.properties = new RangeAreaProperties();
        this.NodeClickEvent = RangeAreaSeriesNodeClickEvent;
    }
    processData(dataController) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.properties.isValid()) {
                return;
            }
            const { xKey, yLowKey, yHighKey } = this.properties;
            const { isContinuousX, isContinuousY } = this.isContinuous();
            const extraProps = [];
            const animationEnabled = !this.ctx.animationManager.isSkipped();
            if (!this.ctx.animationManager.isSkipped() && this.processedData) {
                extraProps.push(diff(this.processedData));
            }
            if (animationEnabled) {
                extraProps.push(animationValidation(this));
            }
            yield this.requestDataModel(dataController, (_a = this.data) !== null && _a !== void 0 ? _a : [], {
                props: [
                    keyProperty(this, xKey, isContinuousX, { id: `xValue` }),
                    valueProperty(this, yLowKey, isContinuousY, { id: `yLowValue`, invalidValue: undefined }),
                    valueProperty(this, yHighKey, isContinuousY, { id: `yHighValue`, invalidValue: undefined }),
                    trailingValueProperty(this, yLowKey, isContinuousY, {
                        id: `yLowTrailingValue`,
                        invalidValue: undefined,
                    }),
                    trailingValueProperty(this, yHighKey, isContinuousY, {
                        id: `yHighTrailingValue`,
                        invalidValue: undefined,
                    }),
                    ...extraProps,
                ],
                dataVisible: this.visible,
            });
            this.animationState.transition('updateData');
        });
    }
    getSeriesDomain(direction) {
        const { processedData, dataModel, axes } = this;
        if (!(processedData && dataModel))
            return [];
        const { domain: { keys: [keys], values, }, } = processedData;
        if (direction === ChartAxisDirection.X) {
            const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
            const xAxis = axes[ChartAxisDirection.X];
            if ((keyDef === null || keyDef === void 0 ? void 0 : keyDef.def.type) === 'key' && keyDef.def.valueType === 'category') {
                return keys;
            }
            return fixNumericExtent(extent(keys), xAxis);
        }
        else {
            const yLowIndex = dataModel.resolveProcessedDataIndexById(this, 'yLowValue').index;
            const yLowExtent = values[yLowIndex];
            const yHighIndex = dataModel.resolveProcessedDataIndexById(this, 'yHighValue').index;
            const yHighExtent = values[yHighIndex];
            const fixedYExtent = [
                yLowExtent[0] > yHighExtent[0] ? yHighExtent[0] : yLowExtent[0],
                yHighExtent[1] < yLowExtent[1] ? yLowExtent[1] : yHighExtent[1],
            ];
            return fixNumericExtent(fixedYExtent);
        }
    }
    createNodeData() {
        const _super = Object.create(null, {
            calculateScaling: { get: () => super.calculateScaling }
        });
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const { data, dataModel, axes, visible } = this;
            const xAxis = axes[ChartAxisDirection.X];
            const yAxis = axes[ChartAxisDirection.Y];
            if (!(data && visible && xAxis && yAxis && dataModel)) {
                return [];
            }
            const xScale = xAxis.scale;
            const yScale = yAxis.scale;
            const { xKey, yLowKey, yHighKey, connectMissingData, marker } = this.properties;
            const itemId = `${yLowKey}-${yHighKey}`;
            const xOffset = ((_a = xScale.bandwidth) !== null && _a !== void 0 ? _a : 0) / 2;
            const defs = dataModel.resolveProcessedDataDefsByIds(this, [
                `xValue`,
                `yHighValue`,
                `yLowValue`,
                `yHighTrailingValue`,
                `yLowTrailingValue`,
            ]);
            const createCoordinates = (xValue, yHigh, yLow) => {
                const x = xScale.convert(xValue) + xOffset;
                const yHighCoordinate = yScale.convert(yHigh);
                const yLowCoordinate = yScale.convert(yLow);
                return [
                    { point: { x, y: yHighCoordinate }, size: marker.size, itemId: `high`, yValue: yHigh, xValue },
                    { point: { x, y: yLowCoordinate }, size: marker.size, itemId: `low`, yValue: yLow, xValue },
                ];
            };
            const createMovePoint = (plainPoint) => {
                const { point } = plainPoint, stroke = __rest(plainPoint, ["point"]);
                return Object.assign(Object.assign({}, stroke), { point: Object.assign(Object.assign({}, point), { moveTo: true }) });
            };
            const labelData = [];
            const markerData = [];
            const strokeData = { itemId, points: [] };
            const fillData = { itemId, points: [] };
            const context = {
                itemId,
                labelData,
                nodeData: markerData,
                fillData,
                strokeData,
                scales: _super.calculateScaling.call(this),
                visible: this.visible,
            };
            const fillHighPoints = fillData.points;
            const fillLowPoints = [];
            const strokeHighPoints = strokeData.points;
            const strokeLowPoints = [];
            let lastXValue;
            let lastYHighDatum = -Infinity;
            let lastYLowDatum = -Infinity;
            (_b = this.processedData) === null || _b === void 0 ? void 0 : _b.data.forEach(({ keys, datum, values }, datumIdx) => {
                const dataValues = dataModel.resolveProcessedDataDefsValues(defs, { keys, values });
                const { xValue, yHighValue, yLowValue } = dataValues;
                const invalidRange = yHighValue == null || yLowValue == null;
                const points = invalidRange ? [] : createCoordinates(xValue, yHighValue, yLowValue);
                const inverted = yLowValue > yHighValue;
                points.forEach(({ point: { x, y }, size, itemId = '', yValue }) => {
                    // marker data
                    markerData.push({
                        index: datumIdx,
                        series: this,
                        itemId,
                        datum,
                        midPoint: { x, y },
                        yHighValue,
                        yLowValue,
                        xValue,
                        xKey,
                        yLowKey,
                        yHighKey,
                        point: { x, y, size },
                    });
                    // label data
                    const labelDatum = this.createLabelData({
                        point: { x, y },
                        value: yValue,
                        yLowValue,
                        yHighValue,
                        itemId,
                        inverted,
                        datum,
                        series: this,
                    });
                    labelData.push(labelDatum);
                });
                // fill data
                const lastYValid = lastYHighDatum != null && lastYLowDatum != null;
                const lastValid = lastXValue != null && lastYValid;
                const xValid = xValue != null;
                const yValid = yHighValue != null && yLowValue != null;
                let [high, low] = createCoordinates(xValue, yHighValue !== null && yHighValue !== void 0 ? yHighValue : 0, yLowValue !== null && yLowValue !== void 0 ? yLowValue : 0);
                if (!connectMissingData) {
                    // Handle missing Y-values by 'hiding' the area by making the area height zero between
                    // valid points.
                    if (!yValid) {
                        const [prevHigh, prevLow] = createCoordinates(lastXValue, 0, 0);
                        fillHighPoints.push(prevHigh);
                        fillLowPoints.push(prevLow);
                    }
                    else if (!lastYValid) {
                        const [prevHigh, prevLow] = createCoordinates(xValue, 0, 0);
                        fillHighPoints.push(prevHigh);
                        fillLowPoints.push(prevLow);
                    }
                }
                if (xValid && yValid) {
                    fillHighPoints.push(high);
                    fillLowPoints.push(low);
                }
                // stroke data
                const move = xValid && yValid && !lastValid && !connectMissingData && datumIdx > 0;
                if (move) {
                    high = createMovePoint(high);
                    low = createMovePoint(low);
                }
                if (xValid && yValid) {
                    strokeHighPoints.push(high);
                    strokeLowPoints.push(low);
                }
                lastXValue = xValue;
                lastYHighDatum = yHighValue;
                lastYLowDatum = yLowValue;
            });
            if (fillHighPoints.length > 0) {
                fillHighPoints[0] = createMovePoint(fillHighPoints[0]);
            }
            fillHighPoints.push(...fillLowPoints.reverse());
            if (strokeLowPoints.length > 0) {
                strokeLowPoints[0] = createMovePoint(strokeLowPoints[0]);
            }
            strokeHighPoints.push(...strokeLowPoints);
            return [context];
        });
    }
    createLabelData({ point, value, itemId, inverted, datum, series, }) {
        const { xKey, yLowKey, yHighKey, xName, yName, yLowName, yHighName, label } = this.properties;
        const { placement, padding = 10 } = label;
        const actualItemId = inverted ? (itemId === 'low' ? 'high' : 'low') : itemId;
        const direction = (placement === 'outside' && actualItemId === 'high') || (placement === 'inside' && actualItemId === 'low')
            ? -1
            : 1;
        return {
            x: point.x,
            y: point.y + padding * direction,
            series,
            itemId,
            datum,
            text: this.getLabelText(label, { value, datum, itemId, xKey, yLowKey, yHighKey, xName, yLowName, yHighName, yName }, (value) => (isNumber(value) ? value.toFixed(2) : String(value))),
            textAlign: 'center',
            textBaseline: direction === -1 ? 'bottom' : 'top',
        };
    }
    isPathOrSelectionDirty() {
        return this.properties.marker.isDirty();
    }
    markerFactory() {
        const { shape } = this.properties.marker;
        const MarkerShape = getMarker(shape);
        return new MarkerShape();
    }
    updatePathNodes(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { opacity, visible } = opts;
            const [fill, stroke] = opts.paths;
            const strokeWidth = this.getStrokeWidth(this.properties.strokeWidth);
            stroke.setProperties({
                tag: AreaSeriesTag.Stroke,
                fill: undefined,
                lineJoin: (stroke.lineCap = 'round'),
                pointerEvents: PointerEvents.None,
                stroke: this.properties.stroke,
                strokeWidth,
                strokeOpacity: this.properties.strokeOpacity,
                lineDash: this.properties.lineDash,
                lineDashOffset: this.properties.lineDashOffset,
                opacity,
                visible,
            });
            fill.setProperties({
                tag: AreaSeriesTag.Fill,
                stroke: undefined,
                lineJoin: 'round',
                pointerEvents: PointerEvents.None,
                fill: this.properties.fill,
                fillOpacity: this.properties.fillOpacity,
                lineDash: this.properties.lineDash,
                lineDashOffset: this.properties.lineDashOffset,
                strokeOpacity: this.properties.strokeOpacity,
                fillShadow: this.properties.shadow,
                strokeWidth,
                opacity,
                visible,
            });
            updateClipPath(this, stroke);
            updateClipPath(this, fill);
        });
    }
    updatePaths(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            this.updateAreaPaths([opts.paths], [opts.contextData]);
        });
    }
    updateAreaPaths(paths, contextData) {
        this.updateFillPath(paths, contextData);
        this.updateStrokePath(paths, contextData);
    }
    updateFillPath(paths, contextData) {
        contextData.forEach(({ fillData }, contextDataIndex) => {
            const [fill] = paths[contextDataIndex];
            const { path: fillPath } = fill;
            fillPath.clear({ trackChanges: true });
            for (const { point } of fillData.points) {
                if (point.moveTo) {
                    fillPath.moveTo(point.x, point.y);
                }
                else {
                    fillPath.lineTo(point.x, point.y);
                }
            }
            fillPath.closePath();
            fill.checkPathDirty();
        });
    }
    updateStrokePath(paths, contextData) {
        contextData.forEach(({ strokeData }, contextDataIndex) => {
            const [, stroke] = paths[contextDataIndex];
            const { path: strokePath } = stroke;
            strokePath.clear({ trackChanges: true });
            for (const { point } of strokeData.points) {
                if (point.moveTo) {
                    strokePath.moveTo(point.x, point.y);
                }
                else {
                    strokePath.lineTo(point.x, point.y);
                }
            }
            stroke.checkPathDirty();
        });
    }
    updateMarkerSelection(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { nodeData, markerSelection } = opts;
            if (this.properties.marker.isDirty()) {
                markerSelection.clear();
                markerSelection.cleanup();
            }
            return markerSelection.update(this.properties.marker.enabled ? nodeData : []);
        });
    }
    updateMarkerNodes(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { markerSelection, isHighlight: highlighted } = opts;
            const { xKey, yLowKey, yHighKey, marker, fill, stroke, strokeWidth, fillOpacity, strokeOpacity } = this.properties;
            const baseStyle = mergeDefaults(highlighted && this.properties.highlightStyle.item, marker.getStyle(), {
                fill,
                fillOpacity,
                stroke,
                strokeWidth,
                strokeOpacity,
            });
            markerSelection.each((node, datum) => {
                this.updateMarkerStyle(node, marker, { datum, highlighted, xKey, yHighKey, yLowKey }, baseStyle);
            });
            if (!highlighted) {
                this.properties.marker.markClean();
            }
        });
    }
    updateLabelSelection(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { labelData, labelSelection } = opts;
            return labelSelection.update(labelData, (text) => {
                text.tag = AreaSeriesTag.Label;
                text.pointerEvents = PointerEvents.None;
            });
        });
    }
    updateLabelNodes(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            opts.labelSelection.each((textNode, datum) => {
                updateLabelNode(textNode, this.properties.label, datum);
            });
        });
    }
    getHighlightLabelData(labelData, highlightedItem) {
        const labelItems = labelData.filter((ld) => ld.datum === highlightedItem.datum);
        return labelItems.length > 0 ? labelItems : undefined;
    }
    getHighlightData(nodeData, highlightedItem) {
        const highlightItems = nodeData.filter((nodeDatum) => nodeDatum.datum === highlightedItem.datum);
        return highlightItems.length > 0 ? highlightItems : undefined;
    }
    getTooltipHtml(nodeDatum) {
        const xAxis = this.axes[ChartAxisDirection.X];
        const yAxis = this.axes[ChartAxisDirection.Y];
        if (!this.properties.isValid() || !xAxis || !yAxis) {
            return '';
        }
        const { id: seriesId } = this;
        const { xKey, yLowKey, yHighKey, xName, yName, yLowName, yHighName, fill, tooltip } = this.properties;
        const { datum, itemId, xValue, yLowValue, yHighValue } = nodeDatum;
        const color = fill !== null && fill !== void 0 ? fill : 'gray';
        const xString = sanitizeHtml(xAxis.formatDatum(xValue));
        const yLowString = sanitizeHtml(yAxis.formatDatum(yLowValue));
        const yHighString = sanitizeHtml(yAxis.formatDatum(yHighValue));
        const xSubheading = xName !== null && xName !== void 0 ? xName : xKey;
        const yLowSubheading = yLowName !== null && yLowName !== void 0 ? yLowName : yLowKey;
        const yHighSubheading = yHighName !== null && yHighName !== void 0 ? yHighName : yHighKey;
        const title = sanitizeHtml(yName);
        const content = yName
            ? `<b>${sanitizeHtml(xSubheading)}</b>: ${xString}<br>` +
                `<b>${sanitizeHtml(yLowSubheading)}</b>: ${yLowString}<br>` +
                `<b>${sanitizeHtml(yHighSubheading)}</b>: ${yHighString}<br>`
            : `${xString}: ${yLowString} - ${yHighString}`;
        return tooltip.toTooltipHtml({ title, content, backgroundColor: color }, { seriesId, itemId, datum, xKey, yLowKey, yHighKey, xName, yLowName, yHighName, yName, color });
    }
    getLegendData(legendType) {
        var _a, _b;
        if (legendType !== 'category') {
            return [];
        }
        const { yLowKey, yHighKey, yName, yLowName, yHighName, fill, stroke, strokeWidth, strokeOpacity, lineDash, visible, marker, } = this.properties;
        const legendItemText = yName !== null && yName !== void 0 ? yName : `${yLowName !== null && yLowName !== void 0 ? yLowName : yLowKey} - ${yHighName !== null && yHighName !== void 0 ? yHighName : yHighKey}`;
        return [
            {
                legendType: 'category',
                id: this.id,
                itemId: `${yLowKey}-${yHighKey}`,
                seriesId: this.id,
                enabled: visible,
                label: { text: `${legendItemText}` },
                marker: {
                    shape: marker.shape,
                    fill: (_a = marker.fill) !== null && _a !== void 0 ? _a : fill,
                    stroke: (_b = marker.stroke) !== null && _b !== void 0 ? _b : stroke,
                    fillOpacity: marker.fillOpacity,
                    strokeOpacity: marker.strokeOpacity,
                    strokeWidth: marker.strokeWidth,
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
    isLabelEnabled() {
        return this.properties.label.enabled;
    }
    onDataChange() { }
    nodeFactory() {
        return new _Scene.Group();
    }
    animateEmptyUpdateReady(animationData) {
        const { markerSelections, labelSelections, contextData, paths } = animationData;
        const { animationManager } = this.ctx;
        this.updateAreaPaths(paths, contextData);
        pathSwipeInAnimation(this, animationManager, paths.flat());
        resetMotion(markerSelections, resetMarkerPositionFn);
        markerSwipeScaleInAnimation(this, animationManager, markerSelections);
        seriesLabelFadeInAnimation(this, 'labels', animationManager, labelSelections);
    }
    animateReadyResize(animationData) {
        const { contextData, paths } = animationData;
        this.updateAreaPaths(paths, contextData);
        super.animateReadyResize(animationData);
    }
    animateWaitingUpdateReady(animationData) {
        const { contextData, paths } = animationData;
        super.animateWaitingUpdateReady(animationData);
        this.updateAreaPaths(paths, contextData);
    }
}
RangeAreaSeries.className = 'RangeAreaSeries';
RangeAreaSeries.type = 'range-area';
//# sourceMappingURL=rangeArea.js.map