export const localSnakeCaseRule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce snake_case for local variables only, ignoring top-level, exports, globals, and excluded patterns',
    },
    schema: [
      {
        type: 'object',
        properties: {
          exclude: {
            type: 'array',
            description:
              'Array of objects with a .test(string) method to ignore',
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {};
    const excludePatterns = options.exclude || [];

    return {
      VariableDeclarator(node) {
        // only Identifier (ignore destructuring)
        if (node.id.type !== 'Identifier') return;
        const name = node.id.name;
        if (!name) return;

        // ignore top-level variables, exports
        const parentType = node.parent.parent.type;
        const isLocal =
          parentType !== 'Program' &&
          parentType !== 'ExportNamedDeclaration' &&
          parentType !== 'ExportDefaultDeclaration';

        if (!isLocal) return; // skip non-locals

        // skip excluded patterns
        if (excludePatterns.some((rx) => rx.test(name))) return;

        // enforce snake_case
        if (!/^[a-z][a-z0-9_]*$/.test(name)) {
          context.report({
            node: node.id,
            message: `Local variable "${name}" must be snake_case`,
          });
        }
      },
    };
  },
};
