import { ZingPickerField } from "./zingPickerField";
import { ZingList } from "./zingList";
import { Events } from "../eventKeys";
import { KeyCode } from "../constants/keyCode";
import { setAriaControls } from "../utils/aria";
export class ZingSelect extends ZingPickerField {
  constructor(config) {
    super(Object.assign({
      pickerAriaLabelKey: 'ariaLabelSelectField',
      pickerAriaLabelValue: 'Select Field',
      pickerType: 'zing-list',
      className: 'zing-select',
      pickerIcon: 'smallDown',
      ariaRole: 'combobox'
    }, config));
  }
  postConstruct() {
    super.postConstruct();
    this.createListComponent();
    this.eWrapper.tabIndex = this.gridOptionsService.get('tabIndex');
  }
  createListComponent() {
    this.listComponent = this.createBean(new ZingList('select'));
    this.listComponent.setParentComponent(this);
    const eListAriaEl = this.listComponent.getAriaElement();
    const listId = `zing-select-list-${this.listComponent.getCompId()}`;
    eListAriaEl.setAttribute('id', listId);
    setAriaControls(this.getAriaElement(), eListAriaEl);
    this.listComponent.addGuiEventListener('keydown', e => {
      if (e.key === KeyCode.TAB) {
        e.preventDefault();
        e.stopImmediatePropagation();
        this.getGui().dispatchEvent(new KeyboardEvent('keydown', {
          key: e.key,
          shiftKey: e.shiftKey,
          ctrlKey: e.ctrlKey,
          bubbles: true
        }));
      }
      ;
    });
    this.listComponent.addManagedListener(this.listComponent, ZingList.EVENT_ITEM_SELECTED, () => {
      this.hidePicker();
      this.dispatchEvent({
        type: ZingSelect.EVENT_ITEM_SELECTED
      });
    });
    this.listComponent.addManagedListener(this.listComponent, Events.EVENT_FIELD_VALUE_CHANGED, () => {
      if (!this.listComponent) {
        return;
      }
      this.setValue(this.listComponent.getValue(), false, true);
      this.hidePicker();
    });
  }
  createPickerComponent() {
    return this.listComponent;
  }
  showPicker() {
    if (!this.listComponent) {
      return;
    }
    super.showPicker();
    this.listComponent.refreshHighlighted();
  }
  addOptions(options) {
    options.forEach(option => this.addOption(option));
    return this;
  }
  addOption(option) {
    this.listComponent.addOption(option);
    return this;
  }
  setValue(value, silent, fromPicker) {
    if (this.value === value || !this.listComponent) {
      return this;
    }
    if (!fromPicker) {
      this.listComponent.setValue(value, true);
    }
    const newValue = this.listComponent.getValue();
    if (newValue === this.getValue()) {
      return this;
    }
    this.eDisplayField.innerHTML = this.listComponent.getDisplayValue();
    return super.setValue(value, silent);
  }
  destroy() {
    if (this.listComponent) {
      this.destroyBean(this.listComponent);
      this.listComponent = undefined;
    }
    super.destroy();
  }
}
ZingSelect.EVENT_ITEM_SELECTED = 'selectedItem';