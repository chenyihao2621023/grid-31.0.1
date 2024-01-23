var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ascendingStringNumberUndefined, compoundAscending } from '../util/compare';
import { BBox } from './bbox';
import { Node, RedrawType, SceneChangeDetection } from './node';
export class Group extends Node {
    zIndexChanged() {
        var _a;
        if (this.layer) {
            (_a = this._layerManager) === null || _a === void 0 ? void 0 : _a.moveLayer(this.layer, this.zIndex, this.zIndexSubOrder);
        }
    }
    isLayer() {
        return this.layer != null;
    }
    constructor(opts) {
        var _a;
        super({ isVirtual: opts === null || opts === void 0 ? void 0 : opts.isVirtual });
        this.opts = opts;
        this.opacity = 1;
        this.lastBBox = undefined;
        const { zIndex, zIndexSubOrder } = opts !== null && opts !== void 0 ? opts : {};
        this.isContainerNode = true;
        if (zIndex !== undefined) {
            this.zIndex = zIndex;
        }
        if (zIndexSubOrder !== undefined) {
            this.zIndexSubOrder = zIndexSubOrder;
        }
        this.name = (_a = this.opts) === null || _a === void 0 ? void 0 : _a.name;
    }
    _setLayerManager(scene) {
        var _a, _b;
        if (this._layerManager && this.layer) {
            this._layerManager.removeLayer(this.layer);
            this.layer = undefined;
        }
        if (this.layer) {
            throw new Error('ZING Charts - unable to deregister scene rendering layer!');
        }
        super._setLayerManager(scene);
        if (scene && ((_a = this.opts) === null || _a === void 0 ? void 0 : _a.layer)) {
            const { zIndex, zIndexSubOrder, name } = (_b = this.opts) !== null && _b !== void 0 ? _b : {};
            const getComputedOpacity = () => this.getComputedOpacity();
            const getVisibility = () => this.getVisibility();
            this.layer = scene.addLayer({
                zIndex,
                zIndexSubOrder,
                name,
                getComputedOpacity,
                getVisibility,
            });
        }
    }
    getComputedOpacity() {
        let opacity = 1;
        let node = this;
        do {
            if (node instanceof Group) {
                opacity *= node.opacity;
            }
        } while ((node = node.parent));
        return opacity;
    }
    getVisibility() {
        let node = this;
        let visible = this.visible;
        while ((node = node.parent)) {
            if (node.visible) {
                continue;
            }
            visible = node.visible;
        }
        return visible;
    }
    visibilityChanged() {
        if (this.layer) {
            this.layer.enabled = this.visible;
        }
    }
    markDirty(source, type = RedrawType.TRIVIAL) {
        if (this.isVirtual) {
            // Always percolate directly for virtual nodes - they don't exist for rendering purposes.
            super.markDirty(source, type);
            return;
        }
        // Downgrade dirty-ness percolated to parent in special cases.
        let parentType = type;
        if (type < RedrawType.MINOR || this.layer != null) {
            parentType = RedrawType.TRIVIAL;
        }
        super.markDirty(source, type, parentType);
    }
    // We consider a group to be boundless, thus any point belongs to it.
    containsPoint(_x, _y) {
        return true;
    }
    computeBBox() {
        this.computeTransformMatrix();
        return Group.computeBBox(this.children);
    }
    computeTransformedBBox() {
        return this.computeBBox();
    }
    render(renderCtx) {
        var _a, _b;
        const { opts: { name = undefined } = {}, _debug: debug = () => { } } = this;
        const { dirty, dirtyZIndex, layer, children, clipRect, dirtyTransform } = this;
        let { ctx, forceRender, clipBBox } = renderCtx;
        const { resized, stats } = renderCtx;
        const canvasCtxTransform = ctx.getTransform();
        const isDirty = dirty >= RedrawType.MINOR || dirtyZIndex || resized;
        let isChildDirty = isDirty;
        let isChildLayerDirty = false;
        for (const child of children) {
            isChildDirty || (isChildDirty = child.layerManager == null && child.dirty >= RedrawType.TRIVIAL);
            isChildLayerDirty || (isChildLayerDirty = child.layerManager != null && child.dirty >= RedrawType.TRIVIAL);
            if (isChildDirty) {
                break;
            }
        }
        if (name) {
            debug({ name, group: this, isDirty, isChildDirty, dirtyTransform, renderCtx, forceRender });
        }
        if (dirtyTransform) {
            forceRender = 'dirtyTransform';
        }
        else if (layer) {
            // If bounding-box of a layer changes, force re-render.
            const currentBBox = this.computeBBox();
            if (this.lastBBox === undefined || !this.lastBBox.equals(currentBBox)) {
                forceRender = 'dirtyTransform';
                this.lastBBox = currentBBox;
            }
        }
        if (!isDirty && !isChildDirty && !isChildLayerDirty && !forceRender) {
            if (name && stats) {
                debug({ name, result: 'skipping', renderCtx, counts: this.nodeCount, group: this });
            }
            if (layer && stats) {
                stats.layersSkipped++;
                stats.nodesSkipped += this.nodeCount.count;
            }
            this.markClean({ recursive: false });
            // Nothing to do.
            return;
        }
        const groupVisible = this.visible;
        if (layer) {
            // Switch context to the canvas layer we use for this group.
            ctx = layer.context;
            ctx.save();
            ctx.resetTransform();
            if (forceRender !== 'dirtyTransform') {
                forceRender = isChildDirty || dirtyZIndex;
            }
            if (forceRender)
                layer.clear();
            if (clipBBox) {
                // clipBBox is in the canvas coordinate space, when we hit a layer we apply the new clipping at which point there are no transforms in play
                const { width, height, x, y } = clipBBox;
                debug(() => ({
                    name,
                    clipBBox,
                    ctxTransform: ctx.getTransform(),
                    renderCtx,
                    group: this,
                }));
                this.clipCtx(ctx, x, y, width, height);
            }
            ctx.setTransform(canvasCtxTransform);
        }
        else {
            // Only apply opacity if this isn't a distinct layer - opacity will be applied
            // at composition time.
            ctx.globalAlpha *= this.opacity;
        }
        // A group can have `scaling`, `rotation`, `translation` properties
        // that are applied to the canvas context before children are rendered,
        // so all children can be transformed at once.
        this.computeTransformMatrix();
        this.matrix.toContext(ctx);
        if (clipRect) {
            // clipRect is in the group's coordinate space
            const { x, y, width, height } = clipRect;
            ctx.save();
            debug(() => ({ name, clipRect, ctxTransform: ctx.getTransform(), renderCtx, group: this }));
            this.clipCtx(ctx, x, y, width, height);
            // clipBBox is in the canvas coordinate space, when we hit a layer we apply the new clipping at which point there are no transforms in play
            clipBBox = this.matrix.transformBBox(clipRect);
        }
        const hasVirtualChildren = this.hasVirtualChildren();
        if (dirtyZIndex) {
            this.sortChildren(children);
            if (forceRender !== 'dirtyTransform')
                forceRender = true;
        }
        else if (hasVirtualChildren) {
            this.sortChildren(children);
        }
        // Reduce churn if renderCtx is identical.
        const renderContextChanged = forceRender !== renderCtx.forceRender || clipBBox !== renderCtx.clipBBox || ctx !== renderCtx.ctx;
        const childRenderContext = renderContextChanged ? Object.assign(Object.assign({}, renderCtx), { ctx, forceRender, clipBBox }) : renderCtx;
        // Render visible children.
        let skipped = 0;
        for (const child of children) {
            if (!child.visible || !groupVisible) {
                // Skip invisible children, but make sure their dirty flag is reset.
                child.markClean();
                if (stats)
                    skipped += child.nodeCount.count;
                continue;
            }
            if (!forceRender && child.dirty === RedrawType.NONE) {
                // Skip children that don't need to be redrawn.
                if (stats)
                    skipped += child.nodeCount.count;
                continue;
            }
            // Render marks this node (and children) as clean - no need to explicitly markClean().
            ctx.save();
            child.render(childRenderContext);
            ctx.restore();
        }
        if (stats)
            stats.nodesSkipped += skipped;
        // Render marks this node as clean - no need to explicitly markClean().
        super.render(renderCtx);
        if (clipRect) {
            ctx.restore();
        }
        if (hasVirtualChildren) {
            // Mark virtual nodes as clean and their virtual children - all other nodes have already
            // been visited and marked clean.
            for (const child of this.virtualChildren) {
                child.markClean({ recursive: 'virtual' });
            }
        }
        if (layer) {
            if (stats)
                stats.layersRendered++;
            ctx.restore();
            if (forceRender)
                layer.snapshot();
            // Check for save/restore depth of zero!
            (_b = (_a = layer.context).verifyDepthZero) === null || _b === void 0 ? void 0 : _b.call(_a);
        }
        if (name && stats) {
            debug({ name, result: 'rendered', skipped, renderCtx, counts: this.nodeCount, group: this });
        }
    }
    sortChildren(children) {
        this.dirtyZIndex = false;
        children.sort((a, b) => {
            var _a, _b;
            return compoundAscending([a.zIndex, ...((_a = a.zIndexSubOrder) !== null && _a !== void 0 ? _a : [undefined, undefined]), a.serialNumber], [b.zIndex, ...((_b = b.zIndexSubOrder) !== null && _b !== void 0 ? _b : [undefined, undefined]), b.serialNumber], ascendingStringNumberUndefined);
        });
    }
    clipCtx(ctx, x, y, width, height) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + width, y);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x, y + height);
        ctx.closePath();
        ctx.clip();
    }
    static computeBBox(nodes) {
        let left = Infinity;
        let right = -Infinity;
        let top = Infinity;
        let bottom = -Infinity;
        nodes.forEach((n) => {
            if (!n.visible) {
                return;
            }
            const bbox = n.computeTransformedBBox();
            if (!bbox) {
                return;
            }
            const x = bbox.x;
            const y = bbox.y;
            if (x < left) {
                left = x;
            }
            if (y < top) {
                top = y;
            }
            if (x + bbox.width > right) {
                right = x + bbox.width;
            }
            if (y + bbox.height > bottom) {
                bottom = y + bbox.height;
            }
        });
        return new BBox(left, top, right - left, bottom - top);
    }
    
    setClipRectInGroupCoordinateSpace(bbox) {
        this.clipRect = bbox ? this.transformBBox(bbox) : undefined;
    }
}
Group.className = 'Group';
__decorate([
    SceneChangeDetection({
        redraw: RedrawType.MAJOR,
        convertor: (v) => Math.min(1, Math.max(0, v)),
    })
], Group.prototype, "opacity", void 0);
