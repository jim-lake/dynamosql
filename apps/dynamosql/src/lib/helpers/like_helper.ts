export function likeToRegExp(
  pattern: string,
  caseInsensitive: boolean
): RegExp {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/%/g, '.*')
    .replace(/_/g, '.');
  return new RegExp('^' + escaped + '$', caseInsensitive ? 'i' : '');
}
