var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { _ModuleSupport, _Scale, _Scene, _Util } from '@/components/zing-grid/zing-charts-community/main.js';
import { formatLabels } from '../util/labelFormatter';
import { HeatmapSeriesProperties } from './heatmapSeriesProperties';
const { SeriesNodePickMode, valueProperty, ChartAxisDirection } = _ModuleSupport;
const { Rect, PointerEvents } = _Scene;
const { ColorScale } = _Scale;
const { sanitizeHtml, Color, Logger } = _Util;
class HeatmapSeriesNodeClickEvent extends _ModuleSupport.CartesianSeriesNodeClickEvent {
    constructor(type, nativeEvent, datum, series) {
        super(type, nativeEvent, datum, series);
        this.colorKey = series.properties.colorKey;
    }
}
const textAlignFactors = {
    left: -0.5,
    center: 0,
    right: -0.5,
};
const verticalAlignFactors = {
    top: -0.5,
    middle: 0,
    bottom: -0.5,
};
export class HeatmapSeries extends _ModuleSupport.CartesianSeries {
    constructor(moduleCtx) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH],
            pathsPerSeries: 0,
            hasMarkers: false,
            hasHighlightedLabels: true,
        });
        this.properties = new HeatmapSeriesProperties();
        this.NodeClickEvent = HeatmapSeriesNodeClickEvent;
        this.colorScale = new ColorScale();
    }
    processData(dataController) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const xAxis = this.axes[ChartAxisDirection.X];
            const yAxis = this.axes[ChartAxisDirection.Y];
            if (!xAxis || !yAxis || !this.properties.isValid() || !((_a = this.data) === null || _a === void 0 ? void 0 : _a.length)) {
                return;
            }
            const { xKey, yKey, colorRange, colorKey } = this.properties;
            const { isContinuousX, isContinuousY } = this.isContinuous();
            const { dataModel, processedData } = yield this.requestDataModel(dataController, this.data, {
                props: [
                    valueProperty(this, xKey, isContinuousX, { id: 'xValue' }),
                    valueProperty(this, yKey, isContinuousY, { id: 'yValue' }),
                    ...(colorKey ? [valueProperty(this, colorKey, true, { id: 'colorValue' })] : []),
                ],
            });
            if (this.isColorScaleValid()) {
                const colorKeyIdx = dataModel.resolveProcessedDataIndexById(this, 'colorValue').index;
                this.colorScale.domain = processedData.domain.values[colorKeyIdx];
                this.colorScale.range = colorRange;
                this.colorScale.update();
            }
        });
    }
    isColorScaleValid() {
        const { colorKey } = this.properties;
        if (!colorKey) {
            return false;
        }
        const { dataModel, processedData } = this;
        if (!dataModel || !processedData) {
            return false;
        }
        const colorDataIdx = dataModel.resolveProcessedDataIndexById(this, 'colorValue').index;
        const dataCount = processedData.data.length;
        const colorDataMissing = dataCount === 0 || dataCount === processedData.defs.values[colorDataIdx].missing;
        return !colorDataMissing;
    }
    getSeriesDomain(direction) {
        const { dataModel, processedData } = this;
        if (!dataModel || !processedData)
            return [];
        if (direction === ChartAxisDirection.X) {
            return dataModel.getDomain(this, `xValue`, 'value', processedData);
        }
        else {
            return dataModel.getDomain(this, `yValue`, 'value', processedData);
        }
    }
    createNodeData() {
        const _super = Object.create(null, {
            calculateScaling: { get: () => super.calculateScaling }
        });
        var _a, _b, _c, _d, _e, _f, _g;
        return __awaiter(this, void 0, void 0, function* () {
            const { data, visible, axes, dataModel } = this;
            const xAxis = axes[ChartAxisDirection.X];
            const yAxis = axes[ChartAxisDirection.Y];
            if (!(data && dataModel && visible && xAxis && yAxis)) {
                return [];
            }
            if (xAxis.type !== 'category' || yAxis.type !== 'category') {
                Logger.warnOnce(`Heatmap series expected axes to have "category" type, but received "${xAxis.type}" and "${yAxis.type}" instead.`);
                return [];
            }
            const { xKey, xName, yKey, yName, colorKey, colorName, textAlign, verticalAlign, itemPadding, colorRange, label, } = this.properties;
            const xDataIdx = dataModel.resolveProcessedDataIndexById(this, `xValue`).index;
            const yDataIdx = dataModel.resolveProcessedDataIndexById(this, `yValue`).index;
            const colorDataIdx = colorKey ? dataModel.resolveProcessedDataIndexById(this, `colorValue`).index : undefined;
            const xScale = xAxis.scale;
            const yScale = yAxis.scale;
            const xOffset = ((_a = xScale.bandwidth) !== null && _a !== void 0 ? _a : 0) / 2;
            const yOffset = ((_b = yScale.bandwidth) !== null && _b !== void 0 ? _b : 0) / 2;
            const colorScaleValid = this.isColorScaleValid();
            const nodeData = [];
            const labelData = [];
            const width = (_c = xScale.bandwidth) !== null && _c !== void 0 ? _c : 10;
            const height = (_d = yScale.bandwidth) !== null && _d !== void 0 ? _d : 10;
            const textAlignFactor = (width - 2 * itemPadding) * textAlignFactors[textAlign];
            const verticalAlignFactor = (height - 2 * itemPadding) * verticalAlignFactors[verticalAlign];
            const sizeFittingHeight = () => ({ width, height, meta: null });
            for (const { values, datum } of (_f = (_e = this.processedData) === null || _e === void 0 ? void 0 : _e.data) !== null && _f !== void 0 ? _f : []) {
                const xDatum = values[xDataIdx];
                const yDatum = values[yDataIdx];
                const x = xScale.convert(xDatum) + xOffset;
                const y = yScale.convert(yDatum) + yOffset;
                const colorValue = colorDataIdx != null ? values[colorDataIdx] : undefined;
                const fill = colorScaleValid && colorValue != null ? this.colorScale.convert(colorValue) : colorRange[0];
                const labelText = colorValue != null
                    ? this.getLabelText(label, {
                        value: colorValue,
                        datum,
                        colorKey,
                        colorName,
                        xKey,
                        yKey,
                        xName,
                        yName,
                    })
                    : undefined;
                const labels = formatLabels(labelText, this.properties.label, undefined, this.properties.label, { padding: itemPadding }, sizeFittingHeight);
                const point = { x, y, size: 0 };
                nodeData.push({
                    series: this,
                    itemId: yKey,
                    yKey,
                    xKey,
                    xValue: xDatum,
                    yValue: yDatum,
                    colorValue,
                    datum,
                    point,
                    width,
                    height,
                    fill,
                    midPoint: { x, y },
                });
                if ((labels === null || labels === void 0 ? void 0 : labels.label) != null) {
                    const { text, fontSize, lineHeight, height: labelHeight } = labels.label;
                    const { fontStyle, fontFamily, fontWeight, color } = this.properties.label;
                    const x = point.x + textAlignFactor * (width - 2 * itemPadding);
                    const y = point.y + verticalAlignFactor * (height - 2 * itemPadding) - (labels.height - labelHeight) * 0.5;
                    labelData.push({
                        series: this,
                        itemId: yKey,
                        datum,
                        text,
                        fontSize,
                        lineHeight,
                        fontStyle,
                        fontFamily,
                        fontWeight,
                        color,
                        textAlign,
                        verticalAlign,
                        x,
                        y,
                    });
                }
            }
            return [
                {
                    itemId: (_g = this.properties.yKey) !== null && _g !== void 0 ? _g : this.id,
                    nodeData,
                    labelData,
                    scales: _super.calculateScaling.call(this),
                    visible: this.visible,
                },
            ];
        });
    }
    nodeFactory() {
        return new Rect();
    }
    updateDatumSelection(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { nodeData, datumSelection } = opts;
            const data = nodeData !== null && nodeData !== void 0 ? nodeData : [];
            return datumSelection.update(data);
        });
    }
    updateDatumNodes(opts) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const { isHighlight: isDatumHighlighted } = opts;
            const { id: seriesId, ctx: { callbackCache }, } = this;
            const { xKey, yKey, colorKey, formatter, highlightStyle: { item: { fill: highlightedFill, stroke: highlightedStroke, strokeWidth: highlightedDatumStrokeWidth, fillOpacity: highlightedFillOpacity, }, }, } = this.properties;
            const xAxis = this.axes[ChartAxisDirection.X];
            const [visibleMin, visibleMax] = (_a = xAxis === null || xAxis === void 0 ? void 0 : xAxis.visibleRange) !== null && _a !== void 0 ? _a : [];
            const isZoomed = visibleMin !== 0 || visibleMax !== 1;
            const crisp = !isZoomed;
            opts.datumSelection.each((rect, datum) => {
                var _a, _b, _c;
                const { point, width, height } = datum;
                const fill = isDatumHighlighted && highlightedFill !== undefined
                    ? Color.interpolate(datum.fill, highlightedFill)(highlightedFillOpacity !== null && highlightedFillOpacity !== void 0 ? highlightedFillOpacity : 1)
                    : datum.fill;
                const stroke = isDatumHighlighted && highlightedStroke !== undefined ? highlightedStroke : this.properties.stroke;
                const strokeWidth = isDatumHighlighted && highlightedDatumStrokeWidth !== undefined
                    ? highlightedDatumStrokeWidth
                    : this.properties.strokeWidth;
                let format;
                if (formatter) {
                    format = callbackCache.call(formatter, {
                        datum: datum.datum,
                        fill,
                        stroke,
                        strokeWidth,
                        highlighted: isDatumHighlighted,
                        xKey,
                        yKey,
                        colorKey,
                        seriesId,
                    });
                }
                rect.crisp = crisp;
                rect.x = Math.floor(point.x - width / 2);
                rect.y = Math.floor(point.y - height / 2);
                rect.width = Math.ceil(width);
                rect.height = Math.ceil(height);
                rect.fill = (_a = format === null || format === void 0 ? void 0 : format.fill) !== null && _a !== void 0 ? _a : fill;
                rect.stroke = (_b = format === null || format === void 0 ? void 0 : format.stroke) !== null && _b !== void 0 ? _b : stroke;
                rect.strokeWidth = (_c = format === null || format === void 0 ? void 0 : format.strokeWidth) !== null && _c !== void 0 ? _c : strokeWidth;
            });
        });
    }
    updateLabelSelection(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { labelData, labelSelection } = opts;
            const { enabled } = this.properties.label;
            const data = enabled ? labelData : [];
            return labelSelection.update(data);
        });
    }
    updateLabelNodes(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            opts.labelSelection.each((text, datum) => {
                text.text = datum.text;
                text.fontSize = datum.fontSize;
                text.lineHeight = datum.lineHeight;
                text.fontStyle = datum.fontStyle;
                text.fontFamily = datum.fontFamily;
                text.fontWeight = datum.fontWeight;
                text.fill = datum.color;
                text.textAlign = datum.textAlign;
                text.textBaseline = datum.verticalAlign;
                text.x = datum.x;
                text.y = datum.y;
                text.pointerEvents = PointerEvents.None;
            });
        });
    }
    getTooltipHtml(nodeDatum) {
        var _a, _b, _c;
        const xAxis = this.axes[ChartAxisDirection.X];
        const yAxis = this.axes[ChartAxisDirection.Y];
        if (!this.properties.isValid() || !xAxis || !yAxis) {
            return '';
        }
        const { xKey, yKey, colorKey, xName, yName, colorName, stroke, strokeWidth, colorRange, formatter, tooltip } = this.properties;
        const { colorScale, id: seriesId, ctx: { callbackCache }, } = this;
        const { datum, xValue, yValue, colorValue } = nodeDatum;
        const fill = this.isColorScaleValid() ? colorScale.convert(colorValue) : colorRange[0];
        let format;
        if (formatter) {
            format = callbackCache.call(formatter, {
                datum: nodeDatum,
                xKey,
                yKey,
                colorKey,
                fill,
                stroke,
                strokeWidth,
                highlighted: false,
                seriesId,
            });
        }
        const color = (_b = (_a = format === null || format === void 0 ? void 0 : format.fill) !== null && _a !== void 0 ? _a : fill) !== null && _b !== void 0 ? _b : 'gray';
        const title = (_c = this.properties.title) !== null && _c !== void 0 ? _c : yName;
        const xString = sanitizeHtml(xAxis.formatDatum(xValue));
        const yString = sanitizeHtml(yAxis.formatDatum(yValue));
        let content = `<b>${sanitizeHtml(xName || xKey)}</b>: ${xString}<br>` +
            `<b>${sanitizeHtml(yName || yKey)}</b>: ${yString}`;
        if (colorKey) {
            content = `<b>${sanitizeHtml(colorName || colorKey)}</b>: ${sanitizeHtml(colorValue)}<br>` + content;
        }
        return tooltip.toTooltipHtml({ title, content, backgroundColor: color }, {
            seriesId,
            datum,
            xKey,
            yKey,
            xName,
            yName,
            title,
            color,
            colorKey,
        });
    }
    getLegendData(legendType) {
        var _a;
        if (legendType !== 'gradient' ||
            !((_a = this.data) === null || _a === void 0 ? void 0 : _a.length) ||
            !this.properties.isValid() ||
            !this.isColorScaleValid() ||
            !this.dataModel) {
            return [];
        }
        return [
            {
                legendType: 'gradient',
                enabled: this.visible,
                seriesId: this.id,
                colorName: this.properties.colorName,
                colorDomain: this.processedData.domain.values[this.dataModel.resolveProcessedDataIndexById(this, 'colorValue').index],
                colorRange: this.properties.colorRange,
            },
        ];
    }
    isLabelEnabled() {
        return this.properties.label.enabled && Boolean(this.properties.colorKey);
    }
    getBandScalePadding() {
        return { inner: 0, outer: 0 };
    }
}
HeatmapSeries.className = 'HeatmapSeries';
HeatmapSeries.type = 'heatmap';
