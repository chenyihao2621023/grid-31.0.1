var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { RefSelector } from "./componentAnnotations";
import { ZingAbstractLabel } from "./zingAbstractLabel";
import { PostConstruct } from "../context/context";
import { Events } from "../eventKeys";
export class ZingSlider extends ZingAbstractLabel {
    constructor(config) {
        super(config, ZingSlider.TEMPLATE);
        this.labelAlignment = 'top';
    }
    init() {
        this.eSlider.addCssClass('zing-slider-field');
    }
    onValueChange(callbackFn) {
        const eventChanged = Events.EVENT_FIELD_VALUE_CHANGED;
        this.addManagedListener(this.eText, eventChanged, () => {
            const textValue = parseFloat(this.eText.getValue());
            this.eSlider.setValue(textValue.toString(), true);
            callbackFn(textValue || 0);
        });
        this.addManagedListener(this.eSlider, eventChanged, () => {
            const sliderValue = this.eSlider.getValue();
            this.eText.setValue(sliderValue, true);
            callbackFn(parseFloat(sliderValue));
        });
        return this;
    }
    setSliderWidth(width) {
        this.eSlider.setWidth(width);
        return this;
    }
    setTextFieldWidth(width) {
        this.eText.setWidth(width);
        return this;
    }
    setMinValue(minValue) {
        this.eSlider.setMinValue(minValue);
        this.eText.setMin(minValue);
        return this;
    }
    setMaxValue(maxValue) {
        this.eSlider.setMaxValue(maxValue);
        this.eText.setMax(maxValue);
        return this;
    }
    getValue() {
        return this.eText.getValue();
    }
    setValue(value) {
        if (this.getValue() === value) {
            return this;
        }
        this.eText.setValue(value, true);
        this.eSlider.setValue(value, true);
        this.dispatchEvent({ type: Events.EVENT_FIELD_VALUE_CHANGED });
        return this;
    }
    setStep(step) {
        this.eSlider.setStep(step);
        this.eText.setStep(step);
        return this;
    }
}
ZingSlider.TEMPLATE = `<div class="zing-slider">
            <label ref="eLabel"></label>
            <div class="zing-wrapper zing-slider-wrapper">
                <zing-input-range ref="eSlider"></zing-input-range>
                <zing-input-number-field ref="eText"></zing-input-number-field>
            </div>
        </div>`;
__decorate([
    RefSelector('eLabel')
], ZingSlider.prototype, "eLabel", void 0);
__decorate([
    RefSelector('eSlider')
], ZingSlider.prototype, "eSlider", void 0);
__decorate([
    RefSelector('eText')
], ZingSlider.prototype, "eText", void 0);
__decorate([
    PostConstruct
], ZingSlider.prototype, "init", null);
//# sourceMappingURL=zingSlider.js.map