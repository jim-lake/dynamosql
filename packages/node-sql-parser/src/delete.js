import { columnsToSQL } from './column'
import { exprToSQL, orderOrPartitionByToSQL } from './expr'
import { limitToSQL } from './limit'
import { tablesToSQL } from './tables'
import { commonOptionConnector, hasVal, returningToSQL, toUpper } from './util'
import { withToSQL } from './with'

function deleteToSQL(stmt) {
  const { columns, from, table, where, orderby, with: withInfo, limit, returning, priority, quick, ignore, using } = stmt
  const clauses = [withToSQL(withInfo), 'DELETE', ...(priority || []).map(toUpper), toUpper(quick), toUpper(ignore)]
  const columnInfo = columnsToSQL(columns, from)
  clauses.push(columnInfo)
  if (Array.isArray(table)) {
    if (!(table.length === 1 && table[0].addition === true)) clauses.push(tablesToSQL(table))
  }
  clauses.push(commonOptionConnector('FROM', tablesToSQL, from))
  clauses.push(commonOptionConnector('USING', tablesToSQL, using))
  clauses.push(commonOptionConnector('WHERE', exprToSQL, where))
  clauses.push(orderOrPartitionByToSQL(orderby, 'order by'))
  clauses.push(limitToSQL(limit))
  clauses.push(returningToSQL(returning))
  return clauses.filter(hasVal).join(' ')
}

export {
  deleteToSQL,
}
