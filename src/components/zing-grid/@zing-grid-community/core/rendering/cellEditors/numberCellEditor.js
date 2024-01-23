import { SimpleCellEditor } from "./simpleCellEditor";
import { exists } from "../../utils/generic";
import { KeyCode } from "../../constants/keyCode";
class NumberCellEditorInput {
  getTemplate() {
    return `<zing-input-number-field class="zing-cell-editor" ref="eInput"></zing-input-number-field>`;
  }
  init(eInput, params) {
    this.eInput = eInput;
    this.params = params;
    if (params.max != null) {
      eInput.setMax(params.max);
    }
    if (params.min != null) {
      eInput.setMin(params.min);
    }
    if (params.precision != null) {
      eInput.setPrecision(params.precision);
    }
    if (params.step != null) {
      eInput.setStep(params.step);
    }
    const inputEl = eInput.getInputElement();
    if (params.preventStepping) {
      eInput.addManagedListener(inputEl, 'keydown', this.preventStepping);
    } else if (params.showStepperButtons) {
      inputEl.classList.add('zing-number-field-input-stepper');
    }
  }
  preventStepping(e) {
    if (e.key === KeyCode.UP || e.key === KeyCode.DOWN) {
      e.preventDefault();
    }
  }
  getValue() {
    const value = this.eInput.getValue();
    if (!exists(value) && !exists(this.params.value)) {
      return this.params.value;
    }
    let parsedValue = this.params.parseValue(value);
    if (parsedValue == null) {
      return parsedValue;
    }
    if (typeof parsedValue === 'string') {
      if (parsedValue === '') {
        return null;
      }
      parsedValue = Number(parsedValue);
    }
    return isNaN(parsedValue) ? null : parsedValue;
  }
  getStartValue() {
    return this.params.value;
  }
}
export class NumberCellEditor extends SimpleCellEditor {
  constructor() {
    super(new NumberCellEditorInput());
  }
}