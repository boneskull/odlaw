/**
 * General-purpose utilities
 *
 * @packageDocumentation
 */

import z from 'zod';

const {ZodFirstPartyTypeKind: ZKind} = z;

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

/**
 * Type guard for {@link z.ZodOptional}
 *
 * @param value - Any value
 * @returns `true` if `value` is a `ZodOptional`
 */
export function isZodOptional(value: any): value is z.ZodOptional<any> {
  return (
    typeof value === 'object' && value._def?.typeName === ZKind.ZodOptional
  );
}

/**
 * Type guard for {@link z.ZodDefault}
 *
 * @param value - Any value
 * @returns `true` if `value` is a `ZodDefault`
 */
export function isZodDefault(value: any): value is z.ZodDefault<any> {
  return typeof value === 'object' && value._def?.typeName === ZKind.ZodDefault;
}

/**
 * Type guard for {@link z.ZodArray}
 *
 * @param value - Any value
 * @returns `true` if `value` is a `ZodArray`
 */
export function isZodArray(value: any): value is z.ZodArray<any> {
  return typeof value === 'object' && value._def?.typeName === ZKind.ZodArray;
}

/**
 * Returns the terminal Zod type of a schema.
 *
 * This is needed for certain Zod types that wrap other types, such as
 * {@link z.ZodOptional}
 *
 * @remarks
 * This could have been recursive, but JavaScript & recursion don't mix well
 * @param schema - Any Zod schema
 * @returns The terminal Zod type of the schema
 * @todo Add support for {@link z.ZodUnion}, {@link z.ZodEffect}, etc.
 */
export function getTerminalZodType(
  schema: z.ZodTypeAny,
): z.ZodTypeAny | undefined {
  const typeName = schema._def?.typeName;
  if (!typeName) {
    // I'm unsure if this is actually possible, since `ZodTypeDef` does not have
    // a `typeName` prop, but all of the type-specific `ZodTypeDef`s do.
    /* istanbul ignore next */
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
