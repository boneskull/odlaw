import {Exact} from 'type-fest';
import type * as y from 'yargs';
import z from 'zod';
import type {ExpandDeep} from '../util';
import {OdOption} from './od';

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

/**
 * The input types which translate to Yargs options.
 *
 * Notably, `array` and `count` are absent from this list; they are handled via `array: true` and `count: true`, respectively. Yargs will _change the type_ of any option having `count: true` to `number`.
 */
export type OdInput = boolean | number | OdInputString;

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
export type DynamicOdOptions = Pick<
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

export type ShapeToOdOptions<S extends z.ZodRawShape> = {
  [K in keyof S]: S[K] extends z.ZodOptional<
    infer T extends OdSupportedBaseType
  >
    ? YargsifyOdOptions<T, {demandOption: false}>
    : S[K] extends OdSupportedBaseType
    ? YargsifyOdOptions<S[K], {demandOption: true}>
    : never;
};

export type ZodObjectToYargsOptionsRecord<T extends z.AnyZodObject> =
  ShapeToOdOptions<T['shape']>;

/**
 * Merges some {@linkcode DynamicOdOptions} with {@linkcode OdOptions} (from {@linkcode OdOption._def.odOptions}).
 * @typeParam OO - The {@linkcode OdOptions} to merge "into"
 * @typeParam DOO - The {@linkcode DynamicOdOptions} to merge "from"; **must not include extra properties**.
 */
export type MergeOdOpts<
  OO extends OdOptions<any>,
  DOO extends Exact<DynamicOdOptions, DOO>,
> = import('type-fest/source/merge').SimpleMerge<OO, DOO>;

/**
 * Option config from {@linkcode YOptions yargs.Options} which cannot be expressed via Zod itself
 */
export type OdOptions<
  T extends OdSupportedType,
  DOO extends Exact<DynamicOdOptions, DOO> = DynamicOdOptions,
> = T['_input'] extends OdInput
  ? MergeOdOpts<T['_yargsType'], DOO>
  : T['_yargsType'];

/**
 * The equivalent of {@linkcode y.Options.type} based on the `Input` of `ZodType`.
 * @typeParam SomeType - The `Input` of a `ZodType`; could be literally anything, but only a few types are supported by Yargs; see
 */
export interface YargsType<SomeType> {
  type: InputToYargsType<NonNullable<SomeType>>;
}

export type OdOptionsType<
  T extends z.ZodTypeAny,
  DOO extends Exact<DynamicOdOptions, DOO>,
> = T extends OdOption<any>
  ? OdOption<
      T['_odInnerType'],
      ExpandDeep<MergeOdOpts<T['_def']['odOptions'], DOO>>
    >
  : T['_def']['typeName'] extends OdSupportedTypeName
  ? OdOption<T, ExpandDeep<DOO>>
  : never;

export type YargsifyOdOptions<
  T extends z.ZodTypeAny,
  DOO extends DynamicOdOptions,
> = ExpandDeep<
  T extends OdOption<any>
    ? T['_odInnerType']['_yargsType'] & T['_def']['odOptions'] & DOO
    : T extends OdSupportedType
    ? T['_yargsType'] & DOO
    : never
>;

/**
 * This class' `prototype` is grafted onto {@linkcode z.ZodType} and represents
 * everything in the module augmentation of {@linkcode z.ZodType}.
 */
export abstract class OdOptionZodType {
  alias(this: OdSupportedType, alias: string | string[]) {
    return this.option({alias});
  }

  global(this: OdSupportedType) {
    return this.option({global: true});
  }

  hidden(this: OdSupportedType) {
    return this.option({hidden: true});
  }

  defaultDescription(this: OdSupportedType, defaultDescription: string) {
    return this.option({defaultDescription});
  }

  group(this: OdSupportedType, group: string) {
    return this.option({group});
  }

  count(this: OdSupportedType) {
    return this.option({count: true});
  }

  normalize(this: OdSupportedType) {
    return this.option({normalize: true});
  }

  nargs(this: OdSupportedType, nargs: number) {
    return this.option({nargs});
  }

  demandOption(this: OdSupportedType) {
    return this.option({demandOption: true});
  }
  option(this: OdSupportedType, config?: DynamicOdOptions) {
    return this instanceof OdOption
      ? this._cloneWith(config)
      : new OdOption({odOptions: {...config}, innerType: this});
  }
  _toYargsOptions(this: OdSupportedType): y.Options {
    if (this instanceof OdOption) {
      return {
        ...this._yargsType,
        ...this._def.odOptions,
        demandOption: this._def.odOptions.demandOption === true,
        describe: this.description,
      };
    }
    return {
      ...this._yargsType,
      describe: this.description,
    };
  }
}

/**
 * Returns the equivalent Yargs type for a given `ZodType`.
 *
 * This cannot be a `get _yargsType` on the class because it _must_ be `configurable`.
 */
Object.defineProperties(OdOptionZodType.prototype, {
  _yargsType: {
    get() {
      return getYargsType(this);
    },
    configurable: true,
    enumerable: false,
  },
});

export function getYargsType<T extends z.ZodTypeAny>(
  schema: T,
): {type: y.Options['type']} | undefined {
  if (schema instanceof OdOption) {
    return getYargsType(schema._odInnerType);
  }
  switch (schema._def?.typeName) {
    case z.ZodFirstPartyTypeKind.ZodBoolean:
      return {type: 'boolean'};
    case z.ZodFirstPartyTypeKind.ZodString:
    case z.ZodFirstPartyTypeKind.ZodEnum:
      return {type: 'string'};
    case z.ZodFirstPartyTypeKind.ZodNumber:
      return {type: 'number'};
    case z.ZodFirstPartyTypeKind.ZodArray:
      if (
        schema._def.innerType._def.typeName ===
        z.ZodFirstPartyTypeKind.ZodString
      ) {
        return {type: 'string'};
      }
      break;
    case z.ZodFirstPartyTypeKind.ZodOptional:
      return getYargsType(schema._def.innerType);
  }
}
