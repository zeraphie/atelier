/**
 * A record without one of its keys, as a new object; the record itself is
 * left as it was. A map keyed by strings stays a map; an object loses the
 * one field named.
 */
export function without<T extends object, K extends keyof T & string>(
  value: T,
  key: K
): string extends K ? T : Omit<T, K> {
  const { [key]: _gone, ...rest } = value;
  return rest as string extends K ? T : Omit<T, K>;
}
