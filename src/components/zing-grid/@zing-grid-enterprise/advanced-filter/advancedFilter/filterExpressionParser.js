import { JoinFilterExpressionParser } from "./joinFilterExpressionParser";
export class FilterExpressionParser {
  constructor(params) {
    this.params = params;
    this.valid = false;
  }
  parseExpression() {
    this.joinExpressionParser = new JoinFilterExpressionParser(this.params, 0);
    const i = this.joinExpressionParser.parseExpression();
    this.valid = i >= this.params.expression.length - 1 && this.joinExpressionParser.isValid();
    return this.params.expression;
  }
  isValid() {
    return this.valid;
  }
  getValidationMessage() {
    const error = this.joinExpressionParser.getValidationError();
    if (!error) {
      return null;
    }
    const {
      message,
      startPosition,
      endPosition
    } = error;
    return startPosition < this.params.expression.length ? this.params.advancedFilterExpressionService.translate('advancedFilterValidationMessage', [message, this.params.expression.slice(startPosition, endPosition + 1).trim()]) : this.params.advancedFilterExpressionService.translate('advancedFilterValidationMessageAtEnd', [message]);
  }
  getFunction() {
    const params = {
      operands: [],
      operators: [],
      evaluatorParams: []
    };
    const functionBody = `return ${this.joinExpressionParser.getFunction(params)};`;
    return {
      functionBody,
      params
    };
  }
  getAutocompleteListParams(position) {
    var _a;
    return (_a = this.joinExpressionParser.getAutocompleteListParams(position)) !== null && _a !== void 0 ? _a : {
      enabled: false
    };
  }
  updateExpression(position, updateEntry, type) {
    return this.joinExpressionParser.updateExpression(position, updateEntry, type);
  }
  getModel() {
    return this.isValid() ? this.joinExpressionParser.getModel() : null;
  }
}