var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ContinuousScale } from '../../scale/continuousScale';
import { ChartAxisDirection } from '../chartAxisDirection';
import { Series } from './series';
export class DataModelSeries extends Series {
    isContinuous() {
        var _a, _b;
        const isContinuousX = ContinuousScale.is((_a = this.axes[ChartAxisDirection.X]) === null || _a === void 0 ? void 0 : _a.scale);
        const isContinuousY = ContinuousScale.is((_b = this.axes[ChartAxisDirection.Y]) === null || _b === void 0 ? void 0 : _b.scale);
        return { isContinuousX, isContinuousY };
    }
    getModulePropertyDefinitions() {
        return this.moduleMap.mapValues((mod) => mod.getPropertyDefinitions(this.isContinuous())).flat();
    }
    // Request data, but with message dispatching to series-options (modules).
    requestDataModel(dataController, data, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            // Merge properties of this series with properties of all the attached series-options
            opts.props.push(...this.getModulePropertyDefinitions());
            const { dataModel, processedData } = yield dataController.request(this.id, data !== null && data !== void 0 ? data : [], opts);
            this.dataModel = dataModel;
            this.processedData = processedData;
            this.dispatch('data-processed', { dataModel, processedData });
            return { dataModel, processedData };
        });
    }
    isProcessedDataAnimatable() {
        var _a, _b;
        const validationResults = (_b = (_a = this.processedData) === null || _a === void 0 ? void 0 : _a.reduced) === null || _b === void 0 ? void 0 : _b.animationValidation;
        if (!validationResults) {
            return true;
        }
        const { orderedKeys, uniqueKeys } = validationResults;
        return orderedKeys && uniqueKeys;
    }
    checkProcessedDataAnimatable() {
        if (!this.isProcessedDataAnimatable()) {
            this.ctx.animationManager.skipCurrentBatch();
        }
    }
}
