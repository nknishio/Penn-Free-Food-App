/** Short, collision-resistant-enough IDs for client-side records in the mock backend. */
export function createId(prefix = ''): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}${time}${rand}`;
}
