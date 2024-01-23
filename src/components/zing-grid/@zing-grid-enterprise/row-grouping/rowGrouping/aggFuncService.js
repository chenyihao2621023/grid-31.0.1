var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AggFuncService_1;
import { Bean, BeanStub, PostConstruct, _ } from '@/components/zing-grid/@zing-grid-community/core/main.js';
const AGBigInt = typeof BigInt === 'undefined' ? null : BigInt;
const defaultAggFuncNames = {
  sum: 'Sum',
  first: 'First',
  last: 'Last',
  min: 'Min',
  max: 'Max',
  count: 'Count',
  avg: 'Average'
};
let AggFuncService = AggFuncService_1 = class AggFuncService extends BeanStub {
  constructor() {
    super(...arguments);
    this.aggFuncsMap = {};
    this.initialised = false;
  }
  init() {
    if (this.initialised) {
      return;
    }
    this.initialiseWithDefaultAggregations();
    this.addAggFuncs(this.gridOptionsService.get('aggFuncs'));
  }
  initialiseWithDefaultAggregations() {
    this.aggFuncsMap[AggFuncService_1.AGG_SUM] = aggSum;
    this.aggFuncsMap[AggFuncService_1.AGG_FIRST] = aggFirst;
    this.aggFuncsMap[AggFuncService_1.AGG_LAST] = aggLast;
    this.aggFuncsMap[AggFuncService_1.AGG_MIN] = aggMin;
    this.aggFuncsMap[AggFuncService_1.AGG_MAX] = aggMax;
    this.aggFuncsMap[AggFuncService_1.AGG_COUNT] = aggCount;
    this.aggFuncsMap[AggFuncService_1.AGG_AVG] = aggAvg;
    this.initialised = true;
  }
  isAggFuncPossible(column, func) {
    const allKeys = this.getFuncNames(column);
    const allowed = _.includes(allKeys, func);
    const funcExists = _.exists(this.aggFuncsMap[func]);
    return allowed && funcExists;
  }
  getDefaultFuncLabel(fctName) {
    var _a;
    return (_a = defaultAggFuncNames[fctName]) !== null && _a !== void 0 ? _a : fctName;
  }
  getDefaultAggFunc(column) {
    const defaultAgg = column.getColDef().defaultAggFunc;
    if (_.exists(defaultAgg) && this.isAggFuncPossible(column, defaultAgg)) {
      return defaultAgg;
    }
    if (this.isAggFuncPossible(column, AggFuncService_1.AGG_SUM)) {
      return AggFuncService_1.AGG_SUM;
    }
    const allKeys = this.getFuncNames(column);
    return _.existsAndNotEmpty(allKeys) ? allKeys[0] : null;
  }
  addAggFuncs(aggFuncs) {
    _.iterateObject(aggFuncs, this.addAggFunc.bind(this));
  }
  addAggFunc(key, aggFunc) {
    this.init();
    this.aggFuncsMap[key] = aggFunc;
  }
  getAggFunc(name) {
    this.init();
    return this.aggFuncsMap[name];
  }
  getFuncNames(column) {
    const userAllowedFuncs = column.getColDef().allowedAggFuncs;
    return userAllowedFuncs == null ? Object.keys(this.aggFuncsMap).sort() : userAllowedFuncs;
  }
  clear() {
    this.aggFuncsMap = {};
  }
};
AggFuncService.AGG_SUM = 'sum';
AggFuncService.AGG_FIRST = 'first';
AggFuncService.AGG_LAST = 'last';
AggFuncService.AGG_MIN = 'min';
AggFuncService.AGG_MAX = 'max';
AggFuncService.AGG_COUNT = 'count';
AggFuncService.AGG_AVG = 'avg';
__decorate([PostConstruct], AggFuncService.prototype, "init", null);
AggFuncService = AggFuncService_1 = __decorate([Bean('aggFuncService')], AggFuncService);
export { AggFuncService };
function aggSum(params) {
  const {
    values
  } = params;
  let result = null;
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    if (typeof value === 'number') {
      if (result === null) {
        result = value;
      } else {
        if (AGBigInt) {
          result += typeof result === 'number' ? value : AGBigInt(value);
        } else {
          result += value;
        }
      }
    } else if (typeof value === 'bigint') {
      if (result === null) {
        result = value;
      } else {
        result = (typeof result === 'bigint' ? result : AGBigInt(result)) + value;
      }
    }
  }
  return result;
}
function aggFirst(params) {
  return params.values.length > 0 ? params.values[0] : null;
}
function aggLast(params) {
  return params.values.length > 0 ? _.last(params.values) : null;
}
function aggMin(params) {
  const {
    values
  } = params;
  let result = null;
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    if ((typeof value === 'number' || typeof value === 'bigint') && (result === null || result > value)) {
      result = value;
    }
  }
  return result;
}
function aggMax(params) {
  const {
    values
  } = params;
  let result = null;
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    if ((typeof value === 'number' || typeof value === 'bigint') && (result === null || result < value)) {
      result = value;
    }
  }
  return result;
}
function aggCount(params) {
  var _a, _b;
  const {
    values
  } = params;
  let result = 0;
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    result += value != null && typeof value.value === 'number' ? value.value : 1;
  }
  const existingAggData = (_b = (_a = params.rowNode) === null || _a === void 0 ? void 0 : _a.aggData) === null || _b === void 0 ? void 0 : _b[params.column.getColId()];
  if (existingAggData && existingAggData.value === result) {
    return existingAggData;
  }
  return {
    value: result,
    toString: function () {
      return this.value.toString();
    },
    toNumber: function () {
      return this.value;
    }
  };
}
function aggAvg(params) {
  var _a, _b, _c;
  const {
    values
  } = params;
  let sum = 0;
  let count = 0;
  for (let i = 0; i < values.length; i++) {
    const currentValue = values[i];
    let valueToAdd = null;
    if (typeof currentValue === 'number' || typeof currentValue === 'bigint') {
      valueToAdd = currentValue;
      count++;
    } else if (currentValue != null && (typeof currentValue.value === 'number' || typeof currentValue.value === 'bigint') && typeof currentValue.count === 'number') {
      if (AGBigInt) {
        valueToAdd = currentValue.value * (typeof currentValue.value === 'number' ? currentValue.count : AGBigInt(currentValue.count));
      } else {
        valueToAdd = currentValue.value * currentValue.count;
      }
      count += currentValue.count;
    }
    if (typeof valueToAdd === 'number') {
      if (AGBigInt) {
        sum += typeof sum === 'number' ? valueToAdd : AGBigInt(valueToAdd);
      } else {
        sum += valueToAdd;
      }
    } else if (typeof valueToAdd === 'bigint') {
      sum = (typeof sum === 'bigint' ? sum : AGBigInt(sum)) + valueToAdd;
    }
  }
  let value = null;
  if (count > 0) {
    if (AGBigInt) {
      value = sum / (typeof sum === 'number' ? count : AGBigInt(count));
    } else {
      value = sum / count;
    }
  }
  const existingAggData = (_b = (_a = params.rowNode) === null || _a === void 0 ? void 0 : _a.aggData) === null || _b === void 0 ? void 0 : _b[(_c = params.column) === null || _c === void 0 ? void 0 : _c.getColId()];
  if (existingAggData && existingAggData.count === count && existingAggData.value === value) {
    return existingAggData;
  }
  return {
    count,
    value,
    toString: function () {
      return typeof this.value === 'number' || typeof this.value === 'bigint' ? this.value.toString() : '';
    },
    toNumber: function () {
      return this.value;
    }
  };
}