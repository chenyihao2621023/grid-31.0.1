import { ZingAbstractInputField } from './zingAbstractInputField';
import { exists } from '../utils/generic';
import { isEventFromPrintableCharacter } from '../utils/keyboard';
export class ZingInputTextField extends ZingAbstractInputField {
    constructor(config, className = 'zing-text-field', inputType = 'text') {
        super(config, className, inputType);
    }
    postConstruct() {
        super.postConstruct();
        if (this.config.allowedCharPattern) {
            this.preventDisallowedCharacters();
        }
    }
    setValue(value, silent) {
        // update the input before we call super.setValue, so it's updated before the value changed event is fired
        if (this.eInput.value !== value) {
            this.eInput.value = exists(value) ? value : '';
        }
        return super.setValue(value, silent);
    }
    
    setStartValue(value) {
        this.setValue(value, true);
    }
    preventDisallowedCharacters() {
        const pattern = new RegExp(`[${this.config.allowedCharPattern}]`);
        const preventCharacters = (event) => {
            if (!isEventFromPrintableCharacter(event)) {
                return;
            }
            if (event.key && !pattern.test(event.key)) {
                event.preventDefault();
            }
        };
        this.addManagedListener(this.eInput, 'keydown', preventCharacters);
        this.addManagedListener(this.eInput, 'paste', (e) => {
            var _a;
            const text = (_a = e.clipboardData) === null || _a === void 0 ? void 0 : _a.getData('text');
            if (text && text.split('').some((c) => !pattern.test(c))) {
                e.preventDefault();
            }
        });
    }
}
