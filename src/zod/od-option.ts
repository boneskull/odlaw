import type {Exact} from 'type-fest';
import type * as y from 'yargs';
import z from 'zod';
import type {Compact} from '../util';
import type {OdPositionalOptions, PositionalZodType} from './od-command';
import {getYargsType, type HasYargsType, type YargsType} from './yargs';

type LooseSupportedOptionType =
  | z.ZodBoolean
  | z.ZodString
  | z.ZodNumber
  | z.ZodEnum<any>
  | z.ZodArray<any, any>
  | z.ZodOptional<any>
  | z.ZodDefault<any>;

/**
 * Subset of {@link y.Options}
 *
 * These are the options for yargs' `option()` method which the consumer can
 * specify _and_ which Zod has no analogue.
 *
 * Two caveats:
 *
 * 1. Notably omitted is {@link y.Options.type}, which is inferred from the Zod
 *    type.
 * 2. {@link y.Options.demandOption | demandOption} _can_ be set via `zod.option()`
 *    but it better determined by the enclosing `ZodObject`'s `strict` setting.
 *    A `ZodObject` is how we get a set of options, after all.
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

export type ShapeToOdOptions<S extends z.ZodRawShape> = z.ZodRawShape extends S
  ? Record<string, any>
  : {
      [K in keyof S]: Yargsify<S[K]>;
    };

export type Yargsify<
  T extends z.ZodTypeAny,
  EOO extends Exact<OdOptions, EOO> | void = void,
> = HasYargsType<T> extends true
  ? YargsType<z.input<T>> & T['_def']['odOptions'] & EOO extends infer U
    ? Compact<U>
    : never
  : never;

export type ExtendOdOptions<
  T extends z.ZodTypeAny,
  EOO extends Exact<OdOptions, EOO>,
> = HasYargsType<T> extends true
  ? T & {_def: T['_def'] & {odOptions: T['_def']['odOptions'] & EOO}}
  : never;

export type ExtendOdPositionalOptions<
  T extends z.ZodTypeAny,
  EOO extends Exact<OdPositionalOptions, EOO>,
> = HasYargsType<T> extends true
  ? T & {_def: T['_def'] & {odOptions: T['_def']['odPositionalOptions'] & EOO}}
  : never;

/**
 * Asserts the given `ZodType` can be used as a Yargs option.
 *
 * @param schema - Any `ZodType`
 * @throws {TypeError} If the `ZodType` cannot be used as a Yargs option
 * @internal
 */
function assertValidInnerType(schema: z.ZodTypeAny) {
  if (!getYargsType(schema)) {
    throw new TypeError(`Unsupported method call in ${schema._def.typeName}`);
  }
}

/**
 * This object is grafted onto {@link z.ZodType} subclasses which can be used as
 * Yargs options.
 */
export const OdOptionZodType = {
  /**
   * Provide aliases for this `ZodType`; usually of the "shorthand"
   * single-character variety
   *
   * @param alias - Alias or aliases
   * @returns New `ZodType` (as Yargs option) with the given alias(es)
   */
  alias(this: LooseSupportedOptionType, alias: string | string[]) {
    return this.option({alias});
  },

  /**
   * Set Yargs' `global` flag for this `ZodType`
   *
   * @returns New `ZodType` (as Yargs option) with the `global` flag set
   */
  global(this: LooseSupportedOptionType) {
    return this.option({global: true});
  },

  /**
   * Set Yargs' `hidden` flag for this `ZodType`
   *
   * @returns New `ZodType` (as Yargs option) with the `hidden` flag set
   */
  hidden(this: LooseSupportedOptionType) {
    return this.option({hidden: true});
  },

  /**
   * Set Yargs' `defaultDescription` `string` for this `ZodType`
   *
   * @param defaultDescription - Description of default value
   * @returns New `ZodType` (as Yargs option) with the `defaultDescription` set
   */
  defaultDescription(
    this: LooseSupportedOptionType,
    defaultDescription: string,
  ) {
    return this.option({defaultDescription});
  },

  /**
   * Set Yargs' `group` `string` for this `ZodType`
   *
   * @param group - Group name (as displayed in help text)
   * @returns New `ZodType` (as Yargs option) with the `group` set
   */
  group(this: LooseSupportedOptionType, group: string) {
    return this.option({group});
  },

  /**
   * Set Yargs' `count` flag for this `ZodType`
   *
   * @returns New `ZodType` (as Yargs option) with the `count` flag set
   */
  count(this: LooseSupportedOptionType) {
    return this.option({count: true});
  },

  /**
   * Set Yargs' `normalize` flag for this `ZodType`
   *
   * @returns New `ZodType` (as Yargs option) with the `normalize` flag set
   */
  normalize(this: LooseSupportedOptionType) {
    return this.option({normalize: true});
  },

  /**
   * Set Yargs' `nargs` number for this `ZodType`
   *
   * @param nargs - Number of arguments
   * @returns New `ZodType` (as Yargs option) with the `nargs` set
   */
  nargs(this: LooseSupportedOptionType, nargs: number) {
    return this.option({nargs});
  },

  /**
   * Set Yargs' `demandOption` flag for this `ZodType`.
   *
   * Can be set without impacting the schema validation otherwise.
   *
   * @param message - An optional message to display if the option is missing
   * @returns New `ZodType` (as Yargs option) with the `demandOption` flag set
   */
  demandOption(this: LooseSupportedOptionType, message?: string) {
    return this.option({
      demandOption: message && typeof message === 'string' ? message : true,
    });
  },

  /**
   * Set all of the options for this `ZodType` at once.
   *
   * @param config - Options to set
   * @returns New `ZodType` (as Yargs option) with the given options set
   */
  option(this: LooseSupportedOptionType, config?: OdOptions) {
    assertValidInnerType(this);
    const This = (this as any).constructor;
    return new This({
      ...this._def,
      odOptions: {...this._def.odOptions, ...config},
    }) as any;
  },

  /**
   * Converts the option metadata in this `ZodType` to the equivalent Yargs
   * options
   *
   * @returns Yargs options, with the description pulled from either the
   *   metadata or from the Zod schema itself
   * @throws If this `ZodType` wraps another and the inner type is unsupported
   */
  _toYargsOptions(this: LooseSupportedOptionType): y.Options {
    assertValidInnerType(this);
    return {
      ...this._yargsType,
      ...this._def.odOptions,
      describe: this.description || this._def.odOptions?.describe,
    };
  },

  /**
   * Set all of the _positional_ options for this `ZodType` at once
   *
   * @param config - Positional options to stuff in the schema's metadata
   * @returns New `ZodType` (as Yargs option) with the given positional options
   *   set
   */
  _assignPositionalOptions<OPO extends OdPositionalOptions>(
    this: PositionalZodType,
    config: OPO,
  ) {
    const This = (this as any).constructor;
    return new This({
      ...this._def,
      odPositionalOptions: {...this._def.odPositionalOptions, ...config},
    }) as any;
  },
} as const;

/**
 * Returns the equivalent Yargs type for a given `ZodType`.
 *
 * This cannot be a `get _yargsType` on the class because it _must_ be
 * `configurable` if we have any hope of undoing the damage done by
 * `monkeypatch()`.
 *
 * @internal
 */
Object.defineProperty(OdOptionZodType, '_yargsType', {
  get() {
    return getYargsType(this);
  },
  configurable: true,
  enumerable: false,
});
