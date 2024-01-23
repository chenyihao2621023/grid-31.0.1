import { ColFilterExpressionParser } from "./colFilterExpressionParser";
import { findMatch } from "./filterExpressionOperators";
import { checkAndUpdateExpression, findEndPosition, getSearchString, updateExpression } from "./filterExpressionUtils";
class OperatorParser {
  constructor(params) {
    this.params = params;
    this.operators = [];
    this.operatorStartPositions = [];
    this.operatorEndPositions = [];
    this.activeOperator = 0;
    this.validationError = null;
  }
  parseExpression(i) {
    this.operators.push('');
    this.operatorStartPositions.push(i);
    this.operatorEndPositions.push(undefined);
    const {
      expression
    } = this.params;
    while (i < expression.length) {
      const char = expression[i];
      if (char === ' ') {
        const isComplete = this.parseOperator(i - 1);
        if (isComplete) {
          this.activeOperator++;
          return i - 1;
        } else {
          this.operators[this.activeOperator] += char;
        }
      } else {
        this.operators[this.activeOperator] += char;
      }
      i++;
    }
    this.parseOperator(i - 1);
    return i;
  }
  isValid() {
    return !this.validationError && (!this.operators.length || !!this.parsedOperator);
  }
  getValidationError() {
    return this.validationError;
  }
  getFunction() {
    return this.parsedOperator === 'OR' ? '||' : '&&';
  }
  getModel() {
    return this.parsedOperator === 'OR' ? 'OR' : 'AND';
  }
  getAutocompleteListParams(position, operatorIndex) {
    let searchString;
    if (operatorIndex == null) {
      searchString = '';
    } else {
      const operator = this.operators[operatorIndex];
      const operatorEndPosition = this.operatorEndPositions[operatorIndex];
      searchString = getSearchString(operator, position, operatorEndPosition == null ? this.params.expression.length : operatorEndPosition + 1);
    }
    let entries = this.params.advancedFilterExpressionService.getJoinOperatorAutocompleteEntries();
    if (operatorIndex || operatorIndex == null && this.activeOperator) {
      entries = entries.filter(({
        key
      }) => key === this.parsedOperator);
    }
    return this.params.advancedFilterExpressionService.generateAutocompleteListParams(entries, 'join', searchString);
  }
  updateExpression(position, updateEntry, operatorIndex) {
    var _a, _b;
    let {
      expression
    } = this.params;
    const updatedValuePart = (_a = updateEntry.displayValue) !== null && _a !== void 0 ? _a : updateEntry.key;
    if (operatorIndex === 0) {
      for (let i = this.operatorEndPositions.length - 1; i > 0; i--) {
        const operatorEndPosition = this.operatorEndPositions[i];
        if (operatorEndPosition == null) {
          continue;
        }
        expression = updateExpression(expression, this.operatorStartPositions[i], operatorEndPosition, updatedValuePart).updatedValue;
      }
    }
    const startPosition = this.operatorStartPositions.length > operatorIndex ? this.operatorStartPositions[operatorIndex] : position;
    const endPosition = (_b = this.operatorEndPositions.length > operatorIndex ? this.operatorEndPositions[operatorIndex] : undefined) !== null && _b !== void 0 ? _b : findEndPosition(expression, position, true).endPosition;
    return updateExpression(expression, startPosition, endPosition, updatedValuePart, true);
  }
  getNumOperators() {
    return this.operators.length;
  }
  getLastOperatorEndPosition() {
    return this.operatorEndPositions[this.operatorEndPositions.length - 1];
  }
  parseOperator(endPosition) {
    const operator = this.operators.length > this.activeOperator ? this.operators[this.activeOperator] : '';
    const joinOperators = this.params.advancedFilterExpressionService.getExpressionJoinOperators();
    const parsedValue = findMatch(operator, joinOperators, v => v);
    if (parsedValue) {
      this.operatorEndPositions[this.activeOperator] = endPosition;
      const displayValue = joinOperators[parsedValue];
      if (this.activeOperator) {
        if (parsedValue !== this.parsedOperator) {
          if (!this.validationError) {
            this.validationError = {
              message: this.params.advancedFilterExpressionService.translate('advancedFilterValidationJoinOperatorMismatch'),
              startPosition: endPosition - operator.length + 1,
              endPosition
            };
          }
          return false;
        }
      } else {
        this.parsedOperator = parsedValue;
      }
      if (operator !== displayValue) {
        checkAndUpdateExpression(this.params, operator, displayValue, endPosition);
        this.operators[this.activeOperator] = displayValue;
      }
      return true;
    } else if (parsedValue === null) {
      return false;
    } else {
      if (!this.validationError) {
        this.validationError = {
          message: this.params.advancedFilterExpressionService.translate('advancedFilterValidationInvalidJoinOperator'),
          startPosition: endPosition - operator.length + 1,
          endPosition
        };
      }
      return true;
    }
  }
}
export class JoinFilterExpressionParser {
  constructor(params, startPosition) {
    this.params = params;
    this.startPosition = startPosition;
    this.expectingExpression = true;
    this.expectingOperator = false;
    this.expressionParsers = [];
    this.operatorParser = new OperatorParser(this.params);
    this.missingEndBracket = false;
    this.extraEndBracket = false;
  }
  parseExpression() {
    let i = this.startPosition;
    const {
      expression
    } = this.params;
    while (i < expression.length) {
      const char = expression[i];
      if (char === '(' && !this.expectingOperator) {
        const nestedParser = new JoinFilterExpressionParser(this.params, i + 1);
        i = nestedParser.parseExpression();
        this.expressionParsers.push(nestedParser);
        this.expectingExpression = false;
        this.expectingOperator = true;
      } else if (char === ')') {
        this.endPosition = i - 1;
        if (this.startPosition === 0) {
          this.extraEndBracket = true;
        }
        return i;
      } else if (char === ' ') {} else if (this.expectingExpression) {
        const nestedParser = new ColFilterExpressionParser(this.params, i);
        i = nestedParser.parseExpression();
        this.expressionParsers.push(nestedParser);
        this.expectingExpression = false;
        this.expectingOperator = true;
      } else if (this.expectingOperator) {
        i = this.operatorParser.parseExpression(i);
        this.expectingOperator = false;
        this.expectingExpression = true;
      }
      i++;
    }
    if (this.startPosition > 0) {
      this.missingEndBracket = true;
    }
    return i;
  }
  isValid() {
    return !this.missingEndBracket && !this.extraEndBracket && this.expressionParsers.length === this.operatorParser.getNumOperators() + 1 && this.operatorParser.isValid() && this.expressionParsers.every(expressionParser => expressionParser.isValid());
  }
  getValidationError() {
    const operatorError = this.operatorParser.getValidationError();
    for (let i = 0; i < this.expressionParsers.length; i++) {
      const expressionError = this.expressionParsers[i].getValidationError();
      if (expressionError) {
        return operatorError && operatorError.startPosition < expressionError.startPosition ? operatorError : expressionError;
      }
    }
    ;
    if (operatorError) {
      return operatorError;
    }
    if (this.extraEndBracket) {
      return {
        message: this.params.advancedFilterExpressionService.translate('advancedFilterValidationExtraEndBracket'),
        startPosition: this.endPosition + 1,
        endPosition: this.endPosition + 1
      };
    }
    let translateKey;
    if (this.expressionParsers.length === this.operatorParser.getNumOperators()) {
      translateKey = 'advancedFilterValidationMissingCondition';
    } else if (this.missingEndBracket) {
      translateKey = 'advancedFilterValidationMissingEndBracket';
    }
    if (translateKey) {
      return {
        message: this.params.advancedFilterExpressionService.translate(translateKey),
        startPosition: this.params.expression.length,
        endPosition: this.params.expression.length
      };
    }
    return null;
  }
  getFunction(params) {
    const hasMultipleExpressions = this.expressionParsers.length > 1;
    const expression = this.expressionParsers.map(expressionParser => expressionParser.getFunction(params)).join(` ${this.operatorParser.getFunction()} `);
    return hasMultipleExpressions ? `(${expression})` : expression;
  }
  getAutocompleteListParams(position) {
    if (this.endPosition != null && position > this.endPosition + 1) {
      return undefined;
    }
    if (!this.expressionParsers.length) {
      return this.getColumnAutocompleteListParams();
    }
    const expressionParserIndex = this.getExpressionParserIndex(position);
    if (expressionParserIndex == null) {
      if (this.params.expression[position] === '(') {
        return {
          enabled: false
        };
      }
      return this.getColumnAutocompleteListParams();
    }
    const expressionParser = this.expressionParsers[expressionParserIndex];
    const autocompleteType = expressionParser.getAutocompleteListParams(position);
    if (!autocompleteType) {
      if (expressionParserIndex < this.expressionParsers.length - 1) {
        return this.operatorParser.getAutocompleteListParams(position, expressionParserIndex);
      }
      if (this.expressionParsers.length === this.operatorParser.getNumOperators()) {
        const operatorEndPosition = this.operatorParser.getLastOperatorEndPosition();
        return operatorEndPosition == null || position <= operatorEndPosition + 1 ? this.operatorParser.getAutocompleteListParams(position, this.operatorParser.getNumOperators() - 1) : this.getColumnAutocompleteListParams();
      }
      if (this.params.expression[position - 1] === ')') {
        return {
          enabled: false
        };
      }
      return this.operatorParser.getAutocompleteListParams(position);
    }
    return autocompleteType;
  }
  updateExpression(position, updateEntry, type) {
    var _a;
    const expression = this.params.expression;
    const expressionParserIndex = this.getExpressionParserIndex(position);
    if (expressionParserIndex == null) {
      const updatedValuePart = type === 'column' ? this.params.advancedFilterExpressionService.getColumnValue(updateEntry) : (_a = updateEntry.displayValue) !== null && _a !== void 0 ? _a : updateEntry.key;
      return updateExpression(expression, this.startPosition, this.startPosition, updatedValuePart, true);
    }
    const expressionParser = this.expressionParsers[expressionParserIndex];
    const updatedExpression = expressionParser.updateExpression(position, updateEntry, type);
    if (updatedExpression == null) {
      if (type === 'column') {
        return updateExpression(expression, position, expression.length - 1, this.params.advancedFilterExpressionService.getColumnValue(updateEntry), true);
      } else if (this.endPosition != null && position > this.endPosition + 1) {
        return null;
      } else {
        return this.operatorParser.updateExpression(position, updateEntry, expressionParserIndex);
      }
    }
    return updatedExpression;
  }
  getModel() {
    if (this.expressionParsers.length > 1) {
      return {
        filterType: 'join',
        type: this.operatorParser.getModel(),
        conditions: this.expressionParsers.map(parser => parser.getModel())
      };
    } else {
      return this.expressionParsers[0].getModel();
    }
  }
  getColumnAutocompleteListParams() {
    return this.params.advancedFilterExpressionService.generateAutocompleteListParams(this.params.advancedFilterExpressionService.getColumnAutocompleteEntries(), 'column', '');
  }
  getExpressionParserIndex(position) {
    let expressionParserIndex;
    for (let i = 0; i < this.expressionParsers.length; i++) {
      const expressionParserToCheck = this.expressionParsers[i];
      if (expressionParserToCheck.startPosition > position) {
        break;
      }
      expressionParserIndex = i;
    }
    return expressionParserIndex;
  }
}