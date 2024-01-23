var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
import { Debug } from '../../util/debug';
import { jsonDiff } from '../../util/json';
import { DataModel } from './dataModel';
export class DataController {
  constructor(mode) {
    this.mode = mode;
    this.debug = Debug.create(true, 'data-model');
    this.requested = [];
    this.status = 'setup';
  }
  request(id, data, opts) {
    return __awaiter(this, void 0, void 0, function* () {
      if (this.status !== 'setup') throw new Error(`ZING Charts - data request after data setup phase.`);
      return new Promise((resolve, reject) => {
        this.requested.push({
          id,
          opts,
          data,
          resultCb: resolve,
          reject
        });
      });
    });
  }
  execute() {
    return __awaiter(this, void 0, void 0, function* () {
      if (this.status !== 'setup') throw new Error(`ZING Charts - data request after data setup phase.`);
      this.status = 'executed';
      this.debug('DataController.execute() - requested', this.requested);
      const {
        valid,
        invalid
      } = this.validateRequests(this.requested);
      this.debug('DataController.execute() - validated', valid);
      const merged = this.mergeRequested(valid);
      this.debug('DataController.execute() - merged', merged);
      const debugMode = Debug.check(true, 'data-model');
      if (debugMode) {
        window.processedData = [];
      }
      const multipleSources = valid.some(v => v.data != null);
      for (const {
        opts,
        data,
        resultCbs,
        rejects,
        ids
      } of merged) {
        const needsValueExtraction = multipleSources || opts.props.some(p => {
          var _a;
          if (p.type !== 'value' && p.type !== 'key') return false;
          return (_a = p.useScopedValues) !== null && _a !== void 0 ? _a : false;
        });
        try {
          const dataModel = new DataModel(Object.assign(Object.assign({}, opts), {
            mode: this.mode
          }));
          const processedData = dataModel.processData(data, valid);
          if (debugMode) {
            window.processedData.push(processedData);
          }
          if (processedData && processedData.partialValidDataCount === 0) {
            resultCbs.forEach((cb, requestIdx) => {
              const id = ids[requestIdx];
              let requestProcessedData = processedData;
              if (needsValueExtraction) {
                requestProcessedData = this.extractScopedData(id, processedData);
              }
              cb({
                dataModel,
                processedData: requestProcessedData
              });
            });
          } else if (processedData) {
            this.splitResult(dataModel, processedData, ids, resultCbs);
          } else {
            rejects.forEach(cb => cb(new Error(`ZING Charts - no processed data generated`)));
          }
        } catch (error) {
          rejects.forEach(cb => cb(error));
        }
      }
      invalid.forEach(({
        error,
        reject
      }) => reject(error));
    });
  }
  extractScopedData(id, processedData) {
    const extractDatum = datum => {
      if (Array.isArray(datum)) {
        return datum.map(extractDatum);
      }
      return Object.assign(Object.assign({}, datum), datum[id]);
    };
    const extractValues = values => {
      var _a;
      if (Array.isArray(values)) {
        return values.map(extractValues);
      }
      return (_a = values === null || values === void 0 ? void 0 : values[id]) !== null && _a !== void 0 ? _a : values;
    };
    return Object.assign(Object.assign({}, processedData), {
      data: processedData.data.map(datum => Object.assign(Object.assign({}, datum), {
        datum: extractDatum(datum.datum),
        values: datum.values.map(extractValues)
      }))
    });
  }
  validateRequests(requested) {
    const valid = [];
    const invalid = [];
    for (const [index, request] of requested.entries()) {
      if (index > 0 && request.data.length !== requested[0].data.length && request.opts.groupByData === false) {
        invalid.push(Object.assign(Object.assign({}, request), {
          error: new Error('all series[].data arrays must be of the same length and have matching keys.')
        }));
      } else {
        valid.push(request);
      }
    }
    return {
      valid,
      invalid
    };
  }
  mergeRequested(requested) {
    const grouped = [];
    const keys = props => {
      return props.filter(p => p.type === 'key').map(p => p.property).join(';');
    };
    const groupMatch = ({
      opts,
      data
    }) => gr => {
      return (opts.groupByData === false || gr[0].data === data) && gr[0].opts.groupByKeys === opts.groupByKeys && gr[0].opts.dataVisible === opts.dataVisible && gr[0].opts.groupByFn === opts.groupByFn && keys(gr[0].opts.props) === keys(opts.props);
    };
    const propMatch = prop => existing => {
      var _a;
      if (existing.type !== prop.type) return false;
      const diff = (_a = jsonDiff(existing, prop)) !== null && _a !== void 0 ? _a : {};
      delete diff['scopes'];
      delete diff['id'];
      delete diff['ids'];
      if ('useScopedValues' in diff) {
        delete diff['useScopedValues'];
      }
      return Object.keys(diff).length === 0;
    };
    const updateKeyValueOpts = prop => {
      var _a;
      if (prop.type !== 'key' && prop.type !== 'value') return;
      const uniqueScopes = new Set((_a = prop.scopes) !== null && _a !== void 0 ? _a : []);
      prop.useScopedValues = uniqueScopes.size > 1;
    };
    const mergeOpts = opts => {
      return Object.assign(Object.assign({}, opts[0]), {
        props: opts.reduce((result, next) => {
          var _a, _b, _c, _d, _e, _f;
          for (const prop of next.props) {
            if (prop.id != null) {
              (_a = prop.ids) !== null && _a !== void 0 ? _a : prop.ids = [];
              (_b = prop.scopes) === null || _b === void 0 ? void 0 : _b.forEach(scope => {
                var _a;
                return (_a = prop.ids) === null || _a === void 0 ? void 0 : _a.push([scope, prop.id]);
              });
            }
            const match = result.find(propMatch(prop));
            if (!match) {
              updateKeyValueOpts(prop);
              result.push(prop);
              continue;
            }
            (_c = match.scopes) !== null && _c !== void 0 ? _c : match.scopes = [];
            match.scopes.push(...((_d = prop.scopes) !== null && _d !== void 0 ? _d : []));
            updateKeyValueOpts(prop);
            if (match.type !== 'key' && match.type !== 'value') continue;
            (_e = match.ids) === null || _e === void 0 ? void 0 : _e.push(...((_f = prop.ids) !== null && _f !== void 0 ? _f : []));
          }
          return result;
        }, [])
      });
    };
    const merge = props => {
      return {
        ids: props.map(({
          id
        }) => id),
        resultCbs: props.map(({
          resultCb
        }) => resultCb),
        rejects: props.map(({
          reject
        }) => reject),
        data: props[0].data,
        opts: mergeOpts(props.map(({
          opts
        }) => opts))
      };
    };
    for (const request of requested) {
      const match = grouped.find(groupMatch(request));
      if (match) {
        match.push(request);
      } else {
        grouped.push([request]);
      }
    }
    return grouped.map(merge);
  }
  splitResult(dataModel, processedData, scopes, resultCbs) {
    for (let index = 0; index < scopes.length; index++) {
      const scope = scopes[index];
      const resultCb = resultCbs[index];
      resultCb({
        dataModel,
        processedData: Object.assign(Object.assign({}, processedData), {
          data: processedData.data.filter(({
            validScopes
          }) => {
            return validScopes == null || validScopes.some(s => s === scope);
          })
        })
      });
    }
  }
}