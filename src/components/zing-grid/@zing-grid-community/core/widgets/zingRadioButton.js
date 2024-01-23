import { ZingCheckbox } from './zingCheckbox';
import { Events } from '../eventKeys';
export class ZingRadioButton extends ZingCheckbox {
    constructor(config) {
        super(config, 'zing-radio-button', 'radio');
    }
    isSelected() {
        return this.eInput.checked;
    }
    toggle() {
        if (this.eInput.disabled) {
            return;
        }
        // do not allow an active radio button to be deselected
        if (!this.isSelected()) {
            this.setValue(true);
        }
    }
    addInputListeners() {
        super.addInputListeners();
        this.addManagedListener(this.eventService, Events.EVENT_CHECKBOX_CHANGED, this.onChange.bind(this));
    }
    
    onChange(event) {
        if (event.selected &&
            event.name &&
            this.eInput.name &&
            this.eInput.name === event.name &&
            event.id &&
            this.eInput.id !== event.id) {
            this.setValue(false, true);
        }
    }
}
