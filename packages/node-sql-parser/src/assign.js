import { exprToSQL } from './expr'
import { hasVal, toUpper } from './util'

function assignToSQL(expr) {
  /** @type {Object} */
  const { left, right, symbol, keyword, parentheses } = expr
  left.keyword = keyword
  const leftVar = exprToSQL(left)
  const rightVal = exprToSQL(right)
  const str = [leftVar, toUpper(symbol), rightVal].filter(hasVal).join(' ')
  return parentheses ? `(${str})` : str
}

export {
  assignToSQL,
}
