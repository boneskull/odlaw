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

function assertValidInnerType(t: z.ZodTypeAny) {
  if (!getYargsType(t)) {
    throw new TypeError(`Unsupported method call in ${t._def.typeName}`);
  }
}

/**
 * This object is grafted onto {@linkcode z.ZodType} subclasses which can be
 * used as Yargs options.
 */
export const OdOptionZodType = {
  alias(this: LooseSupportedOptionType, alias: string | string[]) {
    return this.option({alias});
  },

  global(this: LooseSupportedOptionType) {
    return this.option({global: true});
  },

  hidden(this: LooseSupportedOptionType) {
    return this.option({hidden: true});
  },

  defaultDescription(
    this: LooseSupportedOptionType,
    defaultDescription: string,
  ) {
    return this.option({defaultDescription});
  },

  group(this: LooseSupportedOptionType, group: string) {
    return this.option({group});
  },

  count(this: LooseSupportedOptionType) {
    return this.option({count: true});
  },

  normalize(this: LooseSupportedOptionType) {
    return this.option({normalize: true});
  },

  nargs(this: LooseSupportedOptionType, nargs: number) {
    return this.option({nargs});
  },

  demandOption(this: LooseSupportedOptionType, message?: string) {
    return this.option({
      demandOption: message && typeof message === 'string' ? message : true,
    });
  },

  option(this: LooseSupportedOptionType, config?: OdOptions) {
    assertValidInnerType(this);
    const This = (this as any).constructor;
    return new This({
      ...this._def,
      odOptions: {...this._def.odOptions, ...config},
    }) as any;
  },

  _toYargsOptions(this: LooseSupportedOptionType): y.Options {
    assertValidInnerType(this);
    return {
      ...this._yargsType,
      ...this._def.odOptions,
      describe: this.description || this._def.odOptions?.describe,
    };
  },

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
