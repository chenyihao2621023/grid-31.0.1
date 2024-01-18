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
import { fromToMotion } from '../../../motion/fromToMotion';
import { pathMotion } from '../../../motion/pathMotion';
import { resetMotion } from '../../../motion/resetMotion';
import { ContinuousScale } from '../../../scale/continuousScale';
import { Group } from '../../../scene/group';
import { PointerEvents } from '../../../scene/node';
import { extent } from '../../../util/array';
import { mergeDefaults } from '../../../util/object';
import { sanitizeHtml } from '../../../util/sanitize';
import { isDefined } from '../../../util/type-guards';
import { isContinuous, isNumber } from '../../../util/value';
import { LogAxis } from '../../axis/logAxis';
import { TimeAxis } from '../../axis/timeAxis';
import { ChartAxisDirection } from '../../chartAxisDirection';
import { fixNumericExtent } from '../../data/dataModel';
import { animationValidation, diff, normaliseGroupTo } from '../../data/processors';
import { getMarker } from '../../marker/util';
import { SeriesNodePickMode, groupAccumulativeValueProperty, keyProperty, valueProperty } from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import { AreaSeriesProperties } from './areaSeriesProperties';
import { AreaSeriesTag, prepareAreaPathAnimation, } from './areaUtil';
import { CartesianSeries } from './cartesianSeries';
import { markerSwipeScaleInAnimation, resetMarkerFn, resetMarkerPositionFn } from './markerUtil';
import { buildResetPathFn, pathFadeInAnimation, pathSwipeInAnimation, updateClipPath } from './pathUtil';
export class AreaSeries extends CartesianSeries {
    constructor(moduleCtx) {
        super({
            moduleCtx,
            pathsPerSeries: 2,
            pathsZIndexSubOrderOffset: [0, 1000],
            hasMarkers: true,
            markerSelectionGarbageCollection: false,
            pickModes: [SeriesNodePickMode.NEAREST_BY_MAIN_AXIS_FIRST, SeriesNodePickMode.EXACT_SHAPE_MATCH],
            animationResetFns: {
                path: buildResetPathFn({ getOpacity: () => this.getOpacity() }),
                label: resetLabelFn,
                marker: (node, datum) => (Object.assign(Object.assign({}, resetMarkerFn(node)), resetMarkerPositionFn(node, datum))),
            },
        });
        this.properties = new AreaSeriesProperties();
    }
    processData(dataController) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.data == null || !this.properties.isValid()) {
                return;
            }
            const { data, visible, seriesGrouping: { groupIndex = this.id, stackCount = 1 } = {} } = this;
            const { xKey, yKey, connectMissingData, normalizedTo } = this.properties;
            const animationEnabled = !this.ctx.animationManager.isSkipped();
            const { isContinuousX, isContinuousY } = this.isContinuous();
            const ids = [
                `area-stack-${groupIndex}-yValues`,
                `area-stack-${groupIndex}-yValues-trailing`,
                `area-stack-${groupIndex}-yValues-prev`,
                `area-stack-${groupIndex}-yValues-trailing-prev`,
                `area-stack-${groupIndex}-yValues-marker`,
            ];
            const extraProps = [];
            if (isDefined(normalizedTo)) {
                extraProps.push(normaliseGroupTo(this, [ids[0], ids[1], ids[4]], normalizedTo, 'range'));
                extraProps.push(normaliseGroupTo(this, [ids[2], ids[3]], normalizedTo, 'range'));
            }
            // If two or more datums share an x-value, i.e. lined up vertically, they will have the same datum id.
            // They must be identified this way when animated to ensure they can be tracked when their y-value
            // is updated. If this is a static chart, we can instead not bother with identifying datums and
            // automatically garbage collect the marker selection.
            if (!isContinuousX && animationEnabled && this.processedData) {
                extraProps.push(diff(this.processedData));
            }
            if (animationEnabled) {
                extraProps.push(animationValidation(this));
            }
            const common = { invalidValue: null };
            if (connectMissingData && stackCount > 1) {
                common.invalidValue = 0;
            }
            if (!visible) {
                common.forceValue = 0;
            }
            yield this.requestDataModel(dataController, data, {
                props: [
                    keyProperty(this, xKey, isContinuousX, { id: 'xValue' }),
                    valueProperty(this, yKey, isContinuousY, Object.assign({ id: `yValueRaw` }, common)),
                    ...groupAccumulativeValueProperty(this, yKey, isContinuousY, 'window', 'current', Object.assign(Object.assign({ id: `yValueEnd` }, common), { groupId: ids[0] })),
                    ...groupAccumulativeValueProperty(this, yKey, isContinuousY, 'window-trailing', 'current', Object.assign(Object.assign({ id: `yValueStart` }, common), { groupId: ids[1] })),
                    ...groupAccumulativeValueProperty(this, yKey, isContinuousY, 'window', 'last', Object.assign(Object.assign({ id: `yValuePreviousEnd` }, common), { groupId: ids[2] })),
                    ...groupAccumulativeValueProperty(this, yKey, isContinuousY, 'window-trailing', 'last', Object.assign(Object.assign({ id: `yValuePreviousStart` }, common), { groupId: ids[3] })),
                    ...groupAccumulativeValueProperty(this, yKey, isContinuousY, 'normal', 'current', Object.assign(Object.assign({ id: `yValueCumulative` }, common), { groupId: ids[4] })),
                    ...extraProps,
                ],
                groupByKeys: true,
                groupByData: false,
            });
            this.animationState.transition('updateData');
        });
    }
    getSeriesDomain(direction) {
        const { processedData, dataModel, axes } = this;
        if (!processedData || !dataModel || processedData.data.length === 0)
            return [];
        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];
        const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
        const keys = dataModel.getDomain(this, `xValue`, 'key', processedData);
        const yExtent = dataModel.getDomain(this, `yValueEnd`, 'value', processedData);
        if (direction === ChartAxisDirection.X) {
            if ((keyDef === null || keyDef === void 0 ? void 0 : keyDef.def.type) === 'key' && keyDef.def.valueType === 'category') {
                return keys;
            }
            return fixNumericExtent(extent(keys), xAxis);
        }
        else if (yAxis instanceof LogAxis || yAxis instanceof TimeAxis) {
            return fixNumericExtent(yExtent, yAxis);
        }
        else {
            const fixedYExtent = [yExtent[0] > 0 ? 0 : yExtent[0], yExtent[1] < 0 ? 0 : yExtent[1]];
            return fixNumericExtent(fixedYExtent, yAxis);
        }
    }
    createNodeData() {
        const _super = Object.create(null, {
            calculateScaling: { get: () => super.calculateScaling }
        });
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const { axes, data, processedData: { data: groupedData } = {}, dataModel } = this;
            const xAxis = axes[ChartAxisDirection.X];
            const yAxis = axes[ChartAxisDirection.Y];
            if (!xAxis || !yAxis || !data || !dataModel || !this.properties.isValid()) {
                return [];
            }
            const { yKey, xKey, marker, label, fill: seriesFill, stroke: seriesStroke, connectMissingData, } = this.properties;
            const { scale: xScale } = xAxis;
            const { scale: yScale } = yAxis;
            const continuousY = ContinuousScale.is(yScale);
            const xOffset = ((_a = xScale.bandwidth) !== null && _a !== void 0 ? _a : 0) / 2;
            const defs = dataModel.resolveProcessedDataDefsByIds(this, [
                `yValueStart`,
                `yValueEnd`,
                `yValueRaw`,
                `yValuePreviousStart`,
                `yValuePreviousEnd`,
                `yValueCumulative`,
            ]);
            const createMovePoint = (plainPoint) => {
                const { point } = plainPoint, stroke = __rest(plainPoint, ["point"]);
                return Object.assign(Object.assign({}, stroke), { point: Object.assign(Object.assign({}, point), { moveTo: true }) });
            };
            const createPathCoordinates = (xValue, lastYEnd, yEnd) => {
                const x = xScale.convert(xValue) + xOffset;
                const prevYCoordinate = yScale.convert(lastYEnd);
                const currYCoordinate = yScale.convert(yEnd);
                return [
                    { point: { x, y: currYCoordinate }, yValue: yEnd, xValue },
                    { point: { x, y: prevYCoordinate }, yValue: lastYEnd, xValue },
                ];
            };
            const createMarkerCoordinate = (xDatum, yEnd, rawYDatum) => {
                let currY;
                // if not normalized, the invalid data points will be processed as `undefined` in processData()
                // if normalized, the invalid data points will be processed as 0 rather than `undefined`
                // check if unprocessed datum is valid as we only want to show markers for valid points
                if (isDefined(this.properties.normalizedTo) ? continuousY && isContinuous(rawYDatum) : !isNaN(rawYDatum)) {
                    currY = yEnd;
                }
                return {
                    x: xScale.convert(xDatum) + xOffset,
                    y: yScale.convert(currY),
                    size: marker.size,
                };
            };
            const itemId = yKey;
            const labelData = [];
            const markerData = [];
            const context = {
                itemId,
                fillData: { itemId, points: [] },
                strokeData: { itemId, points: [] },
                labelData,
                nodeData: markerData,
                scales: _super.calculateScaling.call(this),
                visible: this.visible,
            };
            const fillPoints = context.fillData.points;
            const fillPhantomPoints = [];
            const strokePoints = context.strokeData.points;
            let datumIdx = -1;
            let lastXDatum;
            let lastYDatum = -Infinity;
            groupedData === null || groupedData === void 0 ? void 0 : groupedData.forEach((datumGroup) => {
                const { keys, keys: [xDatum], datum: datumArray, values: valuesArray, } = datumGroup;
                valuesArray.forEach((values, valueIdx) => {
                    var _a, _b, _c;
                    datumIdx++;
                    const seriesDatum = datumArray[valueIdx];
                    const dataValues = dataModel.resolveProcessedDataDefsValues(defs, { keys, values });
                    const { yValueRaw: yDatum, yValueCumulative } = dataValues;
                    let { yValueStart, yValueEnd, yValuePreviousStart, yValuePreviousEnd } = dataValues;
                    const validPoint = yDatum != null;
                    // marker data
                    const point = createMarkerCoordinate(xDatum, +yValueCumulative, yDatum);
                    if (validPoint && marker) {
                        markerData.push({
                            index: datumIdx,
                            series: this,
                            itemId,
                            datum: seriesDatum,
                            midPoint: { x: point.x, y: point.y },
                            cumulativeValue: yValueEnd,
                            yValue: yDatum,
                            xValue: xDatum,
                            yKey,
                            xKey,
                            point,
                            fill: (_a = marker.fill) !== null && _a !== void 0 ? _a : seriesFill,
                            stroke: (_b = marker.stroke) !== null && _b !== void 0 ? _b : seriesStroke,
                            strokeWidth: (_c = marker.strokeWidth) !== null && _c !== void 0 ? _c : this.getStrokeWidth(this.properties.strokeWidth),
                        });
                    }
                    // label data
                    if (validPoint && label) {
                        const labelText = this.getLabelText(label, {
                            value: yDatum,
                            datum: seriesDatum,
                            xKey,
                            yKey,
                            xName: this.properties.xName,
                            yName: this.properties.yName,
                        }, (value) => (isNumber(value) ? value.toFixed(2) : String(value)));
                        labelData.push({
                            index: datumIdx,
                            series: this,
                            itemId: yKey,
                            datum: seriesDatum,
                            x: point.x,
                            y: point.y,
                            label: labelText
                                ? {
                                    text: labelText,
                                    fontStyle: label.fontStyle,
                                    fontWeight: label.fontWeight,
                                    fontSize: label.fontSize,
                                    fontFamily: label.fontFamily,
                                    textAlign: 'center',
                                    textBaseline: 'bottom',
                                    fill: label.color,
                                }
                                : undefined,
                        });
                    }
                    const xValid = lastXDatum != null && xDatum != null;
                    const yValid = lastYDatum != null && validPoint;
                    // fill data
                    if (!yValid) {
                        // Reset all coordinates to 'zero' value.
                        yValueStart = yValueStart !== null && yValueStart !== void 0 ? yValueStart : 0;
                        yValueEnd = yValueStart !== null && yValueStart !== void 0 ? yValueStart : 0;
                        yValuePreviousStart = yValuePreviousStart !== null && yValuePreviousStart !== void 0 ? yValuePreviousStart : 0;
                        yValuePreviousEnd = yValuePreviousStart !== null && yValuePreviousStart !== void 0 ? yValuePreviousStart : 0;
                    }
                    const [prevTop, prevBottom] = createPathCoordinates(lastXDatum, yValuePreviousStart, yValuePreviousEnd);
                    const [top, bottom] = createPathCoordinates(xDatum, yValueStart, yValueEnd);
                    if (xValid && (!connectMissingData || yValid)) {
                        fillPoints.push(prevTop);
                        fillPhantomPoints.push(prevBottom);
                        fillPoints.push(top);
                        fillPhantomPoints.push(bottom);
                    }
                    // stroke data
                    if (yValid && datumIdx > 0) {
                        strokePoints.push(createMovePoint(prevTop));
                        strokePoints.push(top);
                    }
                    lastXDatum = xDatum;
                    lastYDatum = yDatum;
                });
            });
            if (strokePoints.length > 0) {
                strokePoints[0] = createMovePoint(strokePoints[0]);
            }
            fillPhantomPoints.reverse();
            fillPoints.push(...fillPhantomPoints);
            return [context];
        });
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
            const { opacity, visible, animationEnabled } = opts;
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
                opacity,
                visible: visible || animationEnabled,
                strokeWidth,
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
            const { xKey, yKey, marker, fill, stroke, strokeWidth, fillOpacity, strokeOpacity, highlightStyle } = this.properties;
            const baseStyle = mergeDefaults(highlighted && highlightStyle.item, marker.getStyle(), {
                fill,
                stroke,
                strokeWidth,
                fillOpacity,
                strokeOpacity,
            });
            markerSelection.each((node, datum) => {
                this.updateMarkerStyle(node, marker, { datum, highlighted, xKey, yKey }, baseStyle);
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
            });
        });
    }
    updateLabelNodes(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { labelSelection } = opts;
            const { enabled: labelEnabled, fontStyle, fontWeight, fontSize, fontFamily, color } = this.properties.label;
            labelSelection.each((text, datum) => {
                const { x, y, label } = datum;
                if (label && labelEnabled && this.visible) {
                    text.fontStyle = fontStyle;
                    text.fontWeight = fontWeight;
                    text.fontSize = fontSize;
                    text.fontFamily = fontFamily;
                    text.textAlign = label.textAlign;
                    text.textBaseline = label.textBaseline;
                    text.text = label.text;
                    text.x = x;
                    text.y = y - 10;
                    text.fill = color;
                    text.visible = true;
                }
                else {
                    text.visible = false;
                }
            });
        });
    }
    getTooltipHtml(nodeDatum) {
        const { id: seriesId, axes, dataModel } = this;
        const { xKey, xName, yName, tooltip, marker } = this.properties;
        const { yKey, xValue, yValue, datum } = nodeDatum;
        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];
        if (!this.properties.isValid() || !(xAxis && yAxis && isNumber(yValue)) || !dataModel) {
            return '';
        }
        const xString = xAxis.formatDatum(xValue);
        const yString = yAxis.formatDatum(yValue);
        const title = sanitizeHtml(yName);
        const content = sanitizeHtml(xString + ': ' + yString);
        const baseStyle = mergeDefaults({ fill: this.properties.fill }, marker.getStyle(), {
            stroke: this.properties.stroke,
            strokeWidth: this.properties.strokeWidth,
        });
        const { fill: color } = this.getMarkerStyle(marker, { datum: nodeDatum, xKey, yKey, highlighted: false }, baseStyle);
        return tooltip.toTooltipHtml({ title, content, backgroundColor: color }, {
            datum,
            xKey,
            xName,
            yKey,
            yName,
            color,
            title,
            seriesId,
        });
    }
    getLegendData(legendType) {
        var _a, _b, _c, _d, _e, _f;
        if (!((_a = this.data) === null || _a === void 0 ? void 0 : _a.length) || !this.properties.isValid() || legendType !== 'category') {
            return [];
        }
        const { yKey, yName, fill, stroke, fillOpacity, strokeOpacity, strokeWidth, lineDash, marker, visible } = this.properties;
        return [
            {
                legendType,
                id: this.id,
                itemId: yKey,
                seriesId: this.id,
                enabled: visible,
                label: {
                    text: yName !== null && yName !== void 0 ? yName : yKey,
                },
                marker: {
                    shape: marker.shape,
                    fill: (_b = marker.fill) !== null && _b !== void 0 ? _b : fill,
                    stroke: (_c = marker.stroke) !== null && _c !== void 0 ? _c : stroke,
                    fillOpacity: (_d = marker.fillOpacity) !== null && _d !== void 0 ? _d : fillOpacity,
                    strokeOpacity: (_e = marker.strokeOpacity) !== null && _e !== void 0 ? _e : strokeOpacity,
                    strokeWidth: (_f = marker.strokeWidth) !== null && _f !== void 0 ? _f : 0,
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
        var _a, _b;
        const { animationManager } = this.ctx;
        const { markerSelections, labelSelections, contextData, paths, previousContextData } = animationData;
        super.resetAllAnimation(animationData);
        if (contextData.length === 0 || !previousContextData || previousContextData.length === 0) {
            animationManager.skipCurrentBatch();
            this.updateAreaPaths(paths, contextData);
            return;
        }
        const [[fill, stroke]] = paths;
        const [newData] = contextData;
        const [oldData] = previousContextData;
        const fns = prepareAreaPathAnimation(newData, oldData, (_b = (_a = this.processedData) === null || _a === void 0 ? void 0 : _a.reduced) === null || _b === void 0 ? void 0 : _b.diff);
        if (fns === undefined) {
            animationManager.skipCurrentBatch();
            this.updateAreaPaths(paths, contextData);
            return;
        }
        fromToMotion(this.id, 'marker_update', animationManager, markerSelections, fns.marker);
        fromToMotion(this.id, 'fill_path_properties', animationManager, [fill], fns.fill.pathProperties);
        pathMotion(this.id, 'fill_path_update', animationManager, [fill], fns.fill.path);
        this.updateStrokePath(paths, contextData);
        pathFadeInAnimation(this, 'stroke', animationManager, [stroke]);
        seriesLabelFadeInAnimation(this, 'labels', animationManager, labelSelections);
    }
    isLabelEnabled() {
        return this.properties.label.enabled;
    }
    nodeFactory() {
        return new Group();
    }
}
AreaSeries.className = 'AreaSeries';
AreaSeries.type = 'area';
//# sourceMappingURL=areaSeries.js.map