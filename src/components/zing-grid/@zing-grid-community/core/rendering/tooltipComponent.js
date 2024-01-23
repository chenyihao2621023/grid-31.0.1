import { PopupComponent } from '../widgets/popupComponent';
import { escapeString } from '../utils/string';
export class TooltipComponent extends PopupComponent {
    constructor() {
        super( `<div class="zing-tooltip"></div>`);
    }
    // will need to type params
    init(params) {
        const { value } = params;
        this.getGui().innerHTML = escapeString(value);
    }
}
