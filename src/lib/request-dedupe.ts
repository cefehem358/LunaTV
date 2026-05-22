const pendingRequests = new Map<string, Promise<unknown>>();

export function deduplicateRequest<T>(
  key: string,
  factory: () => Promise<T>,
  timeoutMs = 30000
): Promise<T> {
  const existing = pendingRequests.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error(`deduplicateRequest timeout: ${key}`)),
      timeoutMs
    )
  );

  const promise = Promise.race([factory(), timeoutPromise]).finally(() => {
    pendingRequests.delete(key);
  }) as Promise<T>;

  pendingRequests.set(key, promise);
  return promise;
}

export function getActiveRequestCount(): number {
  return pendingRequests.size;
}
