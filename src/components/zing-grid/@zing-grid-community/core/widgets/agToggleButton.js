import { AgCheckbox } from './agCheckbox';
export class AgToggleButton extends AgCheckbox {
    constructor(config) {
        super(config, 'ag-toggle-button');
    }
    setValue(value, silent) {
        super.setValue(value, silent);
        this.addOrRemoveCssClass('ag-selected', this.getValue());
        return this;
    }
}
//# sourceMappingURL=agToggleButton.js.map