export type Expand<T> = T extends object
  ? T extends infer O
    ? {[K in keyof O]: O[K]}
    : never
  : T;

export type ExpandDeep<T> = T extends object
  ? T extends infer O
    ? {[K in keyof O]: ExpandDeep<O[K]>}
    : never
  : T;

export function expand<T>(obj: T): Expand<T> {
  return obj as Expand<T>;
}

export function expandDeep<T>(obj: T): ExpandDeep<T> {
  return obj as ExpandDeep<T>;
}

export type NonEmptyString<T extends string> = '' extends T ? never : T;
