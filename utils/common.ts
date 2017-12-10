export function promisify<T>(fn: (cb: Callback<T>) => void) {
  return new Promise<T>((resolve, reject) =>
    fn((err: Error | null, res: T) => {
      if (err) {
        return reject(err);
      }

      return resolve(res);
    })
  );
}
