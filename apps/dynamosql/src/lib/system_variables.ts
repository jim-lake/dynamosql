function version_comment() {
  return 'dynamosql source version';
}

export const methods: Record<string, undefined | (() => unknown)> = {
  version_comment,
};
