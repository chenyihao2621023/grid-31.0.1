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
import { PointerEvents } from '../../../scene/node';
import { Rect } from '../../../scene/shape/rect';
import { sanitizeHtml, tickStep, ticks } from '../../../sparklines-util';
import { isReal } from '../../../util/number';
import { ChartAxisDirection } from '../../chartAxisDirection';
import { area, groupAverage, groupCount, groupSum } from '../../data/aggregateFunctions';
import { fixNumericExtent } from '../../data/dataModel';
import { SORT_DOMAIN_GROUPS, createDatumId, diff } from '../../data/processors';
import { Series, SeriesNodePickMode, keyProperty, valueProperty } from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import { collapsedStartingBarPosition, prepareBarAnimationFunctions, resetBarSelectionsFn } from './barUtil';
import { CartesianSeries } from './cartesianSeries';
import { HistogramSeriesProperties } from './histogramSeriesProperties';
var HistogramSeriesNodeTag;
(function (HistogramSeriesNodeTag) {
    HistogramSeriesNodeTag[HistogramSeriesNodeTag["Bin"] = 0] = "Bin";
    HistogramSeriesNodeTag[HistogramSeriesNodeTag["Label"] = 1] = "Label";
})(HistogramSeriesNodeTag || (HistogramSeriesNodeTag = {}));
const defaultBinCount = 10;
export class HistogramSeries extends CartesianSeries {
    constructor(moduleCtx) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH],
            datumSelectionGarbageCollection: false,
            animationResetFns: {
                datum: resetBarSelectionsFn,
                label: resetLabelFn,
            },
        });
        this.properties = new HistogramSeriesProperties();
        this.calculatedBins = [];
    }
    // During processData phase, used to unify different ways of the user specifying
    // the bins. Returns bins in format[[min1, max1], [min2, max2], ... ].
    deriveBins(xDomain) {
        if (this.properties.binCount) {
            return this.calculateNiceBins(xDomain, this.properties.binCount);
        }
        const binStarts = ticks(xDomain[0], xDomain[1], defaultBinCount);
        const binSize = tickStep(xDomain[0], xDomain[1], defaultBinCount);
        const [firstBinEnd] = binStarts;
        const expandStartToBin = (n) => [n, n + binSize];
        return [[firstBinEnd - binSize, firstBinEnd], ...binStarts.map(expandStartToBin)];
    }
    calculateNiceBins(domain, binCount) {
        const startGuess = Math.floor(domain[0]);
        const stop = domain[1];
        const segments = binCount || 1;
        const { start, binSize } = this.calculateNiceStart(startGuess, stop, segments);
        return this.getBins(start, stop, binSize, segments);
    }
    getBins(start, stop, step, count) {
        const bins = [];
        const precision = this.calculatePrecision(step);
        for (let i = 0; i < count; i++) {
            const a = Math.round((start + i * step) * precision) / precision;
            let b = Math.round((start + (i + 1) * step) * precision) / precision;
            if (i === count - 1) {
                b = Math.max(b, stop);
            }
            bins[i] = [a, b];
        }
        return bins;
    }
    calculatePrecision(step) {
        let precision = 10;
        if (isReal(step) && step > 0) {
            while (step < 1) {
                precision *= 10;
                step *= 10;
            }
        }
        return precision;
    }
    calculateNiceStart(a, b, segments) {
        const binSize = Math.abs(b - a) / segments;
        const order = Math.floor(Math.log10(binSize));
        const magnitude = Math.pow(10, order);
        const start = Math.floor(a / magnitude) * magnitude;
        return {
            start,
            binSize,
        };
    }
    processData(dataController) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const { xKey, yKey, areaPlot, aggregation } = this.properties;
            const props = [keyProperty(this, xKey, true), SORT_DOMAIN_GROUPS];
            if (yKey) {
                let aggProp = groupCount(this, 'groupCount');
                if (aggregation === 'count') {
                    // Nothing to do.
                }
                else if (aggregation === 'sum') {
                    aggProp = groupSum(this, 'groupAgg');
                }
                else if (aggregation === 'mean') {
                    aggProp = groupAverage(this, 'groupAgg');
                }
                if (areaPlot) {
                    aggProp = area(this, 'groupAgg', aggProp);
                }
                props.push(valueProperty(this, yKey, true, { invalidValue: undefined }), aggProp);
            }
            else {
                let aggProp = groupCount(this, 'groupAgg');
                if (areaPlot) {
                    aggProp = area(this, 'groupAgg', aggProp);
                }
                props.push(aggProp);
            }
            const groupByFn = (dataSet) => {
                var _a;
                const xExtent = fixNumericExtent(dataSet.domain.keys[0]);
                if (xExtent.length === 0) {
                    // No buckets can be calculated.
                    dataSet.domain.groups = [];
                    return () => [];
                }
                const bins = (_a = this.properties.bins) !== null && _a !== void 0 ? _a : this.deriveBins(xExtent);
                const binCount = bins.length;
                this.calculatedBins = [...bins];
                return (item) => {
                    const xValue = item.keys[0];
                    for (let i = 0; i < binCount; i++) {
                        const nextBin = bins[i];
                        if (xValue >= nextBin[0] && xValue < nextBin[1]) {
                            return nextBin;
                        }
                        if (i === binCount - 1 && xValue <= nextBin[1]) {
                            // Handle edge case of a value being at the maximum extent, and the
                            // final bin aligning with it.
                            return nextBin;
                        }
                    }
                    return [];
                };
            };
            if (!this.ctx.animationManager.isSkipped() && this.processedData) {
                props.push(diff(this.processedData, false));
            }
            yield this.requestDataModel(dataController, (_a = this.data) !== null && _a !== void 0 ? _a : [], {
                props,
                dataVisible: this.visible,
                groupByFn,
            });
            this.animationState.transition('updateData');
        });
    }
    getSeriesDomain(direction) {
        var _a, _b, _c, _d;
        const { processedData, dataModel } = this;
        if (!processedData || !dataModel || !this.calculatedBins.length)
            return [];
        const yDomain = dataModel.getDomain(this, `groupAgg`, 'aggregate', processedData);
        const xDomainMin = (_a = this.calculatedBins) === null || _a === void 0 ? void 0 : _a[0][0];
        const xDomainMax = (_b = this.calculatedBins) === null || _b === void 0 ? void 0 : _b[((_d = (_c = this.calculatedBins) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : 0) - 1][1];
        if (direction === ChartAxisDirection.X) {
            return fixNumericExtent([xDomainMin, xDomainMax]);
        }
        return fixNumericExtent(yDomain);
    }
    createNodeData() {
        const _super = Object.create(null, {
            calculateScaling: { get: () => super.calculateScaling }
        });
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const { id: seriesId, axes, processedData, ctx: { callbackCache }, } = this;
            const xAxis = axes[ChartAxisDirection.X];
            const yAxis = axes[ChartAxisDirection.Y];
            if (!this.visible || !xAxis || !yAxis || !processedData || processedData.type !== 'grouped') {
                return [];
            }
            const { scale: xScale } = xAxis;
            const { scale: yScale } = yAxis;
            const { xKey, yKey, xName, yName, fill, stroke, strokeWidth } = this.properties;
            const { formatter: labelFormatter = (params) => String(params.value), fontStyle: labelFontStyle, fontWeight: labelFontWeight, fontSize: labelFontSize, fontFamily: labelFontFamily, color: labelColor, } = this.properties.label;
            const nodeData = [];
            processedData.data.forEach((group) => {
                var _a;
                const { aggValues: [[negativeAgg, positiveAgg]] = [[0, 0]], datum, datum: { length: frequency }, keys: domain, keys: [xDomainMin, xDomainMax], } = group;
                const xMinPx = xScale.convert(xDomainMin);
                const xMaxPx = xScale.convert(xDomainMax);
                const total = negativeAgg + positiveAgg;
                const yZeroPx = yScale.convert(0);
                const yMaxPx = yScale.convert(total);
                const w = Math.abs(xMaxPx - xMinPx);
                const h = Math.abs(yMaxPx - yZeroPx);
                const x = Math.min(xMinPx, xMaxPx);
                const y = Math.min(yZeroPx, yMaxPx);
                const selectionDatumLabel = total !== 0
                    ? {
                        text: (_a = callbackCache.call(labelFormatter, {
                            value: total,
                            datum,
                            seriesId,
                            xKey,
                            yKey,
                            xName,
                            yName,
                        })) !== null && _a !== void 0 ? _a : String(total),
                        fontStyle: labelFontStyle,
                        fontWeight: labelFontWeight,
                        fontSize: labelFontSize,
                        fontFamily: labelFontFamily,
                        fill: labelColor,
                        x: x + w / 2,
                        y: y + h / 2,
                    }
                    : undefined;
                const nodeMidPoint = {
                    x: x + w / 2,
                    y: y + h / 2,
                };
                nodeData.push({
                    series: this,
                    datum, // required by SeriesNodeDatum, but might not make sense here
                    // since each selection is an aggregation of multiple data.
                    aggregatedValue: total,
                    frequency,
                    domain: domain,
                    yKey,
                    xKey,
                    x,
                    y,
                    xValue: xMinPx,
                    yValue: yMaxPx,
                    width: w,
                    height: h,
                    midPoint: nodeMidPoint,
                    fill: fill,
                    stroke: stroke,
                    strokeWidth: strokeWidth,
                    label: selectionDatumLabel,
                });
            });
            return [
                {
                    itemId: (_a = this.properties.yKey) !== null && _a !== void 0 ? _a : this.id,
                    nodeData,
                    labelData: nodeData,
                    scales: _super.calculateScaling.call(this),
                    animationValid: true,
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
            return datumSelection.update(nodeData, (rect) => {
                rect.tag = HistogramSeriesNodeTag.Bin;
                rect.crisp = true;
            }, (datum) => datum.domain.join('_'));
        });
    }
    updateDatumNodes(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { isHighlight: isDatumHighlighted } = opts;
            const { fillOpacity: seriesFillOpacity, strokeOpacity, lineDash, lineDashOffset, shadow, highlightStyle: { item: { fill: highlightedFill, fillOpacity: highlightFillOpacity = seriesFillOpacity, stroke: highlightedStroke, strokeWidth: highlightedDatumStrokeWidth, }, }, } = this.properties;
            opts.datumSelection.each((rect, datum, index) => {
                var _a, _b;
                const strokeWidth = isDatumHighlighted && highlightedDatumStrokeWidth !== undefined
                    ? highlightedDatumStrokeWidth
                    : datum.strokeWidth;
                const fillOpacity = isDatumHighlighted ? highlightFillOpacity : seriesFillOpacity;
                rect.fill = (_a = (isDatumHighlighted ? highlightedFill : undefined)) !== null && _a !== void 0 ? _a : datum.fill;
                rect.stroke = (_b = (isDatumHighlighted ? highlightedStroke : undefined)) !== null && _b !== void 0 ? _b : datum.stroke;
                rect.fillOpacity = fillOpacity;
                rect.strokeOpacity = strokeOpacity;
                rect.strokeWidth = strokeWidth;
                rect.lineDash = lineDash;
                rect.lineDashOffset = lineDashOffset;
                rect.fillShadow = shadow;
                rect.zIndex = isDatumHighlighted ? Series.highlightedZIndex : index;
                rect.visible = datum.height > 0; // prevent stroke from rendering for zero height columns
            });
        });
    }
    updateLabelSelection(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { labelData, labelSelection } = opts;
            return labelSelection.update(labelData, (text) => {
                text.tag = HistogramSeriesNodeTag.Label;
                text.pointerEvents = PointerEvents.None;
                text.textAlign = 'center';
                text.textBaseline = 'middle';
            });
        });
    }
    updateLabelNodes(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const labelEnabled = this.isLabelEnabled();
            opts.labelSelection.each((text, datum) => {
                const label = datum.label;
                if (label && labelEnabled) {
                    text.text = label.text;
                    text.x = label.x;
                    text.y = label.y;
                    text.fontStyle = label.fontStyle;
                    text.fontWeight = label.fontWeight;
                    text.fontSize = label.fontSize;
                    text.fontFamily = label.fontFamily;
                    text.fill = label.fill;
                    text.visible = true;
                }
                else {
                    text.visible = false;
                }
            });
        });
    }
    getTooltipHtml(nodeDatum) {
        const xAxis = this.axes[ChartAxisDirection.X];
        const yAxis = this.axes[ChartAxisDirection.Y];
        if (!this.properties.isValid() || !xAxis || !yAxis) {
            return '';
        }
        const { xKey, yKey, xName, yName, fill: color, aggregation, tooltip } = this.properties;
        const { aggregatedValue, frequency, domain: [rangeMin, rangeMax], } = nodeDatum;
        const title = `${sanitizeHtml(xName !== null && xName !== void 0 ? xName : xKey)}: ${xAxis.formatDatum(rangeMin)} - ${xAxis.formatDatum(rangeMax)}`;
        let content = yKey
            ? `<b>${sanitizeHtml(yName !== null && yName !== void 0 ? yName : yKey)} (${aggregation})</b>: ${yAxis.formatDatum(aggregatedValue)}<br>`
            : '';
        content += `<b>Frequency</b>: ${frequency}`;
        const defaults = {
            title,
            backgroundColor: color,
            content,
        };
        return tooltip.toTooltipHtml(defaults, {
            datum: {
                data: nodeDatum.datum,
                aggregatedValue: nodeDatum.aggregatedValue,
                domain: nodeDatum.domain,
                frequency: nodeDatum.frequency,
            },
            xKey,
            xName,
            yKey,
            yName,
            color,
            title,
            seriesId: this.id,
        });
    }
    getLegendData(legendType) {
        var _a, _b;
        if (!((_a = this.data) === null || _a === void 0 ? void 0 : _a.length) || legendType !== 'category') {
            return [];
        }
        const { xKey, yName, fill, fillOpacity, stroke, strokeWidth, strokeOpacity, visible } = this.properties;
        return [
            {
                legendType: 'category',
                id: this.id,
                itemId: xKey,
                seriesId: this.id,
                enabled: visible,
                label: {
                    text: (_b = yName !== null && yName !== void 0 ? yName : xKey) !== null && _b !== void 0 ? _b : 'Frequency',
                },
                marker: {
                    fill: fill !== null && fill !== void 0 ? fill : 'rgba(0, 0, 0, 0)',
                    stroke: stroke !== null && stroke !== void 0 ? stroke : 'rgba(0, 0, 0, 0)',
                    fillOpacity: fillOpacity,
                    strokeOpacity: strokeOpacity,
                    strokeWidth,
                },
            },
        ];
    }
    animateEmptyUpdateReady({ datumSelections, labelSelections }) {
        const fns = prepareBarAnimationFunctions(collapsedStartingBarPosition(true, this.axes));
        fromToMotion(this.id, 'datums', this.ctx.animationManager, datumSelections, fns);
        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelections);
    }
    animateWaitingUpdateReady(data) {
        var _a, _b;
        const diff = (_b = (_a = this.processedData) === null || _a === void 0 ? void 0 : _a.reduced) === null || _b === void 0 ? void 0 : _b.diff;
        const fns = prepareBarAnimationFunctions(collapsedStartingBarPosition(true, this.axes));
        fromToMotion(this.id, 'datums', this.ctx.animationManager, data.datumSelections, fns, (_, datum) => this.getDatumId(datum), diff);
        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, data.labelSelections);
    }
    getDatumId(datum) {
        return createDatumId(datum.domain.map((d) => `${d}`));
    }
    isLabelEnabled() {
        return this.properties.label.enabled;
    }
}
HistogramSeries.className = 'HistogramSeries';
HistogramSeries.type = 'histogram';
//# sourceMappingURL=histogramSeries.js.map