import { ZingCheckbox } from './zingCheckbox';
export class ZingToggleButton extends ZingCheckbox {
    constructor(config) {
        super(config, 'zing-toggle-button');
    }
    setValue(value, silent) {
        super.setValue(value, silent);
        this.addOrRemoveCssClass('zing-selected', this.getValue());
        return this;
    }
}
//# sourceMappingURL=zingToggleButton.js.map