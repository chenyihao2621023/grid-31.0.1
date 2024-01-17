var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { fromToMotion } from '../../../motion/fromToMotion';
import { pathMotion } from '../../../motion/pathMotion';
import { resetMotion } from '../../../motion/resetMotion';
import { Group } from '../../../scene/group';
import { PointerEvents } from '../../../scene/node';
import { extent } from '../../../util/array';
import { mergeDefaults } from '../../../util/object';
import { sanitizeHtml } from '../../../util/sanitize';
import { isNumber } from '../../../util/value';
import { ChartAxisDirection } from '../../chartAxisDirection';
import { fixNumericExtent } from '../../data/dataModel';
import { animationValidation, createDatumId, diff } from '../../data/processors';
import { getMarker } from '../../marker/util';
import { SeriesNodePickMode, keyProperty, valueProperty } from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import { CartesianSeries } from './cartesianSeries';
import { LineSeriesProperties } from './lineSeriesProperties';
import { prepareLinePathAnimation } from './lineUtil';
import { markerSwipeScaleInAnimation, resetMarkerFn, resetMarkerPositionFn } from './markerUtil';
import { buildResetPathFn, pathSwipeInAnimation, updateClipPath } from './pathUtil';
export class LineSeries extends CartesianSeries {
    constructor(moduleCtx) {
        super({
            moduleCtx,
            hasMarkers: true,
            pickModes: [
                SeriesNodePickMode.NEAREST_BY_MAIN_CATEGORY_AXIS_FIRST,
                SeriesNodePickMode.NEAREST_NODE,
                SeriesNodePickMode.EXACT_SHAPE_MATCH,
            ],
            markerSelectionGarbageCollection: false,
            animationResetFns: {
                path: buildResetPathFn({ getOpacity: () => this.getOpacity() }),
                label: resetLabelFn,
                marker: (node, datum) => (Object.assign(Object.assign({}, resetMarkerFn(node)), resetMarkerPositionFn(node, datum))),
            },
        });
        this.properties = new LineSeriesProperties();
    }
    processData(dataController) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.properties.isValid() || this.data == null) {
                return;
            }
            const { xKey, yKey } = this.properties;
            const animationEnabled = !this.ctx.animationManager.isSkipped();
            const { isContinuousX, isContinuousY } = this.isContinuous();
            const props = [];
            // If two or more datum share an x-value, i.e. lined up vertically, they will have the same datum id.
            // They must be identified this way when animated to ensure they can be tracked when their y-value
            // is updated. If this is a static chart, we can instead not bother with identifying datum and
            // automatically garbage collect the marker selection.
            if (!isContinuousX) {
                props.push(keyProperty(this, xKey, isContinuousX, { id: 'xKey' }));
                if (animationEnabled && this.processedData) {
                    props.push(diff(this.processedData));
                }
            }
            if (animationEnabled) {
                props.push(animationValidation(this, isContinuousX ? ['xValue'] : []));
            }
            props.push(valueProperty(this, xKey, isContinuousX, { id: 'xValue' }), valueProperty(this, yKey, isContinuousY, { id: 'yValue', invalidValue: undefined }));
            yield this.requestDataModel(dataController, this.data, { props });
            this.animationState.transition('updateData');
        });
    }
    getSeriesDomain(direction) {
        const { axes, dataModel, processedData } = this;
        if (!processedData || !dataModel)
            return [];
        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];
        const xDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
        if (direction === ChartAxisDirection.X) {
            const domain = dataModel.getDomain(this, `xValue`, 'value', processedData);
            if ((xDef === null || xDef === void 0 ? void 0 : xDef.def.type) === 'value' && xDef.def.valueType === 'category') {
                return domain;
            }
            return fixNumericExtent(extent(domain), xAxis);
        }
        else {
            const domain = dataModel.getDomain(this, `yValue`, 'value', processedData);
            return fixNumericExtent(domain, yAxis);
        }
    }
    createNodeData() {
        const _super = Object.create(null, {
            calculateScaling: { get: () => super.calculateScaling }
        });
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const { processedData, dataModel, axes } = this;
            const xAxis = axes[ChartAxisDirection.X];
            const yAxis = axes[ChartAxisDirection.Y];
            if (!processedData || !dataModel || !xAxis || !yAxis) {
                return [];
            }
            const { xKey, yKey, xName, yName, marker, label, connectMissingData } = this.properties;
            const xScale = xAxis.scale;
            const yScale = yAxis.scale;
            const xOffset = ((_a = xScale.bandwidth) !== null && _a !== void 0 ? _a : 0) / 2;
            const yOffset = ((_b = yScale.bandwidth) !== null && _b !== void 0 ? _b : 0) / 2;
            const nodeData = [];
            const size = marker.enabled ? marker.size : 0;
            const xIdx = dataModel.resolveProcessedDataIndexById(this, `xValue`).index;
            const yIdx = dataModel.resolveProcessedDataIndexById(this, `yValue`).index;
            let moveTo = true;
            let nextPoint;
            for (let i = 0; i < processedData.data.length; i++) {
                const { datum, values } = nextPoint !== null && nextPoint !== void 0 ? nextPoint : processedData.data[i];
                const xDatum = values[xIdx];
                const yDatum = values[yIdx];
                if (yDatum === undefined) {
                    moveTo = !connectMissingData;
                }
                else {
                    const x = xScale.convert(xDatum) + xOffset;
                    if (isNaN(x)) {
                        moveTo = !connectMissingData;
                        nextPoint = undefined;
                        continue;
                    }
                    nextPoint =
                        ((_c = processedData.data[i + 1]) === null || _c === void 0 ? void 0 : _c.values[yIdx]) === undefined ? undefined : processedData.data[i + 1];
                    const y = yScale.convert(yDatum) + yOffset;
                    const labelText = this.getLabelText(label, { value: yDatum, datum, xKey, yKey, xName, yName }, (value) => (isNumber(value) ? value.toFixed(2) : String(value)));
                    nodeData.push({
                        series: this,
                        datum,
                        yKey,
                        xKey,
                        point: { x, y, moveTo, size },
                        midPoint: { x, y },
                        yValue: yDatum,
                        xValue: xDatum,
                        capDefaults: { lengthRatioMultiplier: this.properties.marker.getDiameter(), lengthMax: Infinity },
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
                    moveTo = false;
                }
            }
            return [
                {
                    itemId: yKey,
                    nodeData,
                    labelData: nodeData,
                    scales: _super.calculateScaling.call(this),
                    visible: this.visible,
                },
            ];
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
            const { paths: [lineNode], opacity, visible, animationEnabled, } = opts;
            lineNode.setProperties({
                fill: undefined,
                lineJoin: 'round',
                pointerEvents: PointerEvents.None,
                opacity,
                stroke: this.properties.stroke,
                strokeWidth: this.getStrokeWidth(this.properties.strokeWidth),
                strokeOpacity: this.properties.strokeOpacity,
                lineDash: this.properties.lineDash,
                lineDashOffset: this.properties.lineDashOffset,
            });
            if (!animationEnabled) {
                lineNode.visible = visible;
            }
            updateClipPath(this, lineNode);
        });
    }
    updateMarkerSelection(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            let { nodeData } = opts;
            const { markerSelection } = opts;
            const { shape, enabled } = this.properties.marker;
            nodeData = shape && enabled ? nodeData : [];
            if (this.properties.marker.isDirty()) {
                markerSelection.clear();
                markerSelection.cleanup();
            }
            return markerSelection.update(nodeData, undefined, (datum) => this.getDatumId(datum));
        });
    }
    updateMarkerNodes(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { markerSelection, isHighlight: highlighted } = opts;
            const { xKey, yKey, stroke, strokeWidth, strokeOpacity, marker, highlightStyle } = this.properties;
            const baseStyle = mergeDefaults(highlighted && highlightStyle.item, marker.getStyle(), {
                stroke,
                strokeWidth,
                strokeOpacity,
            });
            const applyTranslation = this.ctx.animationManager.isSkipped();
            markerSelection.each((node, datum) => {
                this.updateMarkerStyle(node, marker, { datum, highlighted, xKey, yKey }, baseStyle, { applyTranslation });
            });
            if (!highlighted) {
                marker.markClean();
            }
        });
    }
    updateLabelSelection(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            return opts.labelSelection.update(this.isLabelEnabled() ? opts.labelData : []);
        });
    }
    updateLabelNodes(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { enabled, fontStyle, fontWeight, fontSize, fontFamily, color } = this.properties.label;
            opts.labelSelection.each((text, datum) => {
                const { point, label } = datum;
                if (datum && label && enabled) {
                    text.fontStyle = fontStyle;
                    text.fontWeight = fontWeight;
                    text.fontSize = fontSize;
                    text.fontFamily = fontFamily;
                    text.textAlign = label.textAlign;
                    text.textBaseline = label.textBaseline;
                    text.text = label.text;
                    text.x = point.x;
                    text.y = point.y - 10;
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
        var _a;
        const xAxis = this.axes[ChartAxisDirection.X];
        const yAxis = this.axes[ChartAxisDirection.Y];
        if (!this.properties.isValid() || !xAxis || !yAxis) {
            return '';
        }
        const { xKey, yKey, xName, yName, strokeWidth, marker, tooltip } = this.properties;
        const { datum, xValue, yValue } = nodeDatum;
        const xString = xAxis.formatDatum(xValue);
        const yString = yAxis.formatDatum(yValue);
        const title = sanitizeHtml((_a = this.properties.title) !== null && _a !== void 0 ? _a : yName);
        const content = sanitizeHtml(xString + ': ' + yString);
        const baseStyle = mergeDefaults({ fill: marker.stroke }, marker.getStyle(), { strokeWidth });
        const { fill: color } = this.getMarkerStyle(marker, { datum: nodeDatum, xKey, yKey, highlighted: false }, baseStyle);
        return tooltip.toTooltipHtml({ title, content, backgroundColor: color }, Object.assign({ datum,
            xKey,
            xName,
            yKey,
            yName,
            title,
            color, seriesId: this.id }, this.getModuleTooltipParams()));
    }
    getLegendData(legendType) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        if (!(((_a = this.data) === null || _a === void 0 ? void 0 : _a.length) && this.properties.isValid() && legendType === 'category')) {
            return [];
        }
        const { yKey, yName, stroke, strokeOpacity, strokeWidth, lineDash, title, marker, visible } = this.properties;
        const color0 = 'rgba(0, 0, 0, 0)';
        return [
            {
                legendType: 'category',
                id: this.id,
                itemId: yKey,
                seriesId: this.id,
                enabled: visible,
                label: {
                    text: (_b = title !== null && title !== void 0 ? title : yName) !== null && _b !== void 0 ? _b : yKey,
                },
                marker: {
                    shape: marker.shape,
                    fill: (_c = marker.fill) !== null && _c !== void 0 ? _c : color0,
                    stroke: (_e = (_d = marker.stroke) !== null && _d !== void 0 ? _d : stroke) !== null && _e !== void 0 ? _e : color0,
                    fillOpacity: (_f = marker.fillOpacity) !== null && _f !== void 0 ? _f : 1,
                    strokeOpacity: (_h = (_g = marker.strokeOpacity) !== null && _g !== void 0 ? _g : strokeOpacity) !== null && _h !== void 0 ? _h : 1,
                    strokeWidth: (_j = marker.strokeWidth) !== null && _j !== void 0 ? _j : 0,
                    enabled: marker.enabled,
                },
                line: {
                    stroke: stroke !== null && stroke !== void 0 ? stroke : color0,
                    strokeOpacity,
                    strokeWidth,
                    lineDash,
                },
            },
        ];
    }
    updatePaths(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            this.updateLinePaths([opts.paths], [opts.contextData]);
        });
    }
    updateLinePaths(paths, contextData) {
        contextData.forEach(({ nodeData }, contextDataIndex) => {
            const [lineNode] = paths[contextDataIndex];
            const { path: linePath } = lineNode;
            linePath.clear({ trackChanges: true });
            for (const data of nodeData) {
                if (data.point.moveTo) {
                    linePath.moveTo(data.point.x, data.point.y);
                }
                else {
                    linePath.lineTo(data.point.x, data.point.y);
                }
            }
            lineNode.checkPathDirty();
        });
    }
    animateEmptyUpdateReady(animationData) {
        const { markerSelections, labelSelections, annotationSelections, contextData, paths } = animationData;
        const { animationManager } = this.ctx;
        this.updateLinePaths(paths, contextData);
        pathSwipeInAnimation(this, animationManager, paths.flat());
        resetMotion(markerSelections, resetMarkerPositionFn);
        markerSwipeScaleInAnimation(this, animationManager, markerSelections);
        seriesLabelFadeInAnimation(this, 'labels', animationManager, labelSelections);
        seriesLabelFadeInAnimation(this, 'annotations', animationManager, annotationSelections);
    }
    animateReadyResize(animationData) {
        const { contextData, paths } = animationData;
        this.updateLinePaths(paths, contextData);
        super.animateReadyResize(animationData);
    }
    animateWaitingUpdateReady(animationData) {
        var _a, _b;
        const { animationManager } = this.ctx;
        const { markerSelections, labelSelections, annotationSelections, contextData, paths, previousContextData } = animationData;
        super.resetAllAnimation(animationData);
        if (contextData.length === 0 || !previousContextData || previousContextData.length === 0) {
            animationManager.skipCurrentBatch();
            this.updateLinePaths(paths, contextData);
            return;
        }
        const [path] = paths;
        const [newData] = contextData;
        const [oldData] = previousContextData;
        const fns = prepareLinePathAnimation(newData, oldData, (_b = (_a = this.processedData) === null || _a === void 0 ? void 0 : _a.reduced) === null || _b === void 0 ? void 0 : _b.diff);
        if (fns === undefined) {
            animationManager.skipCurrentBatch();
            this.updateLinePaths(paths, contextData);
            return;
        }
        fromToMotion(this.id, 'marker', animationManager, markerSelections, fns.marker);
        fromToMotion(this.id, 'path_properties', animationManager, path, fns.pathProperties);
        pathMotion(this.id, 'path_update', animationManager, path, fns.path);
        if (fns.hasMotion) {
            seriesLabelFadeInAnimation(this, 'labels', animationManager, labelSelections);
            seriesLabelFadeInAnimation(this, 'annotations', animationManager, annotationSelections);
        }
    }
    getDatumId(datum) {
        return createDatumId([`${datum.xValue}`]);
    }
    isLabelEnabled() {
        return this.properties.label.enabled;
    }
    getBandScalePadding() {
        return { inner: 1, outer: 0.1 };
    }
    nodeFactory() {
        return new Group();
    }
}
LineSeries.className = 'LineSeries';
LineSeries.type = 'line';
//# sourceMappingURL=lineSeries.js.map