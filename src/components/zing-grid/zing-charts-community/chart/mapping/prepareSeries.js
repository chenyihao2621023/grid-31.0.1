import { Debug } from '../../util/debug';
import { Logger } from '../../util/logger';
import { isGroupableSeries, isSeriesStackedByDefault, isStackableSeries } from '../factory/seriesTypes';
/**
 * Groups the series options objects if they are of type `column` or `bar` and places them in an array at the index where the first instance of this series type was found.
 * Returns an array of arrays containing the ordered and grouped series options objects.
 */
export function groupSeriesByType(seriesOptions) {
    var _a, _b, _c;
    const groupMap = {};
    const stackMap = {};
    const defaultUnstackedGroup = 'default-zing-charts-group';
    const result = [];
    for (const s of seriesOptions) {
        const type = (_a = s.type) !== null && _a !== void 0 ? _a : 'line';
        const stackable = isStackableSeries(type);
        const groupable = isGroupableSeries(type);
        if (!stackable && !groupable) {
            // No need to use index for these cases.
            result.push({ type: 'ungrouped', opts: [s] });
            continue;
        }
        const { stacked: sStacked, stackGroup: sStackGroup, grouped: sGrouped = undefined, xKey } = s;
        const stacked = sStackGroup != null || sStacked === true;
        const grouped = sGrouped === true;
        let groupingKey = [sStackGroup !== null && sStackGroup !== void 0 ? sStackGroup : (sStacked === true ? 'stacked' : undefined), grouped ? 'grouped' : undefined]
            .filter((v) => v != null)
            .join('-');
        if (!groupingKey) {
            groupingKey = defaultUnstackedGroup;
        }
        const indexKey = `${type}-${xKey}-${groupingKey}`;
        if (stacked && stackable) {
            const updated = ((_b = stackMap[indexKey]) !== null && _b !== void 0 ? _b : (stackMap[indexKey] = { type: 'stack', opts: [] }));
            if (updated.opts.length === 0)
                result.push(updated);
            updated.opts.push(s);
        }
        else if (grouped && groupable) {
            const updated = ((_c = groupMap[indexKey]) !== null && _c !== void 0 ? _c : (groupMap[indexKey] = { type: 'group', opts: [] }));
            if (updated.opts.length === 0)
                result.push(updated);
            updated.opts.push(s);
        }
        else {
            result.push({ type: 'ungrouped', opts: [s] });
        }
    }
    return result;
}
/**
 * Transforms provided series options array into an array containing series options which are compatible with standalone charts series options.
 */
export function processSeriesOptions(_opts, seriesOptions) {
    var _a;
    const result = [];
    const preprocessed = seriesOptions.map((series) => {
        var _a;
        // Change the default for bar/columns when yKey is used to be grouped rather than stacked.
        const sType = (_a = series.type) !== null && _a !== void 0 ? _a : 'line';
        const groupable = isGroupableSeries(sType);
        const stackable = isStackableSeries(sType);
        const stackedByDefault = isSeriesStackedByDefault(sType);
        if (series.grouped && !groupable) {
            Logger.warnOnce(`unsupported grouping of series type: ${sType}`);
        }
        if (series.stacked && !stackable) {
            Logger.warnOnce(`unsupported stacking of series type: ${sType}`);
        }
        if (!groupable && !stackable) {
            return series;
        }
        let stacked = false;
        let grouped = false;
        if (series.stacked === undefined && series.grouped === undefined) {
            stacked = stackable && stackedByDefault;
            grouped = groupable && !stacked;
        }
        else if (series.stacked === undefined) {
            stacked = stackable && stackedByDefault && !(series.grouped && groupable);
            grouped = groupable && !stacked && !!series.grouped;
        }
        else if (series.grouped === undefined) {
            stacked = stackable && series.stacked;
            grouped = groupable && !stacked;
        }
        else {
            stacked = stackable && series.stacked;
            grouped = groupable && !stacked && series.grouped;
        }
        return Object.assign(Object.assign({}, series), { stacked, grouped });
    });
    const grouped = groupSeriesByType(preprocessed);
    const groupCount = grouped.reduce((result, next) => {
        var _a, _b;
        if (next.type === 'ungrouped')
            return result;
        const seriesType = (_a = next.opts[0].type) !== null && _a !== void 0 ? _a : 'line';
        (_b = result[seriesType]) !== null && _b !== void 0 ? _b : (result[seriesType] = 0);
        result[seriesType] += next.type === 'stack' ? 1 : next.opts.length;
        return result;
    }, {});
    const groupIdx = {};
    const addSeriesGroupingMeta = (group) => {
        var _a, _b;
        let stackIdx = 0;
        const seriesType = (_a = group.opts[0].type) !== null && _a !== void 0 ? _a : 'line';
        (_b = groupIdx[seriesType]) !== null && _b !== void 0 ? _b : (groupIdx[seriesType] = 0);
        if (group.type === 'stack') {
            for (const opts of group.opts) {
                opts.seriesGrouping = {
                    groupIndex: groupIdx[seriesType],
                    groupCount: groupCount[seriesType],
                    stackIndex: stackIdx++,
                    stackCount: group.opts.length,
                };
            }
            groupIdx[seriesType]++;
        }
        else if (group.type === 'group') {
            for (const opts of group.opts) {
                opts.seriesGrouping = {
                    groupIndex: groupIdx[seriesType],
                    groupCount: groupCount[seriesType],
                    stackIndex: 0,
                    stackCount: 0,
                };
                groupIdx[seriesType]++;
            }
        }
        else {
            for (const opts of group.opts) {
                opts.seriesGrouping = undefined;
            }
        }
        return group.opts;
    };
    Debug.create(true, 'opts')('processSeriesOptions() - series grouping: ', grouped);
    for (const group of grouped) {
        const seriesType = (_a = group.opts[0].type) !== null && _a !== void 0 ? _a : 'line';
        if (isGroupableSeries(seriesType) || isStackableSeries(seriesType)) {
            result.push(...addSeriesGroupingMeta(group));
        }
        else {
            result.push(...group.opts);
        }
    }
    return result;
}
//# sourceMappingURL=prepareSeries.js.map