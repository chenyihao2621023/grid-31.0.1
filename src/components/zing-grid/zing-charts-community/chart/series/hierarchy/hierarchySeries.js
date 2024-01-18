var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { resetMotion } from '../../../motion/resetMotion';
import { StateMachine } from '../../../motion/states';
import { ColorScale } from '../../../scale/colorScale';
import { Series, SeriesNodePickMode } from '../series';
export class HierarchyNode {
    constructor(series, index, datum, size, colorValue, fill, stroke, sumSize, depth, parent, children) {
        this.series = series;
        this.index = index;
        this.datum = datum;
        this.size = size;
        this.colorValue = colorValue;
        this.fill = fill;
        this.stroke = stroke;
        this.sumSize = sumSize;
        this.depth = depth;
        this.parent = parent;
        this.children = children;
        this.midPoint = { x: 0, y: 0 };
    }
    contains(other) {
        let current = other;
        // Index check is a performance optimization - it does not affect correctness
        while (current != null && current.index >= this.index) {
            if (current === this) {
                return true;
            }
            current = current.parent;
        }
        return false;
    }
    walk(callback, order = HierarchyNode.Walk.PreOrder) {
        if (order === HierarchyNode.Walk.PreOrder) {
            callback(this);
        }
        this.children.forEach((child) => {
            child.walk(callback, order);
        });
        if (order === HierarchyNode.Walk.PostOrder) {
            callback(this);
        }
    }
    *[Symbol.iterator]() {
        yield this;
        for (const child of this.children) {
            yield* child;
        }
    }
}
HierarchyNode.Walk = {
    PreOrder: 0,
    PostOrder: 1,
};
export class HierarchySeries extends Series {
    constructor(moduleCtx) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH],
            contentGroupVirtual: false,
        });
        this.rootNode = new HierarchyNode(this, 0, undefined, 0, undefined, undefined, undefined, 0, undefined, undefined, []);
        this.colorDomain = [0, 0];
        this.maxDepth = 0;
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
    hasData() {
        return Array.isArray(this.data) && this.data.length > 0;
    }
    processData() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const { childrenKey, sizeKey, colorKey, fills, strokes, colorRange } = this.properties;
            let index = 0;
            const getIndex = () => {
                index += 1;
                return index;
            };
            let maxDepth = 0;
            let minColor = Infinity;
            let maxColor = -Infinity;
            const colors = new Array(((_b = (_a = this.data) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) + 1).fill(undefined);
            const createNode = (datum, parent) => {
                const index = getIndex();
                const depth = parent.depth != null ? parent.depth + 1 : 0;
                const children = childrenKey != null ? datum[childrenKey] : undefined;
                const isLeaf = children == null || children.length === 0;
                let size = sizeKey != null ? datum[sizeKey] : undefined;
                if (Number.isFinite(size)) {
                    size = Math.max(size, 0);
                }
                else {
                    size = isLeaf ? 1 : 0;
                }
                const sumSize = size;
                maxDepth = Math.max(maxDepth, depth);
                const color = colorKey != null ? datum[colorKey] : undefined;
                if (typeof color === 'number') {
                    colors[index] = color;
                    minColor = Math.min(minColor, color);
                    maxColor = Math.max(maxColor, color);
                }
                return appendChildren(new HierarchyNode(this, index, datum, size, color, undefined, undefined, sumSize, depth, parent, []), children);
            };
            const appendChildren = (node, data) => {
                data === null || data === void 0 ? void 0 : data.forEach((datum) => {
                    const child = createNode(datum, node);
                    node.children.push(child);
                    node.sumSize += child.sumSize;
                });
                return node;
            };
            const rootNode = appendChildren(new HierarchyNode(this, 0, undefined, 0, undefined, undefined, undefined, 0, undefined, undefined, []), this.data);
            const colorDomain = [minColor, maxColor];
            let colorScale;
            if (colorRange != null && Number.isFinite(minColor) && Number.isFinite(maxColor)) {
                colorScale = new ColorScale();
                colorScale.domain = colorDomain;
                colorScale.range = colorRange;
                colorScale.update();
            }
            rootNode.children.forEach((child, index) => {
                child.walk((node) => {
                    let fill;
                    const color = colors[node.index];
                    if (color != null) {
                        fill = colorScale === null || colorScale === void 0 ? void 0 : colorScale.convert(color);
                    }
                    fill !== null && fill !== void 0 ? fill : (fill = fills === null || fills === void 0 ? void 0 : fills[index % fills.length]);
                    node.fill = fill;
                    // FIXME: If there's a color scale, the strokes won't make sense. For now, just hard-code this default
                    node.stroke = colorScale == null ? strokes === null || strokes === void 0 ? void 0 : strokes[index % strokes.length] : 'rgba(0, 0, 0, 0.2)';
                });
            });
            this.rootNode = rootNode;
            this.maxDepth = maxDepth;
            this.colorDomain = colorDomain;
        });
    }
    update({ seriesRect }) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.updateSelections();
            yield this.updateNodes();
            const animationData = this.getAnimationData();
            const resize = this.checkResize(seriesRect);
            if (resize) {
                this.animationState.transition('resize', animationData);
            }
            this.animationState.transition('update', animationData);
        });
    }
    resetAllAnimation(data) {
        var _a;
        const datum = (_a = this.animationResetFns) === null || _a === void 0 ? void 0 : _a.datum;
        // Stop any running animations by prefix convention.
        this.ctx.animationManager.stopByAnimationGroupId(this.id);
        if (datum != null) {
            resetMotion(data.datumSelections, datum);
        }
    }
    animateEmptyUpdateReady(data) {
        this.ctx.animationManager.skipCurrentBatch();
        this.resetAllAnimation(data);
    }
    animateWaitingUpdateReady(data) {
        this.ctx.animationManager.skipCurrentBatch();
        this.resetAllAnimation(data);
    }
    animateReadyHighlight(data) {
        var _a;
        const datum = (_a = this.animationResetFns) === null || _a === void 0 ? void 0 : _a.datum;
        if (datum != null) {
            resetMotion([data], datum);
        }
    }
    animateReadyResize(data) {
        this.resetAllAnimation(data);
    }
    animateClearingUpdateEmpty(data) {
        this.ctx.animationManager.skipCurrentBatch();
        this.resetAllAnimation(data);
    }
    animationTransitionClear() {
        this.animationState.transition('clear', this.getAnimationData());
    }
    getAnimationData() {
        const animationData = {
            datumSelections: [this.groupSelection],
        };
        return animationData;
    }
    isProcessedDataAnimatable() {
        return true;
    }
    checkProcessedDataAnimatable() {
        if (!this.isProcessedDataAnimatable()) {
            this.ctx.animationManager.skipCurrentBatch();
        }
    }
    getLabelData() {
        return [];
    }
    getSeriesDomain() {
        return [NaN, NaN];
    }
    getLegendData(legendType) {
        const { colorKey, colorName, colorRange, visible } = this.properties;
        return legendType === 'gradient' && colorKey != null && colorRange != null
            ? [
                {
                    legendType: 'gradient',
                    enabled: visible,
                    seriesId: this.id,
                    colorName,
                    colorRange,
                    colorDomain: this.colorDomain,
                },
            ]
            : [];
    }
    getDatumIdFromData(node) {
        return `${node.index}`;
    }
    getDatumId(node) {
        return this.getDatumIdFromData(node);
    }
}
//# sourceMappingURL=hierarchySeries.js.map