import { ZingAbstractLabel } from './zingAbstractLabel';
import { setFixedWidth } from '../utils/dom';
import { Events } from '../eventKeys';
import { getAriaLabel, setAriaLabel, setAriaLabelledBy } from '../utils/aria';
export class ZingAbstractField extends ZingAbstractLabel {
    constructor(config, template, className) {
        super(config, template);
        this.className = className;
    }
    postConstruct() {
        super.postConstruct();
        if (this.className) {
            this.addCssClass(this.className);
        }
        this.refreshAriaLabelledBy();
    }
    refreshAriaLabelledBy() {
        const ariaEl = this.getAriaElement();
        const labelId = this.getLabelId();
        if (getAriaLabel(ariaEl) !== null) {
            setAriaLabelledBy(ariaEl, '');
        }
        else {
            setAriaLabelledBy(ariaEl, labelId !== null && labelId !== void 0 ? labelId : '');
        }
    }
    setAriaLabel(label) {
        setAriaLabel(this.getAriaElement(), label);
        this.refreshAriaLabelledBy();
        return this;
    }
    onValueChange(callbackFn) {
        this.addManagedListener(this, Events.EVENT_FIELD_VALUE_CHANGED, () => callbackFn(this.getValue()));
        return this;
    }
    getWidth() {
        return this.getGui().clientWidth;
    }
    setWidth(width) {
        setFixedWidth(this.getGui(), width);
        return this;
    }
    getPreviousValue() {
        return this.previousValue;
    }
    getValue() {
        return this.value;
    }
    setValue(value, silent) {
        if (this.value === value) {
            return this;
        }
        this.previousValue = this.value;
        this.value = value;
        if (!silent) {
            this.dispatchEvent({ type: Events.EVENT_FIELD_VALUE_CHANGED });
        }
        return this;
    }
}
