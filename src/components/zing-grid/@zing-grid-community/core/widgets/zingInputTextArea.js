import { ZingAbstractInputField } from "./zingAbstractInputField";
export class ZingInputTextArea extends ZingAbstractInputField {
    constructor(config) {
        super(config, 'ag-text-area', null, 'textarea');
    }
    setValue(value, silent) {
        const ret = super.setValue(value, silent);
        this.eInput.value = value;
        return ret;
    }
    setCols(cols) {
        this.eInput.cols = cols;
        return this;
    }
    setRows(rows) {
        this.eInput.rows = rows;
        return this;
    }
}
//# sourceMappingURL=zingInputTextArea.js.map