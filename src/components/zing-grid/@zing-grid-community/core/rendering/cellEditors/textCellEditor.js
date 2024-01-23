import { SimpleCellEditor } from "./simpleCellEditor";
import { exists } from "../../utils/generic";
class TextCellEditorInput {
  getTemplate() {
    return `<zing-input-text-field class="zing-cell-editor" ref="eInput"></zing-input-text-field>`;
  }
  init(eInput, params) {
    this.eInput = eInput;
    this.params = params;
    if (params.maxLength != null) {
      eInput.setMaxLength(params.maxLength);
    }
  }
  getValue() {
    const value = this.eInput.getValue();
    if (!exists(value) && !exists(this.params.value)) {
      return this.params.value;
    }
    return this.params.parseValue(value);
  }
  getStartValue() {
    const formatValue = this.params.useFormatter || this.params.column.getColDef().refData;
    return formatValue ? this.params.formatValue(this.params.value) : this.params.value;
  }
  setCaret() {
    const value = this.eInput.getValue();
    const len = exists(value) && value.length || 0;
    if (len) {
      this.eInput.getInputElement().setSelectionRange(len, len);
    }
  }
}
export class TextCellEditor extends SimpleCellEditor {
  constructor() {
    super(new TextCellEditorInput());
  }
}