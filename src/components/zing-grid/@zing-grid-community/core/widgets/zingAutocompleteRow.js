import { escapeString } from "../utils/string";
import { exists } from "../utils/generic";
import { Component } from "./component";
export class ZingAutocompleteRow extends Component {
    constructor() {
        super(/* html */ `
        <div class="zing-autocomplete-row" role="presentation">
            <div class="zing-autocomplete-row-label"></div>
        </div>`);
        this.hasHighlighting = false;
    }
    setState(value, selected) {
        this.value = value;
        this.render();
        this.updateSelected(selected);
    }
    updateSelected(selected) {
        this.addOrRemoveCssClass('zing-autocomplete-row-selected', selected);
    }
    setSearchString(searchString) {
        var _a;
        let keepHighlighting = false;
        if (exists(searchString)) {
            const index = (_a = this.value) === null || _a === void 0 ? void 0 : _a.toLocaleLowerCase().indexOf(searchString.toLocaleLowerCase());
            if (index >= 0) {
                keepHighlighting = true;
                this.hasHighlighting = true;
                const highlightEndIndex = index + searchString.length;
                const startPart = escapeString(this.value.slice(0, index));
                const highlightedPart = escapeString(this.value.slice(index, highlightEndIndex));
                const endPart = escapeString(this.value.slice(highlightEndIndex));
                this.getGui().lastElementChild.innerHTML = `${startPart}<b>${highlightedPart}</b>${endPart}`;
            }
        }
        if (!keepHighlighting && this.hasHighlighting) {
            this.hasHighlighting = false;
            this.render();
        }
    }
    render() {
        var _a;
        // putting in blank if missing, so at least the user can click on it
        this.getGui().lastElementChild.innerHTML = (_a = escapeString(this.value)) !== null && _a !== void 0 ? _a : '&nbsp;';
    }
}
//# sourceMappingURL=zingAutocompleteRow.js.map