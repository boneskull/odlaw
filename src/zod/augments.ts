/**
 * Contains module augmentation for `zod`'s `ZodType` abstract class.
 *
 * See `zodtype.ts` for the implementation.
 * @packageDocumentation
 */

/* eslint-disable no-use-before-define */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type {Exact} from 'type-fest';
import type * as y from 'yargs';
import type z from 'zod';
import type {ExpandDeep} from '../util';
import type {
  OdCommand,
  ShapeToOdOptions,
  ZodObjectToYargsOptionsRecord,
} from './command';
import type {
  DynamicOdOptions,
  OdOptionsType,
  YargsType,
  YargsifyOdOptions,
} from './option';
import type {kOd} from './zodtype';

declare module 'zod' {
  /**
   * New methods for `ZodType` (most every class in `zod`)
   */
  interface ZodType<
    Output = any,
    Def extends z.ZodTypeDef = z.ZodTypeDef,
    Input = Output,
  > {
    /**
     * This is _also_ explicitly on the `prototype` of every supported `ZodType` subclass
     * @internal
     */
    [kOd]: true;

    /**
     * The equivalent yargs type, if this `ZodType` subclass is supported.
     * @internal
     */
    _yargsType: YargsType<Input>;

    /**
     * Set options on a `ZodType` via object instead of fluent interface
     * @param config Options object
     */
    option<DOO extends Exact<DynamicOdOptions, DOO>>(
      config?: DOO,
    ): OdOptionsType<this, DOO>;

    /**
     * Set Yargs' `global` flag for this `ZodType`
     */
    global(): OdOptionsType<this, {global: true}>;

    /**
     * Set Yargs' `hidden` flag for this `ZodType`
     */
    hidden(): OdOptionsType<this, {hidden: true}>;

    /**
     * Set Yargs' `deprecated` flag (or message) for this `ZodType`
     */
    deprecated<M extends string | boolean>(
      message?: M,
    ): OdOptionsType<this, {deprecated: M}>;

    /**
     * Set Yargs' `defaultDescription` `string` for this `ZodType`
     */
    defaultDescription<M extends string>(
      defaultDescription?: M,
    ): OdOptionsType<this, {defaultDescription: M}>;

    /**
     * Set Yargs' `group` `string` for this `ZodType`; used in help text only
     * @param group Display group
     */
    group<G extends string>(group: G): OdOptionsType<this, {group: G}>;

    /**
     * Change this `ZodType` into Yargs' "count" type
     */
    count(): OdOptionsType<this, {count: true}>;

    /**
     * Set Yargs' `demandOption` flag; require this option to be provided.
     *
     * Recommended to avoid for ergonomics; use a positional instead.
     */
    demandOption(): OdOptionsType<this, {demandOption: true}>;

    /**
     * Set Yargs' `nargs` value for this `ZodType` (i.e., "number of expected
     * arguments").
     *
     * Assumption (could be very wrong): The default value is `1` for `string` or
     * `number` Yargs types, `0` for `boolean` types, and `Infinity` for array types.
     * @param nargs
     */
    nargs(nargs: number): OdOptionsType<this, {nargs: number}>;

    /**
     * Set Yargs' `normalize` flag for this `ZodType`. Only applies to `string`
     * yargs types (`ZodString`, `ZodArray<ZodString>`, `ZodEnum`)
     */

    normalize(): OdOptionsType<this, {normalize: true}>;

    /**
     * Provide aliases for this `ZodType`; usually of the "shorthand"
     * single-character variety
     * @param alias Alias or aliases
     */
    alias<A extends string | readonly string[]>(
      alias: A,
    ): OdOptionsType<this, {alias: A}>;

    /**
     * Generate the object which will be passed to `yargs.options()` for this `ZodType`.
     *
     * This function is expected to be called within the context of a parent
     * `ZodObject`. That `ZodObject` may be called with `.strict()`, and if so,
     * the `strict` parameter would be `true` here.
     *
     * @internal
     */
    _toYargsOptions<Strict extends boolean>(
      strict: Strict,
    ): ExpandDeep<YargsifyOdOptions<this, {demandOption: Strict}>>;

    /**
     * Generate a mapping of option name to `yargs.options()` object for this
     * `ZodObject`.
     *
     * This will call {@linkcode _toYargsOptions} on each property of the
     * `ZodObject`'s `shape`.
     *
     * @internal
     */
    _toYargsOptionsRecord(): this extends z.AnyZodObject
      ? ExpandDeep<ZodObjectToYargsOptionsRecord<this>>
      : never;
  }

  /**
   * New methods on `ZodObject` subclasses
   */
  interface ZodObject<
    T extends z.ZodRawShape,
    UnknownKeys extends z.UnknownKeysParam = z.UnknownKeysParam,
    Catchall extends z.ZodTypeAny = z.ZodTypeAny,
    Output = z.objectOutputType<T, Catchall, UnknownKeys>,
    Input = z.objectInputType<T, Catchall, UnknownKeys>,
  > {
    command(
      command: string | readonly string[],
      description: string,
    ): OdCommand<T, UnknownKeys, Catchall, Output, Input>;

    middlewares<M extends y.MiddlewareFunction<ShapeToOdOptions<T>>[]>(
      middlewares: M,
    ): OdCommand<T, UnknownKeys, Catchall, Output, Input, {middlewares: M}>;
  }

  const command: typeof OdCommand.create;
}
