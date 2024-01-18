import { ZingCheckbox } from './zingCheckbox';
export class ZingToggleButton extends ZingCheckbox {
    constructor(config) {
        super(config, 'ag-toggle-button');
    }
    setValue(value, silent) {
        super.setValue(value, silent);
        this.addOrRemoveCssClass('ag-selected', this.getValue());
        return this;
    }
}
//# sourceMappingURL=zingToggleButton.js.map