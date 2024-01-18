import { Listeners } from '../util/listeners';
import { ChartUpdateType } from './chartUpdateType';
export class UpdateService extends Listeners {
    constructor(updateCallback) {
        super();
        this.updateCallback = updateCallback;
    }
    update(type = ChartUpdateType.FULL, { forceNodeDataRefresh = false, skipAnimations = false } = {}) {
        this.updateCallback(type, { forceNodeDataRefresh, skipAnimations });
    }
    dispatchUpdateComplete(minRect) {
        const event = { type: 'update-complete', minRect };
        this.dispatch('update-complete', event);
    }
}
//# sourceMappingURL=updateService.js.map