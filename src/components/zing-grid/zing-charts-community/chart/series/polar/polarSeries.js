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
import { resetMotion } from '../../../motion/resetMotion';
import { StateMachine } from '../../../motion/states';
import { Group } from '../../../scene/group';
import { Selection } from '../../../scene/selection';
import { Text } from '../../../scene/shape/text';
import { ChartAxisDirection } from '../../chartAxisDirection';
import { DataModelSeries } from '../dataModelSeries';
import { SeriesNodePickMode } from '../series';
export class PolarSeries extends DataModelSeries {
    constructor(_a) {
        var { useLabelLayer = false, pickModes = [SeriesNodePickMode.EXACT_SHAPE_MATCH], canHaveAxes = false, animationResetFns } = _a, opts = __rest(_a, ["useLabelLayer", "pickModes", "canHaveAxes", "animationResetFns"]);
        super(Object.assign(Object.assign({}, opts), { useLabelLayer,
            pickModes, contentGroupVirtual: false, directionKeys: {
                [ChartAxisDirection.X]: ['angleKey'],
                [ChartAxisDirection.Y]: ['radiusKey'],
            }, directionNames: {
                [ChartAxisDirection.X]: ['angleName'],
                [ChartAxisDirection.Y]: ['radiusName'],
            }, canHaveAxes }));
        this.sectorGroup = this.contentGroup.appendChild(new Group());
        this.itemSelection = Selection.select(this.sectorGroup, () => this.nodeFactory(), false);
        this.labelSelection = Selection.select(this.labelGroup, Text, false);
        this.highlightSelection = Selection.select(this.highlightGroup, () => this.nodeFactory());
        /**
         * The center of the polar series (for example, the center of a pie).
         * If the polar chart has multiple series, all of them will have their
         * center set to the same value as a result of the polar chart layout.
         * The center coordinates are not supposed to be set by the user.
         */
        this.centerX = 0;
        this.centerY = 0;
        /**
         * The maximum radius the series can use.
         * This value is set automatically as a result of the polar chart layout
         * and is not supposed to be set by the user.
         */
        this.radius = 0;
        this.sectorGroup.zIndexSubOrder = [() => this._declarationOrder, 1];
        this.animationResetFns = animationResetFns;
        this.animationState = new StateMachine('empty', {
            empty: {
                update: {
                    target: 'ready',
                    action: (data) => this.animateEmptyUpdateReady(data),
                },
            },
            ready: {
                updateData: 'waiting',
                clear: 'clearing',
                highlight: (data) => this.animateReadyHighlight(data),
                highlightMarkers: (data) => this.animateReadyHighlightMarkers(data),
                resize: (data) => this.animateReadyResize(data),
            },
            waiting: {
                update: {
                    target: 'ready',
                    action: (data) => this.animateWaitingUpdateReady(data),
                },
            },
            clearing: {
                update: {
                    target: 'empty',
                    action: (data) => this.animateClearingUpdateEmpty(data),
                },
            },
        }, () => this.checkProcessedDataAnimatable());
    }
    getLabelData() {
        return [];
    }
    computeLabelsBBox(_options, _seriesRect) {
        return null;
    }
    resetAllAnimation() {
        var _a;
        const { item, label } = (_a = this.animationResetFns) !== null && _a !== void 0 ? _a : {};
        this.ctx.animationManager.stopByAnimationGroupId(this.id);
        if (item) {
            resetMotion([this.itemSelection, this.highlightSelection], item);
        }
        if (label) {
            resetMotion([this.labelSelection], label);
        }
        this.itemSelection.cleanup();
        this.labelSelection.cleanup();
        this.highlightSelection.cleanup();
    }
    animateEmptyUpdateReady(_data) {
        this.ctx.animationManager.skipCurrentBatch();
        this.resetAllAnimation();
    }
    animateWaitingUpdateReady(_data) {
        this.ctx.animationManager.skipCurrentBatch();
        this.resetAllAnimation();
    }
    animateReadyHighlight(_data) {
        var _a;
        const { item } = (_a = this.animationResetFns) !== null && _a !== void 0 ? _a : {};
        if (item) {
            resetMotion([this.highlightSelection], item);
        }
    }
    animateReadyHighlightMarkers(_data) {
        // Override point for sub-classes.
    }
    animateReadyResize(_data) {
        this.resetAllAnimation();
    }
    animateClearingUpdateEmpty(_data) {
        this.ctx.animationManager.skipCurrentBatch();
        this.resetAllAnimation();
    }
    animationTransitionClear() {
        this.animationState.transition('clear', this.getAnimationData());
    }
    getAnimationData(seriesRect) {
        return { seriesRect };
    }
}
//# sourceMappingURL=polarSeries.js.map