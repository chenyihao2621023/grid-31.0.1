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
import { prepareBoxPlotFromTo, resetBoxPlotSelectionsScalingCenterFn } from './blotPlotUtil';
import { BoxPlotGroup } from './boxPlotGroup';
import { BoxPlotSeriesProperties } from './boxPlotSeriesProperties';
const { extent, extractDecoratedProperties, fixNumericExtent, keyProperty, mergeDefaults, SeriesNodePickMode, SMALLEST_KEY_INTERVAL, valueProperty, diff, animationValidation, ChartAxisDirection, } = _ModuleSupport;
const { motion } = _Scene;
class BoxPlotSeriesNodeClickEvent extends _ModuleSupport.SeriesNodeClickEvent {
    constructor(type, nativeEvent, datum, series) {
        super(type, nativeEvent, datum, series);
        this.xKey = series.properties.xKey;
        this.minKey = series.properties.minKey;
        this.q1Key = series.properties.q1Key;
        this.medianKey = series.properties.medianKey;
        this.q3Key = series.properties.q3Key;
        this.maxKey = series.properties.maxKey;
    }
}
export class BoxPlotSeries extends _ModuleSupport.AbstractBarSeries {
    constructor(moduleCtx) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH],
            pathsPerSeries: 1,
            hasHighlightedLabels: true,
        });
        this.properties = new BoxPlotSeriesProperties();
        this.NodeClickEvent = BoxPlotSeriesNodeClickEvent;
        /**
         * Used to get the position of items within each group.
         */
        this.groupScale = new _Scale.BandScale();
        this.smallestDataInterval = undefined;
    }
    processData(dataController) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.properties.isValid()) {
                return;
            }
            const { xKey, minKey, q1Key, medianKey, q3Key, maxKey } = this.properties;
            const animationEnabled = !this.ctx.animationManager.isSkipped();
            const isContinuousX = ((_a = this.getCategoryAxis()) === null || _a === void 0 ? void 0 : _a.scale) instanceof _Scale.ContinuousScale;
            const extraProps = [];
            if (animationEnabled && this.processedData) {
                extraProps.push(diff(this.processedData));
            }
            if (animationEnabled) {
                extraProps.push(animationValidation(this));
            }
            const { processedData } = yield this.requestDataModel(dataController, (_b = this.data) !== null && _b !== void 0 ? _b : [], {
                props: [
                    keyProperty(this, xKey, isContinuousX, { id: `xValue` }),
                    valueProperty(this, minKey, true, { id: `minValue` }),
                    valueProperty(this, q1Key, true, { id: `q1Value` }),
                    valueProperty(this, medianKey, true, { id: `medianValue` }),
                    valueProperty(this, q3Key, true, { id: `q3Value` }),
                    valueProperty(this, maxKey, true, { id: `maxValue` }),
                    ...(isContinuousX ? [SMALLEST_KEY_INTERVAL] : []),
                    ...extraProps,
                ],
                dataVisible: this.visible,
            });
            this.smallestDataInterval = {
                x: (_d = (_c = processedData.reduced) === null || _c === void 0 ? void 0 : _c.smallestKeyInterval) !== null && _d !== void 0 ? _d : Infinity,
                y: Infinity,
            };
            this.animationState.transition('updateData');
        });
    }
    getSeriesDomain(direction) {
        var _a;
        const { processedData, dataModel, smallestDataInterval } = this;
        if (!(processedData && dataModel))
            return [];
        if (direction === this.getBarDirection()) {
            const minValues = dataModel.getDomain(this, `minValue`, 'value', processedData);
            const maxValues = dataModel.getDomain(this, `maxValue`, 'value', processedData);
            return fixNumericExtent([Math.min(...minValues), Math.max(...maxValues)], this.getValueAxis());
        }
        const { index, def } = dataModel.resolveProcessedDataIndexById(this, `xValue`);
        const keys = processedData.domain.keys[index];
        if (def.type === 'key' && def.valueType === 'category') {
            return keys;
        }
        const categoryAxis = this.getCategoryAxis();
        const isReversed = categoryAxis === null || categoryAxis === void 0 ? void 0 : categoryAxis.isReversed();
        const keysExtent = (_a = extent(keys)) !== null && _a !== void 0 ? _a : [NaN, NaN];
        const scalePadding = smallestDataInterval && isFinite(smallestDataInterval.x) ? smallestDataInterval.x : 0;
        if (direction === ChartAxisDirection.Y) {
            const d0 = keysExtent[0] + (isReversed ? 0 : -scalePadding);
            const d1 = keysExtent[1] + (isReversed ? scalePadding : 0);
            return fixNumericExtent([d0, d1], categoryAxis);
        }
        const d0 = keysExtent[0] + (isReversed ? -scalePadding : 0);
        const d1 = keysExtent[1] + (isReversed ? 0 : scalePadding);
        return fixNumericExtent([d0, d1], categoryAxis);
    }
    createNodeData() {
        const _super = Object.create(null, {
            calculateScaling: { get: () => super.calculateScaling }
        });
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const { visible, dataModel } = this;
            const xAxis = this.getCategoryAxis();
            const yAxis = this.getValueAxis();
            if (!(dataModel && visible && xAxis && yAxis)) {
                return [];
            }
            const { xKey, fill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset, cap, whisker } = this.properties;
            const { groupScale, smallestDataInterval, ctx: { seriesStateManager }, } = this;
            const xBandWidth = xAxis.scale instanceof _Scale.ContinuousScale
                ? xAxis.scale.calcBandwidth(smallestDataInterval === null || smallestDataInterval === void 0 ? void 0 : smallestDataInterval.x)
                : xAxis.scale.bandwidth;
            const domain = [];
            const { index: groupIndex, visibleGroupCount } = seriesStateManager.getVisiblePeerGroupIndex(this);
            for (let groupIdx = 0; groupIdx < visibleGroupCount; groupIdx++) {
                domain.push(String(groupIdx));
            }
            groupScale.domain = domain;
            groupScale.range = [0, xBandWidth !== null && xBandWidth !== void 0 ? xBandWidth : 0];
            if (xAxis instanceof _ModuleSupport.CategoryAxis) {
                groupScale.paddingInner = xAxis.groupPaddingInner;
            }
            const barWidth = groupScale.bandwidth >= 1
                ? // Pixel-rounded value for low-volume bar charts.
                    groupScale.bandwidth
                : // Handle high-volume bar charts gracefully.
                    groupScale.rawBandwidth;
            const nodeData = [];
            const defs = dataModel.resolveProcessedDataDefsByIds(this, [
                'xValue',
                'minValue',
                'q1Value',
                `medianValue`,
                `q3Value`,
                `maxValue`,
            ]);
            (_a = this.processedData) === null || _a === void 0 ? void 0 : _a.data.forEach(({ datum, keys, values }) => {
                const { xValue, minValue, q1Value, medianValue, q3Value, maxValue } = dataModel.resolveProcessedDataDefsValues(defs, { keys, values });
                if ([minValue, q1Value, medianValue, q3Value, maxValue].some((value) => typeof value !== 'number') ||
                    minValue > q1Value ||
                    q1Value > medianValue ||
                    medianValue > q3Value ||
                    q3Value > maxValue) {
                    return;
                }
                const scaledValues = this.convertValuesToScaleByDefs(defs, {
                    xValue,
                    minValue,
                    q1Value,
                    medianValue,
                    q3Value,
                    maxValue,
                });
                scaledValues.xValue += Math.round(groupScale.convert(String(groupIndex)));
                nodeData.push({
                    series: this,
                    itemId: xValue,
                    datum,
                    xKey,
                    bandwidth: Math.round(barWidth),
                    scaledValues,
                    cap,
                    whisker,
                    fill,
                    fillOpacity,
                    stroke,
                    strokeWidth,
                    strokeOpacity,
                    lineDash,
                    lineDashOffset,
                });
            });
            return [{ itemId: xKey, nodeData, labelData: [], scales: _super.calculateScaling.call(this), visible: this.visible }];
        });
    }
    getLegendData(legendType) {
        var _a;
        const { id, data } = this;
        const { xKey, yName, fill, fillOpacity, stroke, strokeWidth, strokeOpacity, showInLegend, legendItemName, visible, } = this.properties;
        if (!showInLegend || !(data === null || data === void 0 ? void 0 : data.length) || !xKey || legendType !== 'category') {
            return [];
        }
        return [
            {
                legendType: 'category',
                id,
                itemId: id,
                seriesId: id,
                enabled: visible,
                label: {
                    text: (_a = legendItemName !== null && legendItemName !== void 0 ? legendItemName : yName) !== null && _a !== void 0 ? _a : id,
                },
                marker: { fill, fillOpacity, stroke, strokeOpacity, strokeWidth },
                legendItemName,
            },
        ];
    }
    getTooltipHtml(nodeDatum) {
        const { xKey, minKey, q1Key, medianKey, q3Key, maxKey, xName, yName, minName, q1Name, medianName, q3Name, maxName, tooltip, } = this.properties;
        const { datum } = nodeDatum;
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();
        if (!xAxis || !yAxis || !this.properties.isValid())
            return '';
        const title = _Util.sanitizeHtml(yName);
        const contentData = [
            [xKey, xName, xAxis],
            [minKey, minName, yAxis],
            [q1Key, q1Name, yAxis],
            [medianKey, medianName, yAxis],
            [q3Key, q3Name, yAxis],
            [maxKey, maxName, yAxis],
        ];
        const content = contentData
            .map(([key, name, axis]) => _Util.sanitizeHtml(`${name !== null && name !== void 0 ? name : key}: ${axis.formatDatum(datum[key])}`))
            .join(title ? '<br/>' : ', ');
        const { fill } = this.getFormattedStyles(nodeDatum);
        return tooltip.toTooltipHtml({ title, content, backgroundColor: fill }, {
            seriesId: this.id,
            datum,
            fill,
            xKey,
            minKey,
            q1Key,
            medianKey,
            q3Key,
            maxKey,
            xName,
            minName,
            q1Name,
            medianName,
            q3Name,
            maxName,
        });
    }
    animateEmptyUpdateReady({ datumSelections, }) {
        const isVertical = this.isVertical();
        const { from, to } = prepareBoxPlotFromTo(isVertical);
        motion.resetMotion(datumSelections, resetBoxPlotSelectionsScalingCenterFn(isVertical));
        motion.staticFromToMotion(this.id, 'datums', this.ctx.animationManager, datumSelections, from, to);
    }
    isLabelEnabled() {
        return false;
    }
    updateDatumSelection(opts) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const data = (_a = opts.nodeData) !== null && _a !== void 0 ? _a : [];
            return opts.datumSelection.update(data);
        });
    }
    updateDatumNodes({ datumSelection, 
    // highlightedItems,
    isHighlight: highlighted, }) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const isVertical = this.isVertical();
            const isReversedValueAxis = (_a = this.getValueAxis()) === null || _a === void 0 ? void 0 : _a.isReversed();
            datumSelection.each((boxPlotGroup, nodeDatum) => {
                let activeStyles = this.getFormattedStyles(nodeDatum, highlighted);
                if (highlighted) {
                    activeStyles = mergeDefaults(this.properties.highlightStyle.item, activeStyles);
                }
                const { stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = activeStyles;
                activeStyles.whisker = mergeDefaults(activeStyles.whisker, {
                    stroke,
                    strokeWidth,
                    strokeOpacity,
                    lineDash,
                    lineDashOffset,
                });
                // hide duplicates of highlighted nodes
                // boxPlotGroup.opacity =
                //     highlighted || !highlightedItems?.some((datum) => datum.itemId === nodeDatum.itemId) ? 1 : 0;
                boxPlotGroup.updateDatumStyles(nodeDatum, activeStyles, isVertical, isReversedValueAxis);
            });
        });
    }
    updateLabelNodes(_opts) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    updateLabelSelection(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { labelData, labelSelection } = opts;
            return labelSelection.update(labelData);
        });
    }
    nodeFactory() {
        return new BoxPlotGroup();
    }
    getFormattedStyles(nodeDatum, highlighted = false) {
        const { id: seriesId, ctx: { callbackCache }, } = this;
        const { xKey, minKey, q1Key, medianKey, q3Key, maxKey, formatter } = this.properties;
        const { datum, fill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset, cap, whisker } = nodeDatum;
        const activeStyles = {
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            cap: extractDecoratedProperties(cap),
            whisker: extractDecoratedProperties(whisker),
        };
        if (formatter) {
            const formatStyles = callbackCache.call(formatter, Object.assign(Object.assign({ datum,
                seriesId,
                highlighted }, activeStyles), { xKey,
                minKey,
                q1Key,
                medianKey,
                q3Key,
                maxKey }));
            if (formatStyles) {
                return mergeDefaults(formatStyles, activeStyles);
            }
        }
        return activeStyles;
    }
    convertValuesToScaleByDefs(defs, values) {
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();
        if (!(xAxis && yAxis)) {
            throw new Error('Axes must be defined');
        }
        const result = {};
        for (const [searchId, [{ def }]] of defs) {
            if (Object.hasOwn(values, searchId)) {
                const { scale } = def.type === 'key' ? xAxis : yAxis;
                result[searchId] = Math.round(scale.convert(values[searchId]));
            }
        }
        return result;
    }
}
//# sourceMappingURL=boxPlotSeries.js.map