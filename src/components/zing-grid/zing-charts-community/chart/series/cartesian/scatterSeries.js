var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ColorScale } from '../../../scale/colorScale';
import { HdpiCanvas } from '../../../scene/canvas/hdpiCanvas';
import { Group } from '../../../scene/group';
import { PointerEvents } from '../../../scene/node';
import { extent } from '../../../util/array';
import { mergeDefaults } from '../../../util/object';
import { sanitizeHtml } from '../../../util/sanitize';
import { ChartAxisDirection } from '../../chartAxisDirection';
import { fixNumericExtent } from '../../data/dataModel';
import { getMarker } from '../../marker/util';
import { SeriesNodePickMode, keyProperty, valueProperty } from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import { CartesianSeries } from './cartesianSeries';
import { markerScaleInAnimation, resetMarkerFn } from './markerUtil';
import { ScatterSeriesProperties } from './scatterSeriesProperties';
export class ScatterSeries extends CartesianSeries {
    constructor(moduleCtx) {
        super({
            moduleCtx,
            pickModes: [
                SeriesNodePickMode.NEAREST_BY_MAIN_CATEGORY_AXIS_FIRST,
                SeriesNodePickMode.NEAREST_NODE,
                SeriesNodePickMode.EXACT_SHAPE_MATCH,
            ],
            pathsPerSeries: 0,
            hasMarkers: true,
            markerSelectionGarbageCollection: false,
            animationResetFns: {
                marker: resetMarkerFn,
                label: resetLabelFn,
            },
        });
        this.properties = new ScatterSeriesProperties();
        this.colorScale = new ColorScale();
    }
    processData(dataController) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.properties.isValid() || this.data == null) {
                return;
            }
            const { isContinuousX, isContinuousY } = this.isContinuous();
            const { xKey, yKey, labelKey, colorKey, colorDomain, colorRange } = this.properties;
            const { dataModel, processedData } = yield this.requestDataModel(dataController, this.data, {
                props: [
                    keyProperty(this, xKey, isContinuousX, { id: 'xKey-raw' }),
                    keyProperty(this, yKey, isContinuousY, { id: 'yKey-raw' }),
                    ...(labelKey ? [keyProperty(this, labelKey, false, { id: `labelKey-raw` })] : []),
                    valueProperty(this, xKey, isContinuousX, { id: `xValue` }),
                    valueProperty(this, yKey, isContinuousY, { id: `yValue` }),
                    ...(colorKey ? [valueProperty(this, colorKey, true, { id: `colorValue` })] : []),
                    ...(labelKey ? [valueProperty(this, labelKey, false, { id: `labelValue` })] : []),
                ],
                dataVisible: this.visible,
            });
            if (colorKey) {
                const colorKeyIdx = dataModel.resolveProcessedDataIndexById(this, `colorValue`).index;
                this.colorScale.domain = (_a = colorDomain !== null && colorDomain !== void 0 ? colorDomain : processedData.domain.values[colorKeyIdx]) !== null && _a !== void 0 ? _a : [];
                this.colorScale.range = colorRange;
                this.colorScale.update();
            }
            this.animationState.transition('updateData');
        });
    }
    getSeriesDomain(direction) {
        const { dataModel, processedData } = this;
        if (!processedData || !dataModel)
            return [];
        const id = direction === ChartAxisDirection.X ? `xValue` : `yValue`;
        const dataDef = dataModel.resolveProcessedDataDefById(this, id);
        const domain = dataModel.getDomain(this, id, 'value', processedData);
        if ((dataDef === null || dataDef === void 0 ? void 0 : dataDef.def.type) === 'value' && (dataDef === null || dataDef === void 0 ? void 0 : dataDef.def.valueType) === 'category') {
            return domain;
        }
        const axis = this.axes[direction];
        return fixNumericExtent(extent(domain), axis);
    }
    createNodeData() {
        const _super = Object.create(null, {
            calculateScaling: { get: () => super.calculateScaling }
        });
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const { axes, dataModel, processedData, colorScale } = this;
            const { xKey, yKey, labelKey, colorKey, xName, yName, labelName, marker, label, visible } = this.properties;
            const xAxis = axes[ChartAxisDirection.X];
            const yAxis = axes[ChartAxisDirection.Y];
            if (!(dataModel && processedData && visible && xAxis && yAxis)) {
                return [];
            }
            const xDataIdx = dataModel.resolveProcessedDataIndexById(this, `xValue`).index;
            const yDataIdx = dataModel.resolveProcessedDataIndexById(this, `yValue`).index;
            const colorDataIdx = colorKey ? dataModel.resolveProcessedDataIndexById(this, `colorValue`).index : -1;
            const labelDataIdx = labelKey ? dataModel.resolveProcessedDataIndexById(this, `labelValue`).index : -1;
            const xScale = xAxis.scale;
            const yScale = yAxis.scale;
            const xOffset = ((_a = xScale.bandwidth) !== null && _a !== void 0 ? _a : 0) / 2;
            const yOffset = ((_b = yScale.bandwidth) !== null && _b !== void 0 ? _b : 0) / 2;
            const nodeData = [];
            const font = label.getFont();
            for (const { values, datum } of (_c = processedData.data) !== null && _c !== void 0 ? _c : []) {
                const xDatum = values[xDataIdx];
                const yDatum = values[yDataIdx];
                const x = xScale.convert(xDatum) + xOffset;
                const y = yScale.convert(yDatum) + yOffset;
                const labelText = this.getLabelText(label, {
                    value: labelKey ? values[labelDataIdx] : yDatum,
                    datum,
                    xKey,
                    yKey,
                    labelKey,
                    xName,
                    yName,
                    labelName,
                });
                const size = HdpiCanvas.getTextSize(labelText, font);
                const fill = colorKey ? colorScale.convert(values[colorDataIdx]) : undefined;
                nodeData.push({
                    series: this,
                    itemId: yKey,
                    yKey,
                    xKey,
                    datum,
                    xValue: xDatum,
                    yValue: yDatum,
                    capDefaults: { lengthRatioMultiplier: marker.getDiameter(), lengthMax: Infinity },
                    point: { x, y, size: marker.size },
                    midPoint: { x, y },
                    fill,
                    label: Object.assign({ text: labelText }, size),
                });
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
    getLabelData() {
        var _a;
        return (_a = this.contextNodeData) === null || _a === void 0 ? void 0 : _a.reduce((r, n) => r.concat(n.labelData), []);
    }
    markerFactory() {
        const { shape } = this.properties.marker;
        const MarkerShape = getMarker(shape);
        return new MarkerShape();
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
            const { xKey, yKey, labelKey, marker, highlightStyle } = this.properties;
            const baseStyle = mergeDefaults(highlighted && highlightStyle.item, marker.getStyle());
            markerSelection.each((node, datum) => {
                this.updateMarkerStyle(node, marker, { datum, highlighted, xKey, yKey, labelKey }, baseStyle);
            });
            if (!highlighted) {
                marker.markClean();
            }
        });
    }
    updateLabelSelection(opts) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const placedLabels = this.isLabelEnabled() ? (_b = (_a = this.chart) === null || _a === void 0 ? void 0 : _a.placeLabels().get(this)) !== null && _b !== void 0 ? _b : [] : [];
            return opts.labelSelection.update(placedLabels.map(({ datum, x, y }) => (Object.assign(Object.assign({}, datum), { point: { x, y, size: datum.point.size } }))), (text) => {
                text.pointerEvents = PointerEvents.None;
            });
        });
    }
    updateLabelNodes(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { label } = this.properties;
            opts.labelSelection.each((text, datum) => {
                var _a, _b, _c, _d;
                text.text = datum.label.text;
                text.fill = label.color;
                text.x = (_b = (_a = datum.point) === null || _a === void 0 ? void 0 : _a.x) !== null && _b !== void 0 ? _b : 0;
                text.y = (_d = (_c = datum.point) === null || _c === void 0 ? void 0 : _c.y) !== null && _d !== void 0 ? _d : 0;
                text.fontStyle = label.fontStyle;
                text.fontWeight = label.fontWeight;
                text.fontSize = label.fontSize;
                text.fontFamily = label.fontFamily;
                text.textAlign = 'left';
                text.textBaseline = 'top';
            });
        });
    }
    getTooltipHtml(nodeDatum) {
        const xAxis = this.axes[ChartAxisDirection.X];
        const yAxis = this.axes[ChartAxisDirection.Y];
        if (!this.properties.isValid() || !xAxis || !yAxis) {
            return '';
        }
        const { xKey, yKey, labelKey, xName, yName, labelName, title = yName, marker, tooltip } = this.properties;
        const { datum, xValue, yValue, label } = nodeDatum;
        const baseStyle = mergeDefaults({ fill: nodeDatum.fill, strokeWidth: this.getStrokeWidth(marker.strokeWidth) }, marker.getStyle());
        const { fill: color = 'gray' } = this.getMarkerStyle(marker, { datum: nodeDatum, highlighted: false, xKey, yKey, labelKey }, baseStyle);
        const xString = sanitizeHtml(xAxis.formatDatum(xValue));
        const yString = sanitizeHtml(yAxis.formatDatum(yValue));
        let content = `<b>${sanitizeHtml(xName !== null && xName !== void 0 ? xName : xKey)}</b>: ${xString}<br>` +
            `<b>${sanitizeHtml(yName !== null && yName !== void 0 ? yName : yKey)}</b>: ${yString}`;
        if (labelKey) {
            content = `<b>${sanitizeHtml(labelName !== null && labelName !== void 0 ? labelName : labelKey)}</b>: ${sanitizeHtml(label.text)}<br>` + content;
        }
        return tooltip.toTooltipHtml({ title, content, backgroundColor: color }, Object.assign({ datum,
            xKey,
            xName,
            yKey,
            yName,
            labelKey,
            labelName,
            title,
            color, seriesId: this.id }, this.getModuleTooltipParams()));
    }
    getLegendData(legendType) {
        var _a, _b, _c, _d, _e, _f;
        const { yKey, yName, title, marker, visible } = this.properties;
        const { fill, stroke, fillOpacity, strokeOpacity, strokeWidth } = marker;
        if (!((_a = this.data) === null || _a === void 0 ? void 0 : _a.length) || !this.properties.isValid() || legendType !== 'category') {
            return [];
        }
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
                    fill: (_d = (_c = marker.fill) !== null && _c !== void 0 ? _c : fill) !== null && _d !== void 0 ? _d : 'rgba(0, 0, 0, 0)',
                    stroke: (_f = (_e = marker.stroke) !== null && _e !== void 0 ? _e : stroke) !== null && _f !== void 0 ? _f : 'rgba(0, 0, 0, 0)',
                    fillOpacity: fillOpacity !== null && fillOpacity !== void 0 ? fillOpacity : 1,
                    strokeOpacity: strokeOpacity !== null && strokeOpacity !== void 0 ? strokeOpacity : 1,
                    strokeWidth: strokeWidth !== null && strokeWidth !== void 0 ? strokeWidth : 0,
                },
            },
        ];
    }
    animateEmptyUpdateReady(data) {
        const { markerSelections, labelSelections, annotationSelections } = data;
        markerScaleInAnimation(this, this.ctx.animationManager, markerSelections);
        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelections);
        seriesLabelFadeInAnimation(this, 'annotations', this.ctx.animationManager, annotationSelections);
    }
    isLabelEnabled() {
        return this.properties.label.enabled;
    }
    nodeFactory() {
        return new Group();
    }
}
ScatterSeries.className = 'ScatterSeries';
ScatterSeries.type = 'scatter';
