import { timesLimit } from './parallel_limit';

export type BatchIter<S, T> = (
  list: S[],
  i: number
) => Promise<T[]> | Promise<void>;

export async function parallelBatch<S>(
  list: S[],
  batchSize: number,
  limit: number,
  iter: BatchIter<S, void>
): Promise<void>;

export async function parallelBatch<S, T>(
  list: S[],
  batchSize: number,
  limit: number,
  iter: BatchIter<S, T>
): Promise<T[]>;

export async function parallelBatch<S, T>(
  list: S[],
  batchSize: number,
  limit: number,
  iter: BatchIter<S, T>
): Promise<T[] | void> {
  if (batchSize <= 0) {
    throw RangeError('batchSize must be >= 0');
  }
  const batch_count = Math.ceil(list.length / batchSize);
  const results: (T | undefined)[] = [];
  await timesLimit(batch_count, limit, async (i: number) => {
    const start = i * batchSize;
    const batch = list.slice(start, start + batchSize);
    const batch_result = await iter(batch, i);
    if (batch_result) {
      for (let j = 0; j < batch_result.length; j++) {
        results[i + j] = batch_result[j];
      }
    }
  });
  return results as T[];
}
