import {Exact} from 'type-fest';
import type * as y from 'yargs';
import type z from 'zod';
import type {ExpandDeep} from '../util';
import type {OdType} from './od';

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
  [K in keyof S]: S[K] extends z.ZodOptional<infer T>
    ? YargsifyOdOptions<T, {demandOption: false}>
    : YargsifyOdOptions<S[K], {demandOption: true}>;
};

export type ZodObjectToYargsOptionsRecord<T extends z.AnyZodObject> =
  ShapeToOdOptions<T['shape']>;

/**
 * Merges some {@linkcode DynamicOdOptions} with {@linkcode OdOptions} (from {@linkcode OdType._def.odOptions}).
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
  T extends z.ZodTypeAny,
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
> = T extends OdType<any>
  ? OdType<
      T['_odInnerType'],
      ExpandDeep<MergeOdOpts<T['_def']['odOptions'], DOO>>
    >
  : OdType<T, ExpandDeep<DOO>>;

export type YargsifyOdOptions<
  T extends z.ZodTypeAny,
  DOO extends DynamicOdOptions,
> = ExpandDeep<
  T extends OdType<any>
    ? T['_yargsType'] & T['_def']['odOptions'] & DOO
    : T['_yargsType'] & DOO
>;
