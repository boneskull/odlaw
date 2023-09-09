/* eslint-disable no-use-before-define */
import {SimpleMerge} from 'type-fest/source/merge';
import type * as yargs from 'yargs';
import z from 'zod';
import {ExpandDeep} from '../util';
import {OdType} from './od';

export type OdStringType =
  | string
  | [string, ...string[]]
  | string[]
  | readonly string[]
  | readonly [string, ...string[]];
export type OdInputType = boolean | number | OdStringType;

export type InputToYargsType<Input> = Input extends boolean
  ? 'boolean'
  : Input extends number
  ? 'number'
  : Input extends OdStringType
  ? 'string'
  : never;

/**
 * Subset of {@linkcode yargs.Options}
 *
 * These are the options for yargs' `option()` method which the consumer can
 * specify _and_  which Zod has no analogue.
 *
 * Two caveats:
 *
 * 1. Notably omitted is {@linkcode yargs.Options.type type}, which is inferred
 *    from the Zod type.
 * 2. {@linkcode yargs.Options.demandOption demandOption} _can_ be set via
 *    `zod.option()` but it better determined by the enclosing `ZodObject`'s
 *    `strict` setting.  A `ZodObject` is how we get a set of options, after
 *    all.
 */
export type DynamicOdOptions = Pick<
  yargs.Options,
  | 'alias'
  | 'count'
  | 'defaultDescription'
  | 'demandOption'
  | 'deprecated'
  | 'global'
  | 'group'
  | 'hidden'
  | 'nargs'
  | 'normalize'
>;
export type MergeOdOpts<
  ZO extends OdOptions<any>,
  DZO extends DynamicOdOptions,
> = SimpleMerge<ZO, Omit<DZO, 'type'>>;

/**
 * Option config from {@linkcode YOptions yargs.Options} which cannot be expressed via Zod itself
 */
export type OdOptions<
  T extends z.ZodTypeAny,
  ZO extends DynamicOdOptions = object,
> = T['_input'] extends OdInputType
  ? MergeOdOpts<T['_yargsType'], ZO>
  : T['_yargsType'];

export interface YargsType<SomeType> {
  type: InputToYargsType<NonNullable<SomeType>>;
}

export type OdOptionsType<
  T extends z.ZodTypeAny,
  ZO extends DynamicOdOptions = object,
> = T extends OdType<any> ? OdType<T['_odInnerType'], ZO> : OdType<T, ZO>;

export type YargsifyOdOptions<
  T extends z.ZodTypeAny,
  ZO extends DynamicOdOptions = object,
> = ExpandDeep<
  T extends OdType<any>
    ? T['_yargsType'] & T['_def']['odOptions'] & ZO
    : T['_yargsType'] & ZO
>;
