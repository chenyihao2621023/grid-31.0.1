import { AgRichSelect, _ } from "@/components/zing-grid/@ag-grid-community/core/main.js";
export class AddDropdownComp extends AgRichSelect {
    constructor(params) {
        super(Object.assign(Object.assign({}, params), { template: /* html */ `
                <div class="ag-picker-field" role="presentation">
                    <div ref="eLabel"></div>
                    <div ref="eWrapper" class="ag-wrapper ag-picker-collapsed">
                        <div ref="eDisplayField" class="ag-picker-field-display"></div>
                        <ag-input-text-field ref="eInput" class="ag-rich-select-field-input"></ag-input-text-field>
                        <div ref="eIcon" class="ag-picker-field-icon" aria-hidden="true"></div>
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
        _.stopPropagationForAgGrid(event);
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