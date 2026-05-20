const pendingRequests = new Map<string, Promise<unknown>>();

export function deduplicateRequest<T>(
  key: string,
  factory: () => Promise<T>
): Promise<T> {
  const existing = pendingRequests.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = factory().finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
}

export function getActiveRequestCount(): number {
  return pendingRequests.size;
}