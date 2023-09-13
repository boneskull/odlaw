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

export type Compact<T> = {
  [K in keyof Required<T> as Pick<T, K> extends Required<Pick<T, K>>
    ? K
    : never]: T[K];
};
