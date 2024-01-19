import { ZingRichSelect, _ } from "@/components/zing-grid/@zing-grid-community/core/main.js";
export class AddDropdownComp extends ZingRichSelect {
    constructor(params) {
        super(Object.assign(Object.assign({}, params), { template: /* html */ `
                <div class="zing-picker-field" role="presentation">
                    <div ref="eLabel"></div>
                    <div ref="eWrapper" class="zing-wrapper zing-picker-collapsed">
                        <div ref="eDisplayField" class="zing-picker-field-display"></div>
                        <zing-input-text-field ref="eInput" class="zing-rich-select-field-input"></zing-input-text-field>
                        <div ref="eIcon" class="zing-picker-field-icon" aria-hidden="true"></div>
                    </div>
                </div>` }));
        this.params = params;
    }
    showPicker() {
        // avoid focus handling issues with multiple rich selects
        setTimeout(() => super.showPicker());
    }
    hidePicker() {
        // avoid focus handling issues with multiple rich selects
        setTimeout(() => super.hidePicker());
    }
    postConstruct() {
        super.postConstruct();
        const { wrapperClassName, ariaLabel } = this.params;
        _.setDisplayed(this.eDisplayField, false);
        if (wrapperClassName) {
            this.eWrapper.classList.add(wrapperClassName);
        }
        _.setAriaLabelledBy(this.eWrapper, '');
        _.setAriaLabel(this.eWrapper, ariaLabel);
    }
    onEnterKeyDown(event) {
        _.stopPropagationForZingGrid(event);
        if (this.isPickerDisplayed) {
            super.onEnterKeyDown(event);
        }
        else {
            event.preventDefault();
            this.showPicker();
        }
    }
}
//# sourceMappingURL=addDropdownComp.js.map