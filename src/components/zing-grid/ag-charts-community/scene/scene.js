var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { toArray } from '../util/array';
import { ascendingStringNumberUndefined, compoundAscending } from '../util/compare';
import { Debug } from '../util/debug';
import { createId } from '../util/id';
import { Logger } from '../util/logger';
import { windowValue } from '../util/window';
import { HdpiCanvas } from './canvas/hdpiCanvas';
import { HdpiOffscreenCanvas } from './canvas/hdpiOffscreenCanvas';
import { Group } from './group';
import { RedrawType } from './node';
var DebugSelectors;
(function (DebugSelectors) {
    DebugSelectors["SCENE"] = "scene";
    DebugSelectors["SCENE_STATS"] = "scene:stats";
    DebugSelectors["SCENE_STATS_VERBOSE"] = "scene:stats:verbose";
    DebugSelectors["SCENE_DIRTY_TREE"] = "scene:dirtyTree";
})(DebugSelectors || (DebugSelectors = {}));
const advancedCompositeIdentifier = 'adv-composite';
const domCompositeIdentifier = 'dom-composite';
export class Scene {
    constructor(opts) {
        var _a;
        this.id = createId(this);
        this.layers = [];
        this._nextZIndex = 0;
        this._nextLayerId = 0;
        this._dirty = false;
        this._root = null;
        this.debug = Debug.create(true, DebugSelectors.SCENE);
        const { document, window, mode = (_a = windowValue('agChartsSceneRenderModel')) !== null && _a !== void 0 ? _a : advancedCompositeIdentifier, width, height, overrideDevicePixelRatio = undefined, } = opts;
        this.overrideDevicePixelRatio = overrideDevicePixelRatio;
        this.opts = { document, window, mode };
        this.canvas = new HdpiCanvas({ document, window, width, height, overrideDevicePixelRatio });
    }
    set container(value) {
        this.canvas.container = value;
    }
    get container() {
        return this.canvas.container;
    }
    download(fileName, fileFormat) {
        this.canvas.download(fileName, fileFormat);
    }
    getDataURL(type) {
        return this.canvas.getDataURL(type);
    }
    get width() {
        return this.pendingSize ? this.pendingSize[0] : this.canvas.width;
    }
    get height() {
        return this.pendingSize ? this.pendingSize[1] : this.canvas.height;
    }
    resize(width, height) {
        width = Math.round(width);
        height = Math.round(height);
        // HdpiCanvas doesn't allow width/height <= 0.
        const lessThanZero = width <= 0 || height <= 0;
        const nan = isNaN(width) || isNaN(height);
        const unchanged = width === this.width && height === this.height;
        if (unchanged || nan || lessThanZero) {
            return false;
        }
        this.pendingSize = [width, height];
        this.markDirty();
        return true;
    }
    addLayer(opts) {
        var _a;
        const { mode } = this.opts;
        const layeredModes = ['composite', domCompositeIdentifier, advancedCompositeIdentifier];
        if (!layeredModes.includes(mode)) {
            return undefined;
        }
        const { zIndex = this._nextZIndex++, name, zIndexSubOrder, getComputedOpacity, getVisibility } = opts;
        const { width, height, overrideDevicePixelRatio } = this;
        const domLayer = mode === domCompositeIdentifier;
        const advLayer = mode === advancedCompositeIdentifier;
        const canvas = !advLayer || !HdpiOffscreenCanvas.isSupported()
            ? new HdpiCanvas({
                document: this.opts.document,
                window: this.opts.window,
                width,
                height,
                domLayer,
                zIndex,
                name,
                overrideDevicePixelRatio,
            })
            : new HdpiOffscreenCanvas({
                width,
                height,
                overrideDevicePixelRatio,
            });
        const newLayer = {
            id: this._nextLayerId++,
            name,
            zIndex,
            zIndexSubOrder,
            canvas,
            getComputedOpacity,
            getVisibility,
        };
        if (zIndex >= this._nextZIndex) {
            this._nextZIndex = zIndex + 1;
        }
        this.layers.push(newLayer);
        this.sortLayers();
        if (domLayer) {
            const domCanvases = this.layers
                .map((v) => v.canvas)
                .filter((v) => v instanceof HdpiCanvas);
            const newLayerIndex = domCanvases.findIndex((v) => v === canvas);
            const lastLayer = (_a = domCanvases[newLayerIndex - 1]) !== null && _a !== void 0 ? _a : this.canvas;
            lastLayer.element.insertAdjacentElement('afterend', canvas.element);
        }
        this.debug('Scene.addLayer() - layers', this.layers);
        return newLayer.canvas;
    }
    removeLayer(canvas) {
        const index = this.layers.findIndex((l) => l.canvas === canvas);
        if (index >= 0) {
            this.layers.splice(index, 1);
            canvas.destroy();
            this.markDirty();
            this.debug('Scene.removeLayer() -  layers', this.layers);
        }
    }
    moveLayer(canvas, newZIndex, newZIndexSubOrder) {
        const layer = this.layers.find((l) => l.canvas === canvas);
        if (layer) {
            layer.zIndex = newZIndex;
            layer.zIndexSubOrder = newZIndexSubOrder;
            this.sortLayers();
            this.markDirty();
            this.debug('Scene.moveLayer() -  layers', this.layers);
        }
    }
    sortLayers() {
        this.layers.sort((a, b) => {
            var _a, _b;
            return compoundAscending([a.zIndex, ...((_a = a.zIndexSubOrder) !== null && _a !== void 0 ? _a : [undefined, undefined]), a.id], [b.zIndex, ...((_b = b.zIndexSubOrder) !== null && _b !== void 0 ? _b : [undefined, undefined]), b.id], ascendingStringNumberUndefined);
        });
    }
    markDirty() {
        this._dirty = true;
    }
    get dirty() {
        return this._dirty;
    }
    set root(node) {
        var _a;
        if (node === this._root) {
            return;
        }
        (_a = this._root) === null || _a === void 0 ? void 0 : _a._setLayerManager();
        this._root = node;
        if (node) {
            node._setLayerManager({
                addLayer: (opts) => this.addLayer(opts),
                moveLayer: (...opts) => this.moveLayer(...opts),
                removeLayer: (...opts) => this.removeLayer(...opts),
                markDirty: () => this.markDirty(),
                canvas: this.canvas,
                debug: Debug.create(DebugSelectors.SCENE),
            });
        }
        this.markDirty();
    }
    get root() {
        return this._root;
    }
    /** Alternative to destroy() that preserves re-usable resources. */
    strip() {
        const { layers } = this;
        for (const layer of layers) {
            layer.canvas.destroy();
            delete layer['canvas'];
        }
        layers.splice(0, layers.length);
        this.root = null;
        this._dirty = false;
        this.canvas.context.resetTransform();
    }
    destroy() {
        this.container = undefined;
        this.strip();
        this.canvas.destroy();
        Object.assign(this, { canvas: undefined, ctx: undefined });
    }
    render(opts) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const { debugSplitTimes = { start: performance.now() }, extraDebugStats = {} } = opts !== null && opts !== void 0 ? opts : {};
            const { canvas, canvas: { context: ctx }, root, layers, pendingSize, opts: { mode }, } = this;
            if (pendingSize) {
                this.canvas.resize(...pendingSize);
                this.layers.forEach((layer) => layer.canvas.resize(...pendingSize));
                this.pendingSize = undefined;
            }
            if (root && !root.visible) {
                this._dirty = false;
                return;
            }
            if (root && !this.dirty) {
                this.debug('Scene.render() - no-op', {
                    redrawType: RedrawType[root.dirty],
                    tree: this.buildTree(root),
                });
                this.debugStats(debugSplitTimes, ctx, undefined, extraDebugStats);
                return;
            }
            const renderCtx = {
                ctx,
                devicePixelRatio: (_a = this.canvas.pixelRatio) !== null && _a !== void 0 ? _a : 1,
                forceRender: true,
                resized: !!pendingSize,
                debugNodes: {},
            };
            if (Debug.check(DebugSelectors.SCENE_STATS_VERBOSE)) {
                renderCtx.stats = { layersRendered: 0, layersSkipped: 0, nodesRendered: 0, nodesSkipped: 0 };
            }
            let canvasCleared = false;
            if (!root || root.dirty >= RedrawType.TRIVIAL) {
                // start with a blank canvas, clear previous drawing
                canvasCleared = true;
                canvas.clear();
            }
            if (root) {
                const { dirtyTree, paths } = this.buildDirtyTree(root);
                Debug.create(DebugSelectors.SCENE_DIRTY_TREE)('Scene.render() - dirtyTree', {
                    dirtyTree,
                    paths,
                });
            }
            if (root && canvasCleared) {
                this.debug('Scene.render() - before', {
                    redrawType: RedrawType[root.dirty],
                    canvasCleared,
                    tree: this.buildTree(root),
                });
                if (root.visible) {
                    ctx.save();
                    root.render(renderCtx);
                    ctx.restore();
                }
            }
            debugSplitTimes['✍️'] = performance.now();
            if (mode !== domCompositeIdentifier && layers.length > 0 && canvasCleared) {
                this.sortLayers();
                ctx.save();
                ctx.setTransform(1 / canvas.pixelRatio, 0, 0, 1 / canvas.pixelRatio, 0, 0);
                layers.forEach(({ canvas: { imageSource, enabled }, getComputedOpacity, getVisibility }) => {
                    if (!enabled || !getVisibility()) {
                        return;
                    }
                    ctx.globalAlpha = getComputedOpacity();
                    ctx.drawImage(imageSource, 0, 0);
                });
                ctx.restore();
                debugSplitTimes['⛙'] = performance.now();
            }
            // Check for save/restore depth of zero!
            (_b = ctx.verifyDepthZero) === null || _b === void 0 ? void 0 : _b.call(ctx);
            this._dirty = false;
            this.debugStats(debugSplitTimes, ctx, renderCtx.stats, extraDebugStats);
            this.debugSceneNodeHighlight(ctx, renderCtx.debugNodes);
            if (root) {
                this.debug('Scene.render() - after', {
                    redrawType: RedrawType[root.dirty],
                    canvasCleared,
                    tree: this.buildTree(root),
                });
            }
        });
    }
    debugStats(debugSplitTimes, ctx, renderCtxStats, extraDebugStats = {}) {
        if (Debug.check(DebugSelectors.SCENE_STATS, DebugSelectors.SCENE_STATS_VERBOSE)) {
            const end = performance.now();
            const start = debugSplitTimes['start'];
            debugSplitTimes['end'] = performance.now();
            const pct = (rendered, skipped) => {
                const total = rendered + skipped;
                return `${rendered} / ${total} (${Math.round((100 * rendered) / total)}%)`;
            };
            const time = (name, start, end) => {
                return `${name}: ${Math.round((end - start) * 100) / 100}ms`;
            };
            const { layersRendered = 0, layersSkipped = 0, nodesRendered = 0, nodesSkipped = 0 } = renderCtxStats !== null && renderCtxStats !== void 0 ? renderCtxStats : {};
            let lastSplit = 0;
            const splits = Object.entries(debugSplitTimes)
                .filter(([n]) => n !== 'end')
                .map(([n, t], i) => {
                const result = i > 0 ? time(n, lastSplit, t) : null;
                lastSplit = t;
                return result;
            })
                .filter((v) => v != null)
                .join(' + ');
            const extras = Object.entries(extraDebugStats)
                .map(([k, v]) => `${k}: ${v}`)
                .join(' ; ');
            const detailedStats = Debug.check(DebugSelectors.SCENE_STATS_VERBOSE);
            const stats = [
                `${time('⏱️', start, end)} (${splits})`,
                `${extras}`,
                `Layers: ${detailedStats ? pct(layersRendered, layersSkipped) : this.layers.length}`,
                detailedStats ? `Nodes: ${pct(nodesRendered, nodesSkipped)}` : null,
            ].filter((v) => v != null);
            const statsSize = stats.map((t) => [t, HdpiCanvas.getTextSize(t, ctx.font)]);
            const width = Math.max(...statsSize.map(([, { width }]) => width));
            const height = statsSize.reduce((total, [, { height }]) => total + height, 0);
            ctx.save();
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = 'black';
            let y = 0;
            for (const [stat, size] of statsSize) {
                y += size.height;
                ctx.fillText(stat, 2, y);
            }
            ctx.restore();
        }
    }
    debugSceneNodeHighlight(ctx, debugNodes) {
        var _a;
        const regexpPredicate = (matcher) => (n) => {
            if (matcher.test(n.id)) {
                return true;
            }
            return n instanceof Group && n.name != null && matcher.test(n.name);
        };
        const stringPredicate = (match) => (n) => {
            if (match === n.id) {
                return true;
            }
            return n instanceof Group && n.name != null && match === n.name;
        };
        const sceneNodeHighlight = toArray(windowValue('agChartsSceneDebug')).flatMap((name) => name === 'layout' ? ['seriesRoot', 'legend', 'root', /.*Axis-\d+-axis.*/] : name);
        for (const next of sceneNodeHighlight) {
            if (typeof next === 'string' && debugNodes[next] != null)
                continue;
            const predicate = typeof next === 'string' ? stringPredicate(next) : regexpPredicate(next);
            const nodes = (_a = this.root) === null || _a === void 0 ? void 0 : _a.findNodes(predicate);
            if (!nodes || nodes.length === 0) {
                Logger.log(`Scene.render() - no debugging node with id [${next}] in scene graph.`);
                continue;
            }
            for (const node of nodes) {
                if (node instanceof Group && node.name) {
                    debugNodes[node.name] = node;
                }
                else {
                    debugNodes[node.id] = node;
                }
            }
        }
        ctx.save();
        for (const [name, node] of Object.entries(debugNodes)) {
            const bbox = node.computeTransformedBBox();
            if (!bbox) {
                Logger.log(`Scene.render() - no bbox for debugged node [${name}].`);
                continue;
            }
            ctx.globalAlpha = 0.8;
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 1;
            ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);
            ctx.fillStyle = 'red';
            ctx.strokeStyle = 'white';
            ctx.font = '16px sans-serif';
            ctx.textBaseline = 'top';
            ctx.textAlign = 'left';
            ctx.lineWidth = 2;
            ctx.strokeText(name, bbox.x, bbox.y, bbox.width);
            ctx.fillText(name, bbox.x, bbox.y, bbox.width);
        }
        ctx.restore();
    }
    buildTree(node) {
        var _a, _b;
        const name = (_a = (node instanceof Group ? node.name : null)) !== null && _a !== void 0 ? _a : node.id;
        return Object.assign(Object.assign({ name,
            node, dirty: RedrawType[node.dirty] }, (((_b = node.parent) === null || _b === void 0 ? void 0 : _b.isVirtual)
            ? {
                virtualParentDirty: RedrawType[node.parent.dirty],
                virtualParent: node.parent,
            }
            : {})), node.children
            .map((c) => this.buildTree(c))
            .reduce((result, childTree) => {
            let { name: treeNodeName } = childTree;
            const { node: { visible, opacity, zIndex, zIndexSubOrder }, node: childNode, virtualParent, } = childTree;
            if (!visible || opacity <= 0) {
                treeNodeName = `(${treeNodeName})`;
            }
            if (childNode instanceof Group && childNode.isLayer()) {
                treeNodeName = `*${treeNodeName}*`;
            }
            const key = [
                `${treeNodeName !== null && treeNodeName !== void 0 ? treeNodeName : '<unknown>'}`,
                `z: ${zIndex}`,
                zIndexSubOrder &&
                    `zo: ${zIndexSubOrder
                        .map((v) => (typeof v === 'function' ? `${v()} (fn)` : v))
                        .join(' / ')}`,
                virtualParent && `(virtual parent)`,
            ]
                .filter((v) => !!v)
                .join(' ');
            let selectedKey = key;
            let index = 1;
            while (result[selectedKey] != null && index < 100) {
                selectedKey = `${key} (${index++})`;
            }
            result[selectedKey] = childTree;
            return result;
        }, {}));
    }
    buildDirtyTree(node) {
        var _a;
        if (node.dirty === RedrawType.NONE) {
            return { dirtyTree: {}, paths: [] };
        }
        const childrenDirtyTree = node.children.map((c) => this.buildDirtyTree(c)).filter((c) => c.paths.length > 0);
        const name = (_a = (node instanceof Group ? node.name : null)) !== null && _a !== void 0 ? _a : node.id;
        const paths = childrenDirtyTree.length === 0
            ? [name]
            : childrenDirtyTree
                .map((c) => c.paths)
                .reduce((r, p) => r.concat(p), [])
                .map((p) => `${name}.${p}`);
        return {
            dirtyTree: Object.assign({ name,
                node, dirty: RedrawType[node.dirty] }, childrenDirtyTree
                .map((c) => c.dirtyTree)
                .filter((t) => t.dirty !== undefined)
                .reduce((result, childTree) => {
                var _a;
                result[(_a = childTree.name) !== null && _a !== void 0 ? _a : '<unknown>'] = childTree;
                return result;
            }, {})),
            paths,
        };
    }
}
Scene.className = 'Scene';
//# sourceMappingURL=scene.js.map