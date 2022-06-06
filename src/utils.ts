export function invoke<T>(fn: () => T): T | void {
  try {
    return fn();
  } catch (e) {
    console.error(e);
  }
}
