import z from 'zod';

const ZKind = z.ZodFirstPartyTypeKind;

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

export const zStringOrArray = z.string().or(z.array(z.string()));

function isZodOptional(value: any): value is z.ZodOptional<any> {
  return (
    typeof value === 'object' && value._def?.typeName === ZKind.ZodOptional
  );
}

function isZodDefault(value: any): value is z.ZodDefault<any> {
  return typeof value === 'object' && value._def?.typeName === ZKind.ZodDefault;
}

function isZodArray(value: any): value is z.ZodArray<any> {
  return typeof value === 'object' && value._def?.typeName === ZKind.ZodArray;
}

export function getTerminalType(
  schema: z.ZodTypeAny,
): z.ZodTypeAny | undefined {
  const typeName = schema._def?.typeName;
  if (!typeName) {
    return;
  }
  const queue = [schema];

  let zTA: z.ZodTypeAny | undefined;
  while (queue.length) {
    zTA = queue.shift()!;
    if (isZodOptional(zTA) || isZodDefault(zTA)) {
      queue.push(zTA._def.innerType);
    } else if (isZodArray(zTA)) {
      queue.push(zTA.element);
    }
  }
  return zTA;
}
