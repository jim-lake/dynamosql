const BARE_SPECIFIER = 'node-sql-parser';

function checkSource(context, node) {
  if (node.source?.value === BARE_SPECIFIER) {
    context.report({
      node: node.source,
      message: `Import from 'node-sql-parser/build/mysql' instead of '${BARE_SPECIFIER}'`,
    });
  }
}

export const noBareNodeSqlParserRule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        "Disallow importing from the bare 'node-sql-parser' specifier; use 'node-sql-parser/build/mysql'",
    },
    schema: [],
  },

  create(context) {
    return {
      ImportDeclaration(node) {
        checkSource(context, node);
      },
      ExportNamedDeclaration(node) {
        checkSource(context, node);
      },
      ExportAllDeclaration(node) {
        checkSource(context, node);
      },
    };
  },
};
