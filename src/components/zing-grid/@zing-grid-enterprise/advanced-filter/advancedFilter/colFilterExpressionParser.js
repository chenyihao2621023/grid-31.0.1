import { checkAndUpdateExpression, getSearchString, updateExpression, escapeQuotes, findEndPosition, findStartPosition } from "./filterExpressionUtils";
class ColumnParser {
  constructor(params, startPosition) {
    this.params = params;
    this.startPosition = startPosition;
    this.type = 'column';
    this.valid = true;
    this.hasStartChar = false;
    this.hasEndChar = false;
    this.colName = '';
  }
  parse(char, position) {
    if (char === ColFilterExpressionParser.COL_START_CHAR && !this.colName) {
      this.hasStartChar = true;
    } else if (char === ColFilterExpressionParser.COL_END_CHAR && this.hasStartChar) {
      const isMatch = this.parseColumn(false, position);
      if (isMatch) {
        this.hasEndChar = true;
        return false;
      } else {
        this.colName += char;
      }
    } else {
      this.colName += char;
    }
    return undefined;
  }
  getDisplayValue() {
    return (this.hasStartChar ? ColFilterExpressionParser.COL_START_CHAR : '') + this.colName + (this.hasEndChar ? ColFilterExpressionParser.COL_END_CHAR : '');
  }
  getColId() {
    return this.colId;
  }
  complete(position) {
    this.parseColumn(true, position);
  }
  getValidationError() {
    var _a;
    return this.valid ? null : {
      message: this.params.advancedFilterExpressionService.translate('advancedFilterValidationInvalidColumn'),
      startPosition: this.startPosition,
      endPosition: (_a = this.endPosition) !== null && _a !== void 0 ? _a : this.params.expression.length - 1
    };
  }
  parseColumn(fromComplete, endPosition) {
    var _a;
    this.endPosition = endPosition;
    const colValue = this.params.advancedFilterExpressionService.getColId(this.colName);
    if (colValue && this.hasStartChar) {
      this.colId = colValue.colId;
      checkAndUpdateExpression(this.params, this.colName, colValue.columnName, endPosition - 1);
      this.colName = colValue.columnName;
      this.column = this.params.columnModel.getPrimaryColumn(this.colId);
      if (this.column) {
        this.baseCellDataType = (_a = this.params.dataTypeService.getBaseDataType(this.column)) !== null && _a !== void 0 ? _a : 'text';
        return true;
      }
    }
    if (fromComplete) {
      this.valid = false;
    }
    this.baseCellDataType = 'text';
    return false;
  }
}
class OperatorParser {
  constructor(params, startPosition, baseCellDataType) {
    this.params = params;
    this.startPosition = startPosition;
    this.baseCellDataType = baseCellDataType;
    this.type = 'operator';
    this.valid = true;
    this.expectedNumOperands = 0;
    this.operator = '';
  }
  parse(char, position) {
    if (char === ' ' || char === ')') {
      const isMatch = this.parseOperator(false, position - 1);
      if (isMatch) {
        return true;
      } else {
        this.operator += char;
      }
    } else {
      this.operator += char;
    }
    return undefined;
  }
  complete(position) {
    this.parseOperator(true, position);
  }
  getValidationError() {
    var _a;
    return this.valid ? null : {
      message: this.params.advancedFilterExpressionService.translate('advancedFilterValidationInvalidOption'),
      startPosition: this.startPosition,
      endPosition: (_a = this.endPosition) !== null && _a !== void 0 ? _a : this.params.expression.length - 1
    };
  }
  getDisplayValue() {
    return this.operator;
  }
  getOperatorKey() {
    return this.parsedOperator;
  }
  parseOperator(fromComplete, endPosition) {
    const operatorForType = this.params.advancedFilterExpressionService.getDataTypeExpressionOperator(this.baseCellDataType);
    const parsedOperator = operatorForType.findOperator(this.operator);
    this.endPosition = endPosition;
    if (parsedOperator) {
      this.parsedOperator = parsedOperator;
      const operator = operatorForType.operators[parsedOperator];
      this.expectedNumOperands = operator.numOperands;
      const operatorDisplayValue = operator.displayValue;
      checkAndUpdateExpression(this.params, this.operator, operatorDisplayValue, endPosition);
      this.operator = operatorDisplayValue;
      return true;
    }
    const isPartialMatch = parsedOperator === null;
    if (fromComplete || !isPartialMatch) {
      this.valid = false;
    }
    return false;
  }
}
class OperandParser {
  constructor(params, startPosition, baseCellDataType, column) {
    this.params = params;
    this.startPosition = startPosition;
    this.baseCellDataType = baseCellDataType;
    this.column = column;
    this.type = 'operand';
    this.valid = true;
    this.operand = '';
    this.validationMessage = null;
  }
  parse(char, position) {
    if (char === ' ') {
      if (this.quotes) {
        this.operand += char;
      } else {
        this.parseOperand(false, position);
        return true;
      }
    } else if (char === ')') {
      if (this.baseCellDataType === 'number' || !this.quotes) {
        this.parseOperand(false, position - 1);
        return true;
      } else {
        this.operand += char;
      }
    } else if (!this.operand && !this.quotes && (char === `'` || char === `"`)) {
      this.quotes = char;
    } else if (this.quotes && char === this.quotes) {
      this.parseOperand(false, position);
      return false;
    } else {
      this.operand += char;
    }
    return undefined;
  }
  complete(position) {
    this.parseOperand(true, position);
  }
  getValidationError() {
    var _a;
    return this.validationMessage ? {
      message: this.validationMessage,
      startPosition: this.startPosition,
      endPosition: (_a = this.endPosition) !== null && _a !== void 0 ? _a : this.params.expression.length - 1
    } : null;
  }
  getRawValue() {
    return this.operand;
  }
  getModelValue() {
    return this.modelValue;
  }
  parseOperand(fromComplete, position) {
    const {
      advancedFilterExpressionService
    } = this.params;
    this.endPosition = position;
    this.modelValue = this.operand;
    if (fromComplete && this.quotes) {
      this.valid = false;
      this.validationMessage = advancedFilterExpressionService.translate('advancedFilterValidationMissingQuote');
    } else if (this.modelValue === '') {
      this.valid = false;
      this.validationMessage = advancedFilterExpressionService.translate('advancedFilterValidationMissingValue');
    } else {
      const modelValue = advancedFilterExpressionService.getOperandModelValue(this.operand, this.baseCellDataType, this.column);
      if (modelValue != null) {
        this.modelValue = modelValue;
      }
      switch (this.baseCellDataType) {
        case 'number':
          if (this.quotes || isNaN(this.modelValue)) {
            this.valid = false;
            this.validationMessage = advancedFilterExpressionService.translate('advancedFilterValidationNotANumber');
          }
          break;
        case 'date':
        case 'dateString':
          if (modelValue == null) {
            this.valid = false;
            this.validationMessage = advancedFilterExpressionService.translate('advancedFilterValidationInvalidDate');
          }
          break;
      }
    }
  }
}
export class ColFilterExpressionParser {
  constructor(params, startPosition) {
    this.params = params;
    this.startPosition = startPosition;
    this.isAwaiting = true;
  }
  parseExpression() {
    var _a, _b;
    let i = this.startPosition;
    const {
      expression
    } = this.params;
    while (i < expression.length) {
      const char = expression[i];
      if (char === ' ' && this.isAwaiting) {} else {
        this.isAwaiting = false;
        if (!this.parser) {
          let parser;
          if (!this.columnParser) {
            this.columnParser = new ColumnParser(this.params, i);
            parser = this.columnParser;
          } else if (!this.operatorParser) {
            this.operatorParser = new OperatorParser(this.params, i, this.columnParser.baseCellDataType);
            parser = this.operatorParser;
          } else {
            this.operandParser = new OperandParser(this.params, i, this.columnParser.baseCellDataType, this.columnParser.column);
            parser = this.operandParser;
          }
          this.parser = parser;
        }
        const hasCompletedOnPrevChar = this.parser.parse(char, i);
        if (hasCompletedOnPrevChar != null) {
          if (this.isComplete()) {
            return this.returnEndPosition(hasCompletedOnPrevChar ? i - 1 : i, true);
          }
          this.parser = undefined;
          this.isAwaiting = true;
        }
      }
      i++;
    }
    (_b = (_a = this.parser) === null || _a === void 0 ? void 0 : _a.complete) === null || _b === void 0 ? void 0 : _b.call(_a, i - 1);
    return this.returnEndPosition(i);
  }
  isValid() {
    return this.isComplete() && this.columnParser.valid && this.operatorParser.valid && (!this.operandParser || this.operandParser.valid);
  }
  getValidationError() {
    var _a, _b, _c, _d, _e;
    const validationError = (_d = (_b = (_a = this.columnParser) === null || _a === void 0 ? void 0 : _a.getValidationError()) !== null && _b !== void 0 ? _b : (_c = this.operatorParser) === null || _c === void 0 ? void 0 : _c.getValidationError()) !== null && _d !== void 0 ? _d : (_e = this.operandParser) === null || _e === void 0 ? void 0 : _e.getValidationError();
    if (validationError) {
      return validationError;
    }
    const endPosition = this.params.expression.length;
    let translateKey;
    if (!this.columnParser) {
      translateKey = 'advancedFilterValidationMissingColumn';
    } else if (!this.operatorParser) {
      translateKey = 'advancedFilterValidationMissingOption';
    } else if (this.operatorParser.expectedNumOperands && !this.operandParser) {
      translateKey = 'advancedFilterValidationMissingValue';
    }
    if (translateKey) {
      return {
        message: this.params.advancedFilterExpressionService.translate(translateKey),
        startPosition: endPosition,
        endPosition
      };
    }
    return null;
  }
  getFunction(params) {
    var _a, _b;
    const colId = this.columnParser.getColId();
    const escapedColId = escapeQuotes(colId);
    const operator = (_a = this.operatorParser) === null || _a === void 0 ? void 0 : _a.getOperatorKey();
    const {
      operators,
      evaluatorParams,
      operands
    } = params;
    const operatorForColumn = this.params.advancedFilterExpressionService.getExpressionOperator(this.columnParser.baseCellDataType, operator);
    const operatorIndex = this.addToListAndGetIndex(operators, operatorForColumn);
    const evaluatorParamsForColumn = this.params.advancedFilterExpressionService.getExpressionEvaluatorParams(colId);
    const evaluatorParamsIndex = this.addToListAndGetIndex(evaluatorParams, evaluatorParamsForColumn);
    let operand;
    if (((_b = this.operatorParser) === null || _b === void 0 ? void 0 : _b.expectedNumOperands) === 0) {
      operand = '';
    } else {
      const operandIndex = this.addToListAndGetIndex(operands, this.getOperandValue());
      operand = `, params.operands[${operandIndex}]`;
    }
    return `params.operators[${operatorIndex}].evaluator(expressionProxy.getValue('${escapedColId}', node), node, params.evaluatorParams[${evaluatorParamsIndex}]${operand})`;
  }
  getAutocompleteListParams(position) {
    if (this.isColumnPosition(position)) {
      return this.getColumnAutocompleteListParams(position);
    }
    if (this.isOperatorPosition(position)) {
      return this.getOperatorAutocompleteListParams(position);
    }
    if (this.isBeyondEndPosition(position)) {
      return undefined;
    }
    return {
      enabled: false
    };
  }
  updateExpression(position, updateEntry, type) {
    var _a, _b, _c, _d, _e;
    const {
      expression
    } = this.params;
    if (this.isColumnPosition(position)) {
      return updateExpression(this.params.expression, this.startPosition, ((_a = this.columnParser) === null || _a === void 0 ? void 0 : _a.getColId()) ? this.columnParser.endPosition : findEndPosition(expression, position).endPosition, this.params.advancedFilterExpressionService.getColumnValue(updateEntry), true);
    } else if (this.isOperatorPosition(position)) {
      const baseCellDataType = this.getBaseCellDataTypeFromOperatorAutocompleteType(type);
      const hasOperand = this.hasOperand(baseCellDataType, updateEntry.key);
      const doesOperandNeedQuotes = hasOperand && this.doesOperandNeedQuotes(baseCellDataType);
      let update;
      if (((_b = this.operatorParser) === null || _b === void 0 ? void 0 : _b.startPosition) != null && position < this.operatorParser.startPosition) {
        update = updateExpression(expression, position, position, (_c = updateEntry.displayValue) !== null && _c !== void 0 ? _c : updateEntry.key, hasOperand, doesOperandNeedQuotes);
      } else {
        let endPosition;
        let empty = false;
        if ((_d = this.operatorParser) === null || _d === void 0 ? void 0 : _d.getOperatorKey()) {
          endPosition = this.operatorParser.endPosition;
        } else {
          const {
            endPosition: calculatedEndPosition,
            isEmpty
          } = findEndPosition(expression, position, true, true);
          endPosition = calculatedEndPosition;
          empty = isEmpty;
        }
        update = updateExpression(expression, findStartPosition(expression, this.columnParser.endPosition + 1, endPosition), endPosition, (_e = updateEntry.displayValue) !== null && _e !== void 0 ? _e : updateEntry.key, hasOperand, doesOperandNeedQuotes, empty);
      }
      return Object.assign(Object.assign({}, update), {
        hideAutocomplete: !hasOperand
      });
    }
    return null;
  }
  getModel() {
    const colId = this.columnParser.getColId();
    const model = {
      filterType: this.columnParser.baseCellDataType,
      colId,
      type: this.operatorParser.getOperatorKey()
    };
    if (this.operatorParser.expectedNumOperands) {
      model.filter = this.operandParser.getModelValue();
    }
    return model;
  }
  getOperandValue() {
    let operand = this.operandParser.getRawValue();
    const {
      baseCellDataType,
      column
    } = this.columnParser;
    switch (baseCellDataType) {
      case 'number':
        operand = Number(operand);
        break;
      case 'date':
      case 'dateString':
        operand = this.params.valueParserService.parseValue(column, null, operand, undefined);
        break;
    }
    if (baseCellDataType === 'dateString') {
      return this.params.dataTypeService.getDateParserFunction()(operand);
    }
    return operand;
  }
  isComplete() {
    return !!(this.operatorParser && (!this.operatorParser.expectedNumOperands || this.operatorParser.expectedNumOperands && this.operandParser));
  }
  isColumnPosition(position) {
    return !this.columnParser || this.columnParser.endPosition == null || position <= this.columnParser.endPosition + 1;
  }
  isOperatorPosition(position) {
    return !this.operatorParser || this.operatorParser.endPosition == null || position <= this.operatorParser.endPosition + 1;
  }
  isBeyondEndPosition(position) {
    return this.isComplete() && this.endPosition != null && position > this.endPosition + 1 && this.endPosition + 1 < this.params.expression.length;
  }
  returnEndPosition(returnPosition, treatAsEnd) {
    this.endPosition = treatAsEnd ? returnPosition : returnPosition - 1;
    return returnPosition;
  }
  getColumnAutocompleteListParams(position) {
    return this.params.advancedFilterExpressionService.generateAutocompleteListParams(this.params.advancedFilterExpressionService.getColumnAutocompleteEntries(), 'column', this.getColumnSearchString(position));
  }
  getColumnSearchString(position) {
    var _a, _b, _c, _d, _e;
    const columnName = (_b = (_a = this.columnParser) === null || _a === void 0 ? void 0 : _a.getDisplayValue()) !== null && _b !== void 0 ? _b : '';
    const searchString = getSearchString(columnName, position, ((_c = this.columnParser) === null || _c === void 0 ? void 0 : _c.endPosition) == null ? this.params.expression.length : this.columnParser.endPosition + 1);
    const containsStartChar = ((_d = this.columnParser) === null || _d === void 0 ? void 0 : _d.hasStartChar) && searchString.length > 0;
    const containsEndChar = ((_e = this.columnParser) === null || _e === void 0 ? void 0 : _e.hasEndChar) && searchString.length === columnName.length + 2;
    if (containsStartChar) {
      return searchString.slice(1, containsEndChar ? -1 : undefined);
    }
    return searchString;
  }
  getOperatorAutocompleteListParams(position) {
    var _a, _b, _c, _d, _e;
    const column = (_a = this.columnParser) === null || _a === void 0 ? void 0 : _a.column;
    if (!column) {
      return {
        enabled: false
      };
    }
    const baseCellDataType = this.columnParser.baseCellDataType;
    const searchString = ((_b = this.operatorParser) === null || _b === void 0 ? void 0 : _b.startPosition) != null && position < this.operatorParser.startPosition ? '' : getSearchString((_d = (_c = this.operatorParser) === null || _c === void 0 ? void 0 : _c.getDisplayValue()) !== null && _d !== void 0 ? _d : '', position, ((_e = this.operatorParser) === null || _e === void 0 ? void 0 : _e.endPosition) == null ? this.params.expression.length : this.operatorParser.endPosition + 1);
    return this.params.advancedFilterExpressionService.generateAutocompleteListParams(this.params.advancedFilterExpressionService.getOperatorAutocompleteEntries(column, baseCellDataType), `operator-${baseCellDataType}`, searchString);
  }
  getBaseCellDataTypeFromOperatorAutocompleteType(type) {
    return type === null || type === void 0 ? void 0 : type.replace('operator-', '');
  }
  hasOperand(baseCellDataType, operator) {
    var _a, _b;
    return !baseCellDataType || !operator || ((_b = (_a = this.params.advancedFilterExpressionService.getExpressionOperator(baseCellDataType, operator)) === null || _a === void 0 ? void 0 : _a.numOperands) !== null && _b !== void 0 ? _b : 0) > 0;
  }
  doesOperandNeedQuotes(baseCellDataType) {
    return baseCellDataType !== 'number';
  }
  addToListAndGetIndex(list, value) {
    const index = list.length;
    list.push(value);
    return index;
  }
}
ColFilterExpressionParser.COL_START_CHAR = '[';
ColFilterExpressionParser.COL_END_CHAR = ']';