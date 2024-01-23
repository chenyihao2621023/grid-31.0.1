import { Text } from '../../scene/shape/text';
import { Logger } from '../../util/logger';
import { Caption } from '../caption';
export class BaseLayoutProcessor {
    constructor(chartLike, layoutService) {
        this.chartLike = chartLike;
        this.layoutService = layoutService;
        this.destroyFns = [];
        this.destroyFns.push(
        // eslint-disable-next-line sonarjs/no-duplicate-string
        this.layoutService.addListener('layout-complete', (e) => this.layoutComplete(e)), this.layoutService.addListener('start-layout', (e) => this.positionPadding(e.shrinkRect)), this.layoutService.addListener('start-layout', (e) => this.positionCaptions(e.shrinkRect)));
    }
    destroy() {
        this.destroyFns.forEach((cb) => cb());
    }
    layoutComplete({ clipSeries, series: { paddedRect } }) {
        const { seriesArea, seriesRoot } = this.chartLike;
        if (seriesArea.clip || clipSeries) {
            seriesRoot.setClipRectInGroupCoordinateSpace(paddedRect);
        }
        else {
            seriesRoot.setClipRectInGroupCoordinateSpace();
        }
    }
    positionPadding(shrinkRect) {
        const { padding } = this.chartLike;
        shrinkRect.shrink(padding.left, 'left');
        shrinkRect.shrink(padding.top, 'top');
        shrinkRect.shrink(padding.right, 'right');
        shrinkRect.shrink(padding.bottom, 'bottom');
        return { shrinkRect };
    }
    positionCaptions(shrinkRect) {
        var _a, _b, _c, _d;
        const { title, subtitle, footnote } = this.chartLike;
        const newShrinkRect = shrinkRect.clone();
        const updateCaption = (caption) => {
            var _a;
            const defaultCaptionHeight = shrinkRect.height / 10;
            const captionLineHeight = (_a = caption.lineHeight) !== null && _a !== void 0 ? _a : caption.fontSize * Text.defaultLineHeightRatio;
            const maxWidth = shrinkRect.width;
            const maxHeight = Math.max(captionLineHeight, defaultCaptionHeight);
            caption.computeTextWrap(maxWidth, maxHeight);
        };
        const computeX = (align) => {
            if (align === 'left') {
                return newShrinkRect.x;
            }
            else if (align === 'right') {
                return newShrinkRect.x + newShrinkRect.width;
            }
            else if (align !== 'center') {
                Logger.error(`invalid textAlign value: ${align}`);
            }
            return newShrinkRect.x + newShrinkRect.width / 2;
        };
        const positionTopAndShrinkBBox = (caption, spacing) => {
            const baseY = newShrinkRect.y;
            caption.node.x = computeX(caption.textAlign);
            caption.node.y = baseY;
            caption.node.textBaseline = 'top';
            updateCaption(caption);
            const bbox = caption.node.computeBBox();
            // As the bbox (x,y) ends up at a different location than specified above, we need to
            // take it into consideration when calculating how much space needs to be reserved to
            // accommodate the caption.
            const bboxHeight = Math.ceil(bbox.y - baseY + bbox.height + spacing);
            newShrinkRect.shrink(bboxHeight, 'top');
        };
        const positionBottomAndShrinkBBox = (caption, spacing) => {
            const baseY = newShrinkRect.y + newShrinkRect.height;
            caption.node.x = computeX(caption.textAlign);
            caption.node.y = baseY;
            caption.node.textBaseline = 'bottom';
            updateCaption(caption);
            const bbox = caption.node.computeBBox();
            const bboxHeight = Math.ceil(baseY - bbox.y + spacing);
            newShrinkRect.shrink(bboxHeight, 'bottom');
        };
        if (subtitle) {
            subtitle.node.visible = (_a = subtitle.enabled) !== null && _a !== void 0 ? _a : false;
        }
        if (title) {
            title.node.visible = title.enabled;
            if (title.node.visible) {
                const defaultTitleSpacing = (subtitle === null || subtitle === void 0 ? void 0 : subtitle.node.visible) ? Caption.SMALL_PADDING : Caption.LARGE_PADDING;
                const spacing = (_b = title.spacing) !== null && _b !== void 0 ? _b : defaultTitleSpacing;
                positionTopAndShrinkBBox(title, spacing);
            }
        }
        if (subtitle && subtitle.node.visible) {
            positionTopAndShrinkBBox(subtitle, (_c = subtitle.spacing) !== null && _c !== void 0 ? _c : 0);
        }
        if (footnote) {
            footnote.node.visible = footnote.enabled;
            if (footnote.node.visible) {
                positionBottomAndShrinkBBox(footnote, (_d = footnote.spacing) !== null && _d !== void 0 ? _d : 0);
            }
        }
        return { shrinkRect: newShrinkRect };
    }
}
