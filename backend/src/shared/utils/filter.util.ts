/** Treat wildcard characters as literal search text; values remain query parameters. */
export function nameSearchPattern(search: string): string {
  return `%${search.replace(/[\\%_]/g, '\\$&')}%`;
}
