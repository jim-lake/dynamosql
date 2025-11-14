function version_comment() {
  return 'dynamosql source version';
}

function max_allowed_packet() {
  return 67108864; // 64MB, MySQL default
}

export const methods: Record<string, undefined | (() => unknown)> = {
  version_comment,
  max_allowed_packet,
};
