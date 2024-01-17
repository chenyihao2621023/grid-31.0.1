import { Group } from '../../scene/group';
import { Layers } from '../layers';
const SERIES_THRESHOLD_FOR_AGGRESSIVE_LAYER_REDUCTION = 30;
export class SeriesLayerManager {
    constructor(rootGroup) {
        this.groups = {};
        this.series = {};
        this.expectedSeriesCount = 1;
        this.mode = 'normal';
        this.rootGroup = rootGroup;
    }
    setSeriesCount(count) {
        this.expectedSeriesCount = count;
    }
    requestGroup(seriesConfig) {
        var _a, _b;
        var _c, _d;
        const { internalId, type, rootGroup: seriesRootGroup, highlightGroup: seriesHighlightGroup, annotationGroup: seriesAnnotationGroup, seriesGrouping, } = seriesConfig;
        const { groupIndex = internalId } = seriesGrouping !== null && seriesGrouping !== void 0 ? seriesGrouping : {};
        if (this.series[internalId] != null) {
            throw new Error(`AG Charts - series already has an allocated layer: ${this.series[internalId]}`);
        }
        // Re-evaluate mode only on first series addition - we can't swap strategy mid-setup.
        if (Object.keys(this.series).length === 0) {
            this.mode =
                this.expectedSeriesCount >= SERIES_THRESHOLD_FOR_AGGRESSIVE_LAYER_REDUCTION
                    ? 'aggressive-grouping'
                    : 'normal';
        }
        (_a = (_c = this.groups)[type]) !== null && _a !== void 0 ? _a : (_c[type] = {});
        const lookupIndex = this.lookupIdx(groupIndex);
        let groupInfo = this.groups[type][lookupIndex];
        if (!groupInfo) {
            groupInfo = (_b = (_d = this.groups[type])[lookupIndex]) !== null && _b !== void 0 ? _b : (_d[lookupIndex] = {
                seriesIds: [],
                group: this.rootGroup.appendChild(new Group({
                    name: `${type}-content`,
                    layer: true,
                    zIndex: Layers.SERIES_LAYER_ZINDEX,
                    zIndexSubOrder: seriesConfig.getGroupZIndexSubOrder('data'),
                })),
                highlight: this.rootGroup.appendChild(new Group({
                    name: `${type}-highlight`,
                    layer: true,
                    zIndex: Layers.SERIES_LAYER_ZINDEX,
                    zIndexSubOrder: seriesConfig.getGroupZIndexSubOrder('highlight'),
                })),
                annotation: this.rootGroup.appendChild(new Group({
                    name: `${type}-annotation`,
                    layer: true,
                    zIndex: Layers.SERIES_LAYER_ZINDEX,
                    zIndexSubOrder: seriesConfig.getGroupZIndexSubOrder('annotation'),
                })),
            });
        }
        this.series[internalId] = { layerState: groupInfo, seriesConfig };
        groupInfo.seriesIds.push(internalId);
        groupInfo.group.appendChild(seriesRootGroup);
        groupInfo.highlight.appendChild(seriesHighlightGroup);
        groupInfo.annotation.appendChild(seriesAnnotationGroup);
        return groupInfo.group;
    }
    changeGroup(seriesConfig) {
        var _a, _b;
        const { internalId, seriesGrouping, type, rootGroup, highlightGroup, annotationGroup, oldGrouping } = seriesConfig;
        const { groupIndex = internalId } = seriesGrouping !== null && seriesGrouping !== void 0 ? seriesGrouping : {};
        if ((_b = (_a = this.groups[type]) === null || _a === void 0 ? void 0 : _a[groupIndex]) === null || _b === void 0 ? void 0 : _b.seriesIds.includes(internalId)) {
            // Already in the right group, nothing to do.
            return;
        }
        if (this.series[internalId] != null) {
            this.releaseGroup({
                internalId,
                seriesGrouping: oldGrouping,
                type,
                rootGroup,
                highlightGroup,
                annotationGroup,
            });
        }
        this.requestGroup(seriesConfig);
    }
    releaseGroup(seriesConfig) {
        var _a, _b, _c, _d, _e;
        const { internalId, seriesGrouping, rootGroup, highlightGroup, annotationGroup, type } = seriesConfig;
        const { groupIndex = internalId } = seriesGrouping !== null && seriesGrouping !== void 0 ? seriesGrouping : {};
        if (this.series[internalId] == null) {
            throw new Error(`AG Charts - series doesn't have an allocated layer: ${internalId}`);
        }
        const lookupIndex = this.lookupIdx(groupIndex);
        const groupInfo = (_b = (_a = this.groups[type]) === null || _a === void 0 ? void 0 : _a[lookupIndex]) !== null && _b !== void 0 ? _b : (_c = this.series[internalId]) === null || _c === void 0 ? void 0 : _c.layerState;
        if (groupInfo) {
            groupInfo.seriesIds = groupInfo.seriesIds.filter((v) => v !== internalId);
            groupInfo.group.removeChild(rootGroup);
            groupInfo.highlight.removeChild(highlightGroup);
            groupInfo.annotation.removeChild(annotationGroup);
        }
        if ((groupInfo === null || groupInfo === void 0 ? void 0 : groupInfo.seriesIds.length) === 0) {
            // Last member of the layer, cleanup.
            this.rootGroup.removeChild(groupInfo.group);
            this.rootGroup.removeChild(groupInfo.highlight);
            this.rootGroup.removeChild(groupInfo.annotation);
            delete this.groups[type][lookupIndex];
            delete this.groups[type][internalId];
        }
        else if ((groupInfo === null || groupInfo === void 0 ? void 0 : groupInfo.seriesIds.length) > 0) {
            // Update zIndexSubOrder to avoid it becoming stale as series are removed and re-added
            // with the same groupIndex, but are otherwise unrelated.
            const leadSeriesConfig = (_e = this.series[(_d = groupInfo === null || groupInfo === void 0 ? void 0 : groupInfo.seriesIds) === null || _d === void 0 ? void 0 : _d[0]]) === null || _e === void 0 ? void 0 : _e.seriesConfig;
            groupInfo.group.zIndexSubOrder = leadSeriesConfig === null || leadSeriesConfig === void 0 ? void 0 : leadSeriesConfig.getGroupZIndexSubOrder('data');
            groupInfo.highlight.zIndexSubOrder = leadSeriesConfig === null || leadSeriesConfig === void 0 ? void 0 : leadSeriesConfig.getGroupZIndexSubOrder('highlight');
            groupInfo.annotation.zIndexSubOrder = leadSeriesConfig === null || leadSeriesConfig === void 0 ? void 0 : leadSeriesConfig.getGroupZIndexSubOrder('annotation');
        }
        delete this.series[internalId];
    }
    lookupIdx(groupIndex) {
        if (this.mode === 'normal') {
            return groupIndex;
        }
        if (typeof groupIndex === 'string') {
            groupIndex = Number(groupIndex.split('-').slice(-1)[0]);
            if (!groupIndex)
                return 0;
        }
        return Math.floor(Math.max(Math.min(groupIndex / this.expectedSeriesCount, 1), 0) *
            SERIES_THRESHOLD_FOR_AGGRESSIVE_LAYER_REDUCTION);
    }
    destroy() {
        for (const groups of Object.values(this.groups)) {
            for (const groupInfo of Object.values(groups)) {
                this.rootGroup.removeChild(groupInfo.group);
                this.rootGroup.removeChild(groupInfo.highlight);
                this.rootGroup.removeChild(groupInfo.annotation);
            }
        }
        this.groups = {};
        this.series = {};
    }
}
//# sourceMappingURL=seriesLayerManager.js.map