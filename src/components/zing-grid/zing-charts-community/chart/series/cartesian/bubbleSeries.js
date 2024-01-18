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
import { LinearScale } from '../../../scale/linearScale';
import { HdpiCanvas } from '../../../scene/canvas/hdpiCanvas';
import { Group } from '../../../scene/group';
import { extent } from '../../../util/array';
import { mergeDefaults } from '../../../util/object';
import { sanitizeHtml } from '../../../util/sanitize';
import { ChartAxisDirection } from '../../chartAxisDirection';
import { fixNumericExtent } from '../../data/dataModel';
import { createDatumId } from '../../data/processors';
import { getMarker } from '../../marker/util';
import { SeriesNodePickMode, keyProperty, valueProperty } from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import { BubbleSeriesProperties } from './bubbleSeriesProperties';
import { CartesianSeries, CartesianSeriesNodeClickEvent } from './cartesianSeries';
import { markerScaleInAnimation, resetMarkerFn } from './markerUtil';
class BubbleSeriesNodeClickEvent extends CartesianSeriesNodeClickEvent {
    constructor(type, nativeEvent, datum, series) {
        super(type, nativeEvent, datum, series);
        this.sizeKey = series.properties.sizeKey;
    }
}
export class BubbleSeries extends CartesianSeries {
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
                label: resetLabelFn,
                marker: resetMarkerFn,
            },
        });
        this.NodeClickEvent = BubbleSeriesNodeClickEvent;
        this.properties = new BubbleSeriesProperties();
        this.sizeScale = new LinearScale();
        this.colorScale = new ColorScale();
    }
    processData(dataController) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.properties.isValid() || this.data == null) {
                return;
            }
            const { isContinuousX, isContinuousY } = this.isContinuous();
            const { xKey, yKey, sizeKey, labelKey, colorDomain, colorRange, colorKey, marker } = this.properties;
            const { dataModel, processedData } = yield this.requestDataModel(dataController, this.data, {
                props: [
                    keyProperty(this, xKey, isContinuousX, { id: 'xKey-raw' }),
                    keyProperty(this, yKey, isContinuousY, { id: 'yKey-raw' }),
                    ...(labelKey ? [keyProperty(this, labelKey, false, { id: `labelKey-raw` })] : []),
                    valueProperty(this, xKey, isContinuousX, { id: `xValue` }),
                    valueProperty(this, yKey, isContinuousY, { id: `yValue` }),
                    valueProperty(this, sizeKey, true, { id: `sizeValue` }),
                    ...(colorKey ? [valueProperty(this, colorKey, true, { id: `colorValue` })] : []),
                    ...(labelKey ? [valueProperty(this, labelKey, false, { id: `labelValue` })] : []),
                ],
                dataVisible: this.visible,
            });
            const sizeKeyIdx = dataModel.resolveProcessedDataIndexById(this, `sizeValue`).index;
            const processedSize = (_a = processedData.domain.values[sizeKeyIdx]) !== null && _a !== void 0 ? _a : [];
            this.sizeScale.domain = marker.domain ? marker.domain : processedSize;
            if (colorKey) {
                const colorKeyIdx = dataModel.resolveProcessedDataIndexById(this, `colorValue`).index;
                this.colorScale.domain = (_b = colorDomain !== null && colorDomain !== void 0 ? colorDomain : processedData.domain.values[colorKeyIdx]) !== null && _b !== void 0 ? _b : [];
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
            const { axes, dataModel, processedData, colorScale, sizeScale } = this;
            const { xKey, yKey, sizeKey, labelKey, xName, yName, sizeName, labelName, label, colorKey, marker, visible } = this.properties;
            const xAxis = axes[ChartAxisDirection.X];
            const yAxis = axes[ChartAxisDirection.Y];
            if (!(dataModel && processedData && visible && xAxis && yAxis)) {
                return [];
            }
            const xDataIdx = dataModel.resolveProcessedDataIndexById(this, `xValue`).index;
            const yDataIdx = dataModel.resolveProcessedDataIndexById(this, `yValue`).index;
            const sizeDataIdx = sizeKey ? dataModel.resolveProcessedDataIndexById(this, `sizeValue`).index : -1;
            const colorDataIdx = colorKey ? dataModel.resolveProcessedDataIndexById(this, `colorValue`).index : -1;
            const labelDataIdx = labelKey ? dataModel.resolveProcessedDataIndexById(this, `labelValue`).index : -1;
            const xScale = xAxis.scale;
            const yScale = yAxis.scale;
            const xOffset = ((_a = xScale.bandwidth) !== null && _a !== void 0 ? _a : 0) / 2;
            const yOffset = ((_b = yScale.bandwidth) !== null && _b !== void 0 ? _b : 0) / 2;
            const nodeData = [];
            sizeScale.range = [marker.size, marker.maxSize];
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
                    sizeKey,
                    labelKey,
                    xName,
                    yName,
                    sizeName,
                    labelName,
                });
                const size = HdpiCanvas.getTextSize(String(labelText), font);
                const markerSize = sizeKey ? sizeScale.convert(values[sizeDataIdx]) : marker.size;
                const fill = colorKey ? colorScale.convert(values[colorDataIdx]) : undefined;
                nodeData.push({
                    series: this,
                    itemId: yKey,
                    yKey,
                    xKey,
                    datum,
                    xValue: xDatum,
                    yValue: yDatum,
                    sizeValue: values[sizeDataIdx],
                    point: { x, y, size: markerSize },
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
            const data = this.properties.marker.enabled ? nodeData : [];
            return markerSelection.update(data, undefined, (datum) => this.getDatumId(datum));
        });
    }
    updateMarkerNodes(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { markerSelection, isHighlight: highlighted } = opts;
            const { xKey, yKey, sizeKey, labelKey, marker } = this.properties;
            const baseStyle = mergeDefaults(highlighted && this.properties.highlightStyle.item, marker.getStyle());
            this.sizeScale.range = [marker.size, marker.maxSize];
            markerSelection.each((node, datum) => {
                this.updateMarkerStyle(node, marker, { datum, highlighted, xKey, yKey, sizeKey, labelKey }, baseStyle);
            });
            if (!highlighted) {
                this.properties.marker.markClean();
            }
        });
    }
    updateLabelSelection(opts) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const placedLabels = this.properties.label.enabled ? (_b = (_a = this.chart) === null || _a === void 0 ? void 0 : _a.placeLabels().get(this)) !== null && _b !== void 0 ? _b : [] : [];
            return opts.labelSelection.update(placedLabels.map((v) => (Object.assign(Object.assign({}, v.datum), { point: {
                    x: v.x,
                    y: v.y,
                    size: v.datum.point.size,
                } }))));
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
        var _a;
        const xAxis = this.axes[ChartAxisDirection.X];
        const yAxis = this.axes[ChartAxisDirection.Y];
        if (!this.properties.isValid() || !xAxis || !yAxis) {
            return '';
        }
        const { xKey, yKey, sizeKey, labelKey, xName, yName, sizeName, labelName, marker, tooltip } = this.properties;
        const title = (_a = this.properties.title) !== null && _a !== void 0 ? _a : yName;
        const baseStyle = mergeDefaults({ fill: nodeDatum.fill, strokeWidth: this.getStrokeWidth(marker.strokeWidth) }, marker.getStyle());
        const { fill: color = 'gray' } = this.getMarkerStyle(marker, { datum: nodeDatum, highlighted: false, xKey, yKey, sizeKey, labelKey }, baseStyle);
        const { datum, xValue, yValue, sizeValue, label: { text: labelText }, } = nodeDatum;
        const xString = sanitizeHtml(xAxis.formatDatum(xValue));
        const yString = sanitizeHtml(yAxis.formatDatum(yValue));
        let content = `<b>${sanitizeHtml(xName !== null && xName !== void 0 ? xName : xKey)}</b>: ${xString}<br>` +
            `<b>${sanitizeHtml(yName !== null && yName !== void 0 ? yName : yKey)}</b>: ${yString}`;
        if (sizeKey) {
            content += `<br><b>${sanitizeHtml(sizeName !== null && sizeName !== void 0 ? sizeName : sizeKey)}</b>: ${sanitizeHtml(String(sizeValue))}`;
        }
        if (labelKey) {
            content = `<b>${sanitizeHtml(labelName !== null && labelName !== void 0 ? labelName : labelKey)}</b>: ${sanitizeHtml(labelText)}<br>` + content;
        }
        return tooltip.toTooltipHtml({ title, content, backgroundColor: color }, {
            datum,
            xKey,
            xName,
            yKey,
            yName,
            sizeKey,
            sizeName,
            labelKey,
            labelName,
            title,
            color,
            seriesId: this.id,
        });
    }
    getLegendData() {
        var _a, _b;
        if (!((_a = this.data) === null || _a === void 0 ? void 0 : _a.length) || !this.properties.isValid()) {
            return [];
        }
        const { yKey, yName, title, marker, visible } = this.properties;
        const { shape, fill, stroke, fillOpacity, strokeOpacity, strokeWidth } = marker;
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
                    shape,
                    fill: fill !== null && fill !== void 0 ? fill : 'rgba(0, 0, 0, 0)',
                    stroke: stroke !== null && stroke !== void 0 ? stroke : 'rgba(0, 0, 0, 0)',
                    fillOpacity: fillOpacity !== null && fillOpacity !== void 0 ? fillOpacity : 1,
                    strokeOpacity: strokeOpacity !== null && strokeOpacity !== void 0 ? strokeOpacity : 1,
                    strokeWidth: strokeWidth !== null && strokeWidth !== void 0 ? strokeWidth : 0,
                },
            },
        ];
    }
    animateEmptyUpdateReady({ markerSelections, labelSelections }) {
        markerScaleInAnimation(this, this.ctx.animationManager, markerSelections);
        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelections);
    }
    getDatumId(datum) {
        return createDatumId([`${datum.xValue}`, `${datum.yValue}`, datum.label.text]);
    }
    isLabelEnabled() {
        return this.properties.label.enabled;
    }
    nodeFactory() {
        return new Group();
    }
}
BubbleSeries.className = 'BubbleSeries';
BubbleSeries.type = 'bubble';
//# sourceMappingURL=bubbleSeries.js.map