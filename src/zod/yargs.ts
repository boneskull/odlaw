import z from 'zod';
import {getTerminalType} from '../util';

/**
 * Various flavors of string types supported by Yargs
 */
export type OdInputString =
  | string
  | [string, ...string[]]
  | string[]
  | readonly string[]
  | readonly [string, ...string[]];

export type InputToYargsType<Input> = Input extends boolean
  ? 'boolean'
  : Input extends number
  ? 'number'
  : Input extends OdInputString
  ? 'string'
  : never;

/**
 * The equivalent of {@link y.Options.type} based on the `Input` of `ZodType`.
 *
 * @typeParam Input - The `Input` of a `ZodType`; could be literally anything,
 *   but only a few types are supported by Yargs
 */
export interface YargsType<Input> {
  type: InputToYargsType<NonNullable<Input>>;
}

/**
 * Translates a Yargs-options-supporting `ZodType` into the equivalent Yargs
 * type, or `undefined` if the `ZodType` is unsupported.
 *
 * @param schema - Zod schema to convert
 * @returns Object containing `type` property with the equivalent Yargs type, or
 *   `undefined` if the `ZodType` is unsupported
 */
export function getYargsType<T extends z.ZodTypeAny>(
  schema: T,
): {type: InputToYargsType<z.input<T>>} | undefined {
  const innerType = getTerminalType(schema);

  switch (innerType?._def?.typeName) {
    case z.ZodFirstPartyTypeKind.ZodBoolean:
      return {type: 'boolean'} as any;
    case z.ZodFirstPartyTypeKind.ZodString:
    case z.ZodFirstPartyTypeKind.ZodEnum:
      return {type: 'string'} as any;
    case z.ZodFirstPartyTypeKind.ZodNumber:
      return {type: 'number'} as any;
  }
}

export type HasYargsType<T extends z.ZodTypeAny> = T extends {_yargsType: any}
  ? true
  : false;
