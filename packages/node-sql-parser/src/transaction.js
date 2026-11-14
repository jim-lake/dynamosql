import { hasVal, identifierToSql, literalToSQL, toUpper } from './util'

function transactionToSQL(stmt) {
  const { expr: { action, keyword, modes, savepoint } } = stmt
  const result = [literalToSQL(action), toUpper(keyword)]
  const actionName = String(action.value).toLowerCase()
  if (actionName === 'release') result.push('SAVEPOINT')
  if (actionName === 'rollback' && savepoint) result.push('TO SAVEPOINT')
  if (savepoint) result.push(identifierToSql(savepoint))
  if (modes) result.push(modes.map(literalToSQL).join(', '))
  return result.filter(hasVal).join(' ')
}

export {
  transactionToSQL,
}
