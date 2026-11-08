/** first_name → firstName, for the top-level keys of a database row. */
export const camelKeys = (row) =>
  Object.fromEntries(Object.entries(row).map(([k, v]) => [k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), v]))
