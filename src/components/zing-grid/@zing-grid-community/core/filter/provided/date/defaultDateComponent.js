var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component } from '../../../widgets/component';
import { RefSelector } from '../../../widgets/componentAnnotations';
import { serialiseDate, parseDateTimeFromString, dateToFormattedString } from '../../../utils/date';
import { getSafariVersion, isBrowserChrome, isBrowserFirefox, isBrowserSafari } from '../../../utils/browser';
import { warnOnce } from '../../../utils/function';
export class DefaultDateComponent extends Component {
  constructor() {
    super(`
            <div class="zing-filter-filter">
                <zing-input-text-field class="zing-date-filter" ref="eDateInput"></zing-input-text-field>
            </div>`);
  }
  destroy() {
    super.destroy();
  }
  init(params) {
    this.params = params;
    this.setParams(params);
    const eDocument = this.gridOptionsService.getDocument();
    const inputElement = this.eDateInput.getInputElement();
    this.addManagedListener(inputElement, 'mousedown', () => {
      if (this.eDateInput.isDisabled() || this.usingSafariDatePicker) {
        return;
      }
      inputElement.focus();
    });
    this.addManagedListener(inputElement, 'input', e => {
      if (e.target !== eDocument.activeElement) {
        return;
      }
      if (this.eDateInput.isDisabled()) {
        return;
      }
      this.params.onDateChanged();
    });
  }
  setParams(params) {
    const inputElement = this.eDateInput.getInputElement();
    const shouldUseBrowserDatePicker = this.shouldUseBrowserDatePicker(params);
    this.usingSafariDatePicker = shouldUseBrowserDatePicker && isBrowserSafari();
    inputElement.type = shouldUseBrowserDatePicker ? 'date' : 'text';
    const {
      minValidYear,
      maxValidYear,
      minValidDate,
      maxValidDate
    } = params.filterParams || {};
    if (minValidDate && minValidYear) {
      warnOnce('DateFilter should not have both minValidDate and minValidYear parameters set at the same time! minValidYear will be ignored.');
    }
    if (maxValidDate && maxValidYear) {
      warnOnce('DateFilter should not have both maxValidDate and maxValidYear parameters set at the same time! maxValidYear will be ignored.');
    }
    if (minValidDate && maxValidDate) {
      const [parsedMinValidDate, parsedMaxValidDate] = [minValidDate, maxValidDate].map(v => v instanceof Date ? v : parseDateTimeFromString(v));
      if (parsedMinValidDate && parsedMaxValidDate && parsedMinValidDate.getTime() > parsedMaxValidDate.getTime()) {
        warnOnce('DateFilter parameter minValidDate should always be lower than or equal to parameter maxValidDate.');
      }
    }
    if (minValidDate) {
      if (minValidDate instanceof Date) {
        inputElement.min = dateToFormattedString(minValidDate);
      } else {
        inputElement.min = minValidDate;
      }
    } else {
      if (minValidYear) {
        inputElement.min = `${minValidYear}-01-01`;
      }
    }
    if (maxValidDate) {
      if (maxValidDate instanceof Date) {
        inputElement.max = dateToFormattedString(maxValidDate);
      } else {
        inputElement.max = maxValidDate;
      }
    } else {
      if (maxValidYear) {
        inputElement.max = `${maxValidYear}-12-31`;
      }
    }
  }
  onParamsUpdated(params) {
    this.params = params;
    this.setParams(params);
  }
  getDate() {
    return parseDateTimeFromString(this.eDateInput.getValue());
  }
  setDate(date) {
    this.eDateInput.setValue(serialiseDate(date, false));
  }
  setInputPlaceholder(placeholder) {
    this.eDateInput.setInputPlaceholder(placeholder);
  }
  setDisabled(disabled) {
    this.eDateInput.setDisabled(disabled);
  }
  afterGuiAttached(params) {
    if (!params || !params.suppressFocus) {
      this.eDateInput.getInputElement().focus();
    }
  }
  shouldUseBrowserDatePicker(params) {
    if (params.filterParams && params.filterParams.browserDatePicker != null) {
      return params.filterParams.browserDatePicker;
    }
    return isBrowserChrome() || isBrowserFirefox() || isBrowserSafari() && getSafariVersion() >= 14.1;
  }
}
__decorate([RefSelector('eDateInput')], DefaultDateComponent.prototype, "eDateInput", void 0);