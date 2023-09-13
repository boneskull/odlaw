import {PickIndexSignature} from 'type-fest';
import type * as y from 'yargs';
import z from 'zod';
import type {ExpandDeep} from '../util';

export type OdSupportedBaseType =
  | z.ZodBoolean
  | z.ZodString
  | z.ZodNumber
  | z.ZodEnum<any>
  | z.ZodArray<any>
  | z.ZodOptional<any>;

export type OdSupportedType = OdSupportedBaseType;

export type OdSupportedTypeName = OdSupportedType['_def']['typeName'];

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
 * Subset of {@linkcode y.Options}
 *
 * These are the options for yargs' `option()` method which the consumer can
 * specify _and_  which Zod has no analogue.
 *
 * Two caveats:
 *
 * 1. Notably omitted is {@linkcode y.Options.type type}, which is inferred
 *    from the Zod type.
 * 2. {@linkcode y.Options.demandOption demandOption} _can_ be set via
 *    `zod.option()` but it better determined by the enclosing `ZodObject`'s
 *    `strict` setting.  A `ZodObject` is how we get a set of options, after
 *    all.
 */
export type OdOptions = Pick<
  y.Options,
  | 'alias'
  | 'count'
  | 'defaultDescription'
  | 'demandOption'
  | 'deprecated'
  | 'describe'
  | 'global'
  | 'group'
  | 'hidden'
  | 'nargs'
  | 'normalize'
>;

export type IsSupported<T extends z.ZodTypeAny> =
  T['_def']['typeName'] extends OdSupportedTypeName ? T : never;

export type ShapeToOdOptions<S extends z.ZodRawShape> =
  // if this is true then `S` is `ZodRawShape` proper and does not "extend" it.
  // this means no options are defined, so we don't care what someone does with
  // it later in e.g., middleware.
  PickIndexSignature<S> extends S
    ? Record<string, any>
    : {
        [K in keyof S]: S[K] extends z.ZodOptional<IsSupported<infer T>>
          ? Yargsify<T, {demandOption: false}>
          : S[K] extends IsSupported<S[K]>
          ? Yargsify<S[K], {demandOption: true}>
          : never;
      };

/**
 * The equivalent of {@linkcode y.Options.type} based on the `Input` of `ZodType`.
 * @typeParam SomeType - The `Input` of a `ZodType`; could be literally anything, but only a few types are supported by Yargs; see
 */
export interface YargsType<SomeType> {
  type: InputToYargsType<NonNullable<SomeType>>;
}

export type Yargsify<
  T extends z.ZodTypeAny,
  DOO extends OdOptions,
> = ExpandDeep<T extends {_yargsType: infer U} ? U & DOO : never>;

function assertValidInnerType(t: OdSupportedType) {
  if (!getYargsType(t)) {
    throw new TypeError(`Unsupported method call in ${t._def.typeName}`);
  }
}

/**
 * This object is grafted onto {@linkcode z.ZodType} subclasses which can be
 * used as Yargs options.
 */
export const OdOptionZodType = {
  alias(this: OdSupportedType, alias: string | string[]) {
    return this.option({alias});
  },

  global(this: OdSupportedType) {
    return this.option({global: true});
  },

  hidden(this: OdSupportedType) {
    return this.option({hidden: true});
  },

  defaultDescription(this: OdSupportedType, defaultDescription: string) {
    return this.option({defaultDescription});
  },

  group(this: OdSupportedType, group: string) {
    return this.option({group});
  },

  count(this: OdSupportedType) {
    return this.option({count: true});
  },

  normalize(this: OdSupportedType) {
    return this.option({normalize: true});
  },

  nargs(this: OdSupportedType, nargs: number) {
    return this.option({nargs});
  },

  demandOption(this: OdSupportedType) {
    return this.option({demandOption: true});
  },

  option(this: OdSupportedType, config?: OdOptions): OdSupportedType {
    assertValidInnerType(this);
    const This = (this as any).constructor;
    return new This({
      ...this._def,
      odOptions: {...this._def.odOptions, ...config},
    }) as any;
  },

  _toYargsOptions(this: OdSupportedType): y.Options {
    assertValidInnerType(this);
    return {
      ...this._yargsType,
      ...this._def.odOptions,
      describe: this.description || this._def.odOptions?.describe,
    };
  },
};

/**
 * Returns the equivalent Yargs type for a given `ZodType`.
 *
 * This cannot be a `get _yargsType` on the class because it _must_ be
 * `configurable` if we have any hope of undoing the damage done by
 * `monkeypatch()`.
 */
Object.defineProperty(OdOptionZodType, '_yargsType', {
  get() {
    return getYargsType(this);
  },
  configurable: true,
  enumerable: false,
});

/**
 * Translates a Yargs-options-supporting `ZodType` into the equivalent Yargs
 * type, or `undefined` if the `ZodType` is unsupported.
 */
export function getYargsType<T extends z.ZodTypeAny>(
  schema: T,
): {type: y.Options['type']} | undefined {
  switch (schema._def?.typeName) {
    case z.ZodFirstPartyTypeKind.ZodBoolean:
      return {type: 'boolean'};
    case z.ZodFirstPartyTypeKind.ZodString:
    case z.ZodFirstPartyTypeKind.ZodEnum:
      return {type: 'string'};
    case z.ZodFirstPartyTypeKind.ZodNumber:
      return {type: 'number'};
    case z.ZodFirstPartyTypeKind.ZodArray:
      return getYargsType(schema._def.type);
    case z.ZodFirstPartyTypeKind.ZodOptional:
      return getYargsType(schema._def.innerType);
  }
}
