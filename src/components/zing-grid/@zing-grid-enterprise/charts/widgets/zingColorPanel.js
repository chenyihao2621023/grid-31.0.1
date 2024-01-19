var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, PostConstruct, RefSelector, _ } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { _Util } from '@/components/zing-grid/zing-charts-community/main.js';
import { KeyCode } from "@/components/zing-grid/@zing-grid-community/core/main.js";
export class ZingColorPanel extends Component {
    constructor(config) {
        super(ZingColorPanel.TEMPLATE);
        this.H = 1; // in the [0, 1] range
        this.S = 1; // in the [0, 1] range
        this.B = 1; // in the [0, 1] range
        this.A = 1; // in the [0, 1] range
        this.isSpectrumDragging = false;
        this.isSpectrumHueDragging = false;
        this.isSpectrumAlphaDragging = false;
        this.colorChanged = false;
        this.picker = config.picker;
    }
    postConstruct() {
        this.initTabIndex();
        this.initRecentColors();
        this.addGuiEventListener('focus', () => this.spectrumColor.focus());
        this.addGuiEventListener('keydown', (e) => {
            if (e.key === KeyCode.ENTER && !e.defaultPrevented) {
                this.destroy();
            }
        });
        this.addManagedListener(this.spectrumColor, 'keydown', e => this.moveDragger(e));
        this.addManagedListener(this.spectrumAlphaSlider, 'keydown', e => this.moveAlphaSlider(e));
        this.addManagedListener(this.spectrumHueSlider, 'keydown', e => this.moveHueSlider(e));
        this.addManagedListener(this.spectrumVal, 'mousedown', this.onSpectrumDraggerDown.bind(this));
        this.addManagedListener(this.spectrumHue, 'mousedown', this.onSpectrumHueDown.bind(this));
        this.addManagedListener(this.spectrumAlpha, 'mousedown', this.onSpectrumAlphaDown.bind(this));
        this.addGuiEventListener('mousemove', (e) => {
            this.onSpectrumDraggerMove(e);
            this.onSpectrumHueMove(e);
            this.onSpectrumAlphaMove(e);
        });
        // Listening to `mouseup` on the document on purpose. The user might release the mouse button
        // outside the UI control. When the mouse returns back to the control's area, the dragging
        // of the thumb is not expected and seen as a bug.
        this.addManagedListener(document, 'mouseup', this.onMouseUp.bind(this));
        this.addManagedListener(this.recentColors, 'click', this.onRecentColorClick.bind(this));
        this.addManagedListener(this.recentColors, 'keydown', (e) => {
            if (e.key === KeyCode.ENTER || e.key === KeyCode.SPACE) {
                e.preventDefault();
                this.onRecentColorClick(e);
            }
        });
    }
    initTabIndex() {
        const tabIndex = this.tabIndex = (this.gridOptionsService.get('tabIndex')).toString();
        this.spectrumColor.setAttribute('tabindex', tabIndex);
        this.spectrumHueSlider.setAttribute('tabindex', tabIndex);
        this.spectrumAlphaSlider.setAttribute('tabindex', tabIndex);
    }
    refreshSpectrumRect() {
        return this.spectrumValRect = this.spectrumVal.getBoundingClientRect();
    }
    refreshHueRect() {
        return this.spectrumHueRect = this.spectrumHue.getBoundingClientRect();
    }
    refreshAlphaRect() {
        return this.spectrumAlphaRect = this.spectrumAlpha.getBoundingClientRect();
    }
    onSpectrumDraggerDown(e) {
        this.refreshSpectrumRect();
        this.isSpectrumDragging = true;
        this.moveDragger(e);
    }
    onSpectrumDraggerMove(e) {
        if (this.isSpectrumDragging) {
            this.moveDragger(e);
        }
    }
    onSpectrumHueDown(e) {
        this.refreshHueRect();
        this.isSpectrumHueDragging = true;
        this.moveHueSlider(e);
    }
    onSpectrumHueMove(e) {
        if (this.isSpectrumHueDragging) {
            this.moveHueSlider(e);
        }
    }
    onSpectrumAlphaDown(e) {
        this.refreshAlphaRect();
        this.isSpectrumAlphaDragging = true;
        this.moveAlphaSlider(e);
    }
    onSpectrumAlphaMove(e) {
        if (this.isSpectrumAlphaDragging) {
            this.moveAlphaSlider(e);
        }
    }
    onMouseUp() {
        this.isSpectrumDragging = false;
        this.isSpectrumHueDragging = false;
        this.isSpectrumAlphaDragging = false;
    }
    moveDragger(e) {
        const valRect = this.spectrumValRect;
        if (!valRect) {
            return;
        }
        let x;
        let y;
        if (e instanceof MouseEvent) {
            x = e.clientX - valRect.left;
            y = e.clientY - valRect.top;
        }
        else {
            const isLeft = e.key === KeyCode.LEFT;
            const isRight = e.key === KeyCode.RIGHT;
            const isUp = e.key === KeyCode.UP;
            const isDown = e.key === KeyCode.DOWN;
            const isVertical = isUp || isDown;
            const isHorizontal = isLeft || isRight;
            if (!isVertical && !isHorizontal) {
                return;
            }
            e.preventDefault();
            const { x: currentX, y: currentY } = this.getSpectrumValue();
            x = currentX + (isHorizontal ? (isLeft ? -5 : 5) : 0);
            y = currentY + (isVertical ? (isUp ? -5 : 5) : 0);
        }
        x = Math.max(x, 0);
        x = Math.min(x, valRect.width);
        y = Math.max(y, 0);
        y = Math.min(y, valRect.height);
        this.setSpectrumValue(x / valRect.width, 1 - y / valRect.height);
    }
    moveHueSlider(e) {
        const rect = this.spectrumHueRect;
        if (!rect) {
            return;
        }
        const x = this.moveSlider(this.spectrumHueSlider, e);
        if (x == null) {
            return;
        }
        this.H = 1 - x / rect.width;
        this.update();
    }
    moveAlphaSlider(e) {
        const rect = this.spectrumAlphaRect;
        if (!rect) {
            return;
        }
        const x = this.moveSlider(this.spectrumAlphaSlider, e);
        if (x == null) {
            return;
        }
        this.A = x / rect.width;
        this.update();
    }
    moveSlider(slider, e) {
        var _a;
        const sliderRect = slider.getBoundingClientRect();
        const parentRect = (_a = slider.parentElement) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect();
        if (!slider || !parentRect) {
            return null;
        }
        let x;
        if (e instanceof MouseEvent) {
            x = e.clientX - parentRect.left;
        }
        else {
            const isLeft = e.key === KeyCode.LEFT;
            const isRight = e.key === KeyCode.RIGHT;
            if (!isLeft && !isRight) {
                return null;
            }
            e.preventDefault();
            const diff = isLeft ? -5 : 5;
            x = (parseFloat(slider.style.left) - sliderRect.width / 2) + diff;
        }
        x = Math.max(x, 0);
        x = Math.min(x, parentRect.width);
        slider.style.left = (x + sliderRect.width / 2) + 'px';
        return x;
    }
    update() {
        const color = _Util.Color.fromHSB(this.H * 360, this.S, this.B, this.A);
        const spectrumColor = _Util.Color.fromHSB(this.H * 360, 1, 1);
        const rgbaColor = color.toRgbaString();
        // the recent color list needs to know color has actually changed
        const colorPicker = this.picker;
        const existingColor = _Util.Color.fromString(colorPicker.getValue());
        if (existingColor.toRgbaString() !== rgbaColor) {
            this.colorChanged = true;
        }
        colorPicker.setValue(rgbaColor);
        this.spectrumColor.style.backgroundColor = spectrumColor.toRgbaString();
        this.spectrumDragger.style.backgroundColor = rgbaColor;
    }
    /**
     * @param saturation In the [0, 1] interval.
     * @param brightness In the [0, 1] interval.
     */
    setSpectrumValue(saturation, brightness) {
        const valRect = this.spectrumValRect || this.refreshSpectrumRect();
        if (valRect == null) {
            return;
        }
        const dragger = this.spectrumDragger;
        const draggerRect = dragger.getBoundingClientRect();
        saturation = Math.max(0, saturation);
        saturation = Math.min(1, saturation);
        brightness = Math.max(0, brightness);
        brightness = Math.min(1, brightness);
        this.S = saturation;
        this.B = brightness;
        dragger.style.left = (saturation * valRect.width - draggerRect.width / 2) + 'px';
        dragger.style.top = ((1 - brightness) * valRect.height - draggerRect.height / 2) + 'px';
        this.update();
    }
    getSpectrumValue() {
        const dragger = this.spectrumDragger;
        const draggerRect = dragger.getBoundingClientRect();
        const x = parseFloat(dragger.style.left) + draggerRect.width / 2;
        const y = parseFloat(dragger.style.top) + draggerRect.height / 2;
        return { x, y };
    }
    initRecentColors() {
        const recentColors = ZingColorPanel.recentColors;
        const innerHtml = recentColors.map((color, index) => {
            return ( /* html */`<div class="zing-recent-color" id=${index} style="background-color: ${color}; width: 15px; height: 15px;" recent-color="${color}" tabIndex="${this.tabIndex}"></div>`);
        });
        this.recentColors.innerHTML = innerHtml.join('');
    }
    setValue(val) {
        const color = _Util.Color.fromString(val);
        const [h, s, b] = color.toHSB();
        this.H = (isNaN(h) ? 0 : h) / 360;
        this.A = color.a;
        const spectrumHueRect = this.spectrumHueRect || this.refreshHueRect();
        const spectrumAlphaRect = this.spectrumAlphaRect || this.refreshAlphaRect();
        this.spectrumHueSlider.style.left = `${((this.H - 1) * -spectrumHueRect.width)}px`;
        this.spectrumAlphaSlider.style.left = `${(this.A * spectrumAlphaRect.width)}px`;
        this.setSpectrumValue(s, b);
    }
    onRecentColorClick(e) {
        const target = e.target;
        if (!_.exists(target.id)) {
            return;
        }
        const id = parseInt(target.id, 10);
        this.setValue(ZingColorPanel.recentColors[id]);
        this.destroy();
    }
    addRecentColor() {
        const color = _Util.Color.fromHSB(this.H * 360, this.S, this.B, this.A);
        const rgbaColor = color.toRgbaString();
        let recentColors = ZingColorPanel.recentColors;
        if (!this.colorChanged || recentColors[0] === rgbaColor) {
            return;
        }
        // remove duplicate color
        recentColors = recentColors.filter(currentColor => currentColor != rgbaColor);
        // add color to head
        recentColors = [rgbaColor].concat(recentColors);
        // ensure we don't exceed max number of recent colors
        if (recentColors.length > ZingColorPanel.maxRecentColors) {
            recentColors = recentColors.slice(0, ZingColorPanel.maxRecentColors);
        }
        ZingColorPanel.recentColors = recentColors;
    }
    destroy() {
        this.addRecentColor();
        super.destroy();
    }
}
ZingColorPanel.maxRecentColors = 8;
ZingColorPanel.recentColors = [];
ZingColorPanel.TEMPLATE = `<div class="zing-color-panel" tabindex="-1">
            <div ref="spectrumColor" class="zing-spectrum-color">
                <div class="zing-spectrum-sat zing-spectrum-fill">
                    <div ref="spectrumVal" class="zing-spectrum-val zing-spectrum-fill">
                        <div ref="spectrumDragger" class="zing-spectrum-dragger"></div>
                    </div>
                </div>
            </div>
            <div class="zing-spectrum-tools">
                <div ref="spectrumHue" class="zing-spectrum-hue zing-spectrum-tool">
                    <div class="zing-spectrum-hue-background"></div>
                    <div ref="spectrumHueSlider" class="zing-spectrum-slider"></div>
                </div>
                <div ref="spectrumAlpha" class="zing-spectrum-alpha zing-spectrum-tool">
                    <div class="zing-spectrum-alpha-background"></div>
                    <div ref="spectrumAlphaSlider" class="zing-spectrum-slider"></div>
                </div>
                <div ref="recentColors" class="zing-recent-colors"></div>
            </div>
        </div>`;
__decorate([
    RefSelector('spectrumColor')
], ZingColorPanel.prototype, "spectrumColor", void 0);
__decorate([
    RefSelector('spectrumVal')
], ZingColorPanel.prototype, "spectrumVal", void 0);
__decorate([
    RefSelector('spectrumDragger')
], ZingColorPanel.prototype, "spectrumDragger", void 0);
__decorate([
    RefSelector('spectrumHue')
], ZingColorPanel.prototype, "spectrumHue", void 0);
__decorate([
    RefSelector('spectrumHueSlider')
], ZingColorPanel.prototype, "spectrumHueSlider", void 0);
__decorate([
    RefSelector('spectrumAlpha')
], ZingColorPanel.prototype, "spectrumAlpha", void 0);
__decorate([
    RefSelector('spectrumAlphaSlider')
], ZingColorPanel.prototype, "spectrumAlphaSlider", void 0);
__decorate([
    RefSelector('recentColors')
], ZingColorPanel.prototype, "recentColors", void 0);
__decorate([
    PostConstruct
], ZingColorPanel.prototype, "postConstruct", null);
//# sourceMappingURL=zingColorPanel.js.map