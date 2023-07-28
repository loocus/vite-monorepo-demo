/**
 * 并行执行任务
 * @param tasks 任务
 * @param max 最大并行数
 * @returns
 */
export async function runParallel<T>(tasks: (() => Promise<T>)[], max: number) {
  const executing: Promise<T>[] = [];
  const all: Promise<T>[] = [];

  for (const task of tasks) {
    const resolve = Promise.resolve().then(() => task());
    all.push(resolve);

    if (tasks.length >= max) {
      // 当进入此条件时将会限制最大并行数量，因此当一个任务执行完毕后需要将任务从执行队列中清除掉
      const exec = resolve.then((res) => {
        executing.splice(executing.indexOf(exec), 1);
        return res;
      });

      if (executing.length >= max) {
        await Promise.race(executing);
      }
    }
  }

  return Promise.all(all);
}
