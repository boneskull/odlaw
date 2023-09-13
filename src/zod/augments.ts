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
import {OdCommandOptions, OdMiddleware, createOdCommand} from './od-command';
import type {
  OdOptions,
  OdSupportedType,
  ShapeToOdOptions,
  YargsType,
  Yargsify,
} from './od-option';
import type {kOd} from './register';

declare module 'zod' {
  interface ZodTypeDef {
    odOptions?: OdOptions;
  }

  interface ZodBoolean {
    /**
     * This is _also_ explicitly on the `prototype` of every supported `ZodType` subclass
     * @internal
     */
    [kOd]: true;

    /**
     * The equivalent yargs type, if this `ZodType` subclass is supported.
     * @internal
     */
    _yargsType: YargsType<boolean>;

    /**
     * Set options on a `ZodType` via object instead of fluent interface
     * @param config Options object
     */
    option<DOO extends Exact<OdOptions, DOO>>(config?: DOO): this;

    /**
     * Set Yargs' `global` flag for this `ZodType`
     */
    global(): this;

    /**
     * Set Yargs' `hidden` flag for this `ZodType`
     */
    hidden(): this;

    /**
     * Set Yargs' `deprecated` flag (or message) for this `ZodType`
     */
    deprecated<M extends string | boolean>(message?: M): this;

    /**
     * Set Yargs' `defaultDescription` `string` for this `ZodType`
     */
    defaultDescription<M extends string>(defaultDescription?: M): this;

    /**
     * Set Yargs' `group` `string` for this `ZodType`; used in help text only
     * @param group Display group
     */
    group<G extends string>(group: G): this;

    /**
     * Change this `ZodType` into Yargs' "count" type
     */
    count(): this;

    /**
     * Set Yargs' `demandOption` flag; require this option to be provided.
     *
     * Recommended to avoid for ergonomics; use a positional instead.
     */
    demandOption(): this;

    /**
     * Set Yargs' `nargs` value for this `ZodType` (i.e., "number of expected
     * arguments").
     *
     * Assumption (could be very wrong): The default value is `1` for `string` or
     * `number` Yargs types, `0` for `boolean` types, and `Infinity` for array types.
     * @param nargs
     */
    nargs(nargs: number): this;

    /**
     * Set Yargs' `normalize` flag for this `ZodType`. Only applies to `string`
     * yargs types (`ZodString`, `ZodArray<ZodString>`, `ZodEnum`)
     */

    normalize(): this;

    /**
     * Provide aliases for this `ZodType`; usually of the "shorthand"
     * single-character variety
     * @param alias Alias or aliases
     */
    alias<A extends string | readonly string[]>(alias: A): this;

    /**
     * Generate the object which will be passed to `yargs.options()` for this `ZodType`.
     *
     * This function is expected to be called within the context of a parent
     * `ZodObject`. That `ZodObject` may be called with `.strict()`, and if so,
     * the `strict` parameter would be `true` here.
     *
     * @internal
     */
    _toYargsOptions(): ExpandDeep<Yargsify<this, {demandOption?: boolean}>>;
  }

  interface ZodString {
    /**
     * This is _also_ explicitly on the `prototype` of every supported `ZodType` subclass
     * @internal
     */
    [kOd]: true;

    /**
     * The equivalent yargs type, if this `ZodType` subclass is supported.
     * @internal
     */
    _yargsType: YargsType<string>;

    /**
     * Set options on a `ZodType` via object instead of fluent interface
     * @param config Options object
     */
    option<DOO extends Exact<OdOptions, DOO>>(config?: DOO): this;

    /**
     * Set Yargs' `global` flag for this `ZodType`
     */
    global(): this;

    /**
     * Set Yargs' `hidden` flag for this `ZodType`
     */
    hidden(): this;

    /**
     * Set Yargs' `deprecated` flag (or message) for this `ZodType`
     */
    deprecated<M extends string | boolean>(message?: M): this;

    /**
     * Set Yargs' `defaultDescription` `string` for this `ZodType`
     */
    defaultDescription<M extends string>(defaultDescription?: M): this;

    /**
     * Set Yargs' `group` `string` for this `ZodType`; used in help text only
     * @param group Display group
     */
    group<G extends string>(group: G): this;

    /**
     * Change this `ZodType` into Yargs' "count" type
     */
    count(): this;

    /**
     * Set Yargs' `demandOption` flag; require this option to be provided.
     *
     * Recommended to avoid for ergonomics; use a positional instead.
     */
    demandOption(): this;

    /**
     * Set Yargs' `nargs` value for this `ZodType` (i.e., "number of expected
     * arguments").
     *
     * Assumption (could be very wrong): The default value is `1` for `string` or
     * `number` Yargs types, `0` for `boolean` types, and `Infinity` for array types.
     * @param nargs
     */
    nargs(nargs: number): this;

    /**
     * Set Yargs' `normalize` flag for this `ZodType`. Only applies to `string`
     * yargs types (`ZodString`, `ZodArray<ZodString>`, `ZodEnum`)
     */

    normalize(): this;

    /**
     * Provide aliases for this `ZodType`; usually of the "shorthand"
     * single-character variety
     * @param alias Alias or aliases
     */
    alias<A extends string | readonly string[]>(alias: A): this;

    /**
     * Generate the object which will be passed to `yargs.options()` for this `ZodType`.
     *
     * This function is expected to be called within the context of a parent
     * `ZodObject`. That `ZodObject` may be called with `.strict()`, and if so,
     * the `strict` parameter would be `true` here.
     *
     * @internal
     */
    _toYargsOptions(): ExpandDeep<Yargsify<this, {demandOption?: boolean}>>;
  }

  interface ZodNumber {
    /**
     * This is _also_ explicitly on the `prototype` of every supported `ZodType` subclass
     * @internal
     */
    [kOd]: true;

    /**
     * The equivalent yargs type, if this `ZodType` subclass is supported.
     * @internal
     */
    _yargsType: YargsType<number>;

    /**
     * Set options on a `ZodType` via object instead of fluent interface
     * @param config Options object
     */
    option<DOO extends Exact<OdOptions, DOO>>(config?: DOO): this;

    /**
     * Set Yargs' `global` flag for this `ZodType`
     */
    global(): this;

    /**
     * Set Yargs' `hidden` flag for this `ZodType`
     */
    hidden(): this;

    /**
     * Set Yargs' `deprecated` flag (or message) for this `ZodType`
     */
    deprecated<M extends string | boolean>(message?: M): this;

    /**
     * Set Yargs' `defaultDescription` `string` for this `ZodType`
     */
    defaultDescription<M extends string>(defaultDescription?: M): this;

    /**
     * Set Yargs' `group` `string` for this `ZodType`; used in help text only
     * @param group Display group
     */
    group<G extends string>(group: G): this;

    /**
     * Change this `ZodType` into Yargs' "count" type
     */
    count(): this;

    /**
     * Set Yargs' `demandOption` flag; require this option to be provided.
     *
     * Recommended to avoid for ergonomics; use a positional instead.
     */
    demandOption(): this;

    /**
     * Set Yargs' `nargs` value for this `ZodType` (i.e., "number of expected
     * arguments").
     *
     * Assumption (could be very wrong): The default value is `1` for `string` or
     * `number` Yargs types, `0` for `boolean` types, and `Infinity` for array types.
     * @param nargs
     */
    nargs(nargs: number): this;

    /**
     * Set Yargs' `normalize` flag for this `ZodType`. Only applies to `string`
     * yargs types (`ZodString`, `ZodArray<ZodString>`, `ZodEnum`)
     */

    normalize(): this;

    /**
     * Provide aliases for this `ZodType`; usually of the "shorthand"
     * single-character variety
     * @param alias Alias or aliases
     */
    alias<A extends string | readonly string[]>(alias: A): this;

    /**
     * Generate the object which will be passed to `yargs.options()` for this `ZodType`.
     *
     * This function is expected to be called within the context of a parent
     * `ZodObject`. That `ZodObject` may be called with `.strict()`, and if so,
     * the `strict` parameter would be `true` here.
     *
     * @internal
     */
    _toYargsOptions(): ExpandDeep<Yargsify<this, {demandOption?: boolean}>>;
  }

  interface ZodEnum<T extends [string, ...string[]]> {
    /**
     * This is _also_ explicitly on the `prototype` of every supported `ZodType` subclass
     * @internal
     */
    [kOd]: true;

    /**
     * The equivalent yargs type, if this `ZodType` subclass is supported.
     * @internal
     */
    _yargsType: YargsType<string>;

    /**
     * Set options on a `ZodType` via object instead of fluent interface
     * @param config Options object
     */
    option<DOO extends Exact<OdOptions, DOO>>(config?: DOO): this;

    /**
     * Set Yargs' `global` flag for this `ZodType`
     */
    global(): this;

    /**
     * Set Yargs' `hidden` flag for this `ZodType`
     */
    hidden(): this;

    /**
     * Set Yargs' `deprecated` flag (or message) for this `ZodType`
     */
    deprecated<M extends string | boolean>(message?: M): this;

    /**
     * Set Yargs' `defaultDescription` `string` for this `ZodType`
     */
    defaultDescription<M extends string>(defaultDescription?: M): this;

    /**
     * Set Yargs' `group` `string` for this `ZodType`; used in help text only
     * @param group Display group
     */
    group<G extends string>(group: G): this;

    /**
     * Change this `ZodType` into Yargs' "count" type
     */
    count(): this;

    /**
     * Set Yargs' `demandOption` flag; require this option to be provided.
     *
     * Recommended to avoid for ergonomics; use a positional instead.
     */
    demandOption(): this;

    /**
     * Set Yargs' `nargs` value for this `ZodType` (i.e., "number of expected
     * arguments").
     *
     * Assumption (could be very wrong): The default value is `1` for `string` or
     * `number` Yargs types, `0` for `boolean` types, and `Infinity` for array types.
     * @param nargs
     */
    nargs(nargs: number): this;

    /**
     * Set Yargs' `normalize` flag for this `ZodType`. Only applies to `string`
     * yargs types (`ZodString`, `ZodArray<ZodString>`, `ZodEnum`)
     */

    normalize(): this;

    /**
     * Provide aliases for this `ZodType`; usually of the "shorthand"
     * single-character variety
     * @param alias Alias or aliases
     */
    alias<A extends string | readonly string[]>(alias: A): this;

    /**
     * Generate the object which will be passed to `yargs.options()` for this `ZodType`.
     *
     * This function is expected to be called within the context of a parent
     * `ZodObject`. That `ZodObject` may be called with `.strict()`, and if so,
     * the `strict` parameter would be `true` here.
     *
     * @internal
     */
    _toYargsOptions(): ExpandDeep<Yargsify<this, {demandOption?: boolean}>>;
  }

  interface ZodArray<T extends z.ZodTypeAny> {
    /**
     * This is _also_ explicitly on the `prototype` of every supported `ZodType` subclass
     * @internal
     */
    [kOd]: true;

    /**
     * The equivalent yargs type, if this `ZodType` subclass is supported.
     * @internal
     */
    _yargsType: YargsType<T extends {_yargsType: infer Y} ? Y : never>;

    /**
     * Set options on a `ZodType` via object instead of fluent interface
     * @param config Options object
     */
    option<DOO extends Exact<OdOptions, DOO>>(config?: DOO): this;

    /**
     * Set Yargs' `global` flag for this `ZodType`
     */
    global(): this;

    /**
     * Set Yargs' `hidden` flag for this `ZodType`
     */
    hidden(): this;

    /**
     * Set Yargs' `deprecated` flag (or message) for this `ZodType`
     */
    deprecated<M extends string | boolean>(message?: M): this;

    /**
     * Set Yargs' `defaultDescription` `string` for this `ZodType`
     */
    defaultDescription<M extends string>(defaultDescription?: M): this;

    /**
     * Set Yargs' `group` `string` for this `ZodType`; used in help text only
     * @param group Display group
     */
    group<G extends string>(group: G): this;

    /**
     * Change this `ZodType` into Yargs' "count" type
     */
    count(): this;

    /**
     * Set Yargs' `demandOption` flag; require this option to be provided.
     *
     * Recommended to avoid for ergonomics; use a positional instead.
     */
    demandOption(): this;

    /**
     * Set Yargs' `nargs` value for this `ZodType` (i.e., "number of expected
     * arguments").
     *
     * Assumption (could be very wrong): The default value is `1` for `string` or
     * `number` Yargs types, `0` for `boolean` types, and `Infinity` for array types.
     * @param nargs
     */
    nargs(nargs: number): this;

    /**
     * Set Yargs' `normalize` flag for this `ZodType`. Only applies to `string`
     * yargs types (`ZodString`, `ZodArray<ZodString>`, `ZodEnum`)
     */

    normalize(): this;

    /**
     * Provide aliases for this `ZodType`; usually of the "shorthand"
     * single-character variety
     * @param alias Alias or aliases
     */
    alias<A extends string | readonly string[]>(alias: A): this;

    /**
     * Generate the object which will be passed to `yargs.options()` for this `ZodType`.
     *
     * This function is expected to be called within the context of a parent
     * `ZodObject`. That `ZodObject` may be called with `.strict()`, and if so,
     * the `strict` parameter would be `true` here.
     *
     * @internal
     */
    _toYargsOptions(): this extends OdSupportedType
      ? ExpandDeep<Yargsify<this, {demandOption?: boolean}>>
      : never;
  }

  interface ZodOptional<T extends z.ZodTypeAny> {
    /**
     * This is _also_ explicitly on the `prototype` of every supported `ZodType` subclass
     * @internal
     */
    [kOd]: true;

    /**
     * The equivalent yargs type, if this `ZodType` subclass is supported.
     * @internal
     */
    _yargsType: YargsType<T extends {_yargsType: infer Y} ? Y : never>;

    /**
     * Set options on a `ZodType` via object instead of fluent interface
     * @param config Options object
     */
    option<DOO extends Exact<OdOptions, DOO>>(config?: DOO): this;

    /**
     * Set Yargs' `global` flag for this `ZodType`
     */
    global(): this;

    /**
     * Set Yargs' `hidden` flag for this `ZodType`
     */
    hidden(): this;

    /**
     * Set Yargs' `deprecated` flag (or message) for this `ZodType`
     */
    deprecated<M extends string | boolean>(message?: M): this;

    /**
     * Set Yargs' `defaultDescription` `string` for this `ZodType`
     */
    defaultDescription<M extends string>(defaultDescription?: M): this;

    /**
     * Set Yargs' `group` `string` for this `ZodType`; used in help text only
     * @param group Display group
     */
    group<G extends string>(group: G): this;

    /**
     * Change this `ZodType` into Yargs' "count" type
     */
    count(): this;

    /**
     * Set Yargs' `demandOption` flag; require this option to be provided.
     *
     * Recommended to avoid for ergonomics; use a positional instead.
     */
    demandOption(): this;

    /**
     * Set Yargs' `nargs` value for this `ZodType` (i.e., "number of expected
     * arguments").
     *
     * Assumption (could be very wrong): The default value is `1` for `string` or
     * `number` Yargs types, `0` for `boolean` types, and `Infinity` for array types.
     * @param nargs
     */
    nargs(nargs: number): this;

    /**
     * Set Yargs' `normalize` flag for this `ZodType`. Only applies to `string`
     * yargs types (`ZodString`, `ZodArray<ZodString>`, `ZodEnum`)
     */

    normalize(): this;

    /**
     * Provide aliases for this `ZodType`; usually of the "shorthand"
     * single-character variety
     * @param alias Alias or aliases
     */
    alias<A extends string | readonly string[]>(alias: A): this;

    /**
     * Generate the object which will be passed to `yargs.options()` for this `ZodType`.
     *
     * This function is expected to be called within the context of a parent
     * `ZodObject`. That `ZodObject` may be called with `.strict()`, and if so,
     * the `strict` parameter would be `true` here.
     *
     * @internal
     */
    _toYargsOptions(): ExpandDeep<Yargsify<T, {demandOption?: boolean}>>;
  }

  interface ZodObjectDef<
    T extends z.ZodRawShape = z.ZodRawShape,
    UnknownKeys extends z.UnknownKeysParam = z.UnknownKeysParam,
    Catchall extends z.ZodTypeAny = z.ZodTypeAny,
  > {
    odCommandOptions: OdCommandOptions<T>;
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
    ): ZodObject<
      {[K in keyof T]: z.ZodOptional<T[K]>},
      this['_def']['unknownKeys'],
      this['_def']['catchall']
    >;

    middlewares(
      middlewares: OdMiddleware<T>[],
    ): ZodObject<
      {[K in keyof T]: z.ZodOptional<T[K]>},
      this['_def']['unknownKeys'],
      this['_def']['catchall']
    >;
    middlewares(
      ...middlewares: OdMiddleware<T>[]
    ): ZodObject<
      {[K in keyof T]: z.ZodOptional<T[K]>},
      this['_def']['unknownKeys'],
      this['_def']['catchall']
    >;

    /**
     * Generate a mapping of option name to `yargs.options()` object for this
     * `ZodObject`.
     *
     * This will call {@linkcode _toYargsOptions} on each property of the
     * `ZodObject`'s `shape`.
     *
     * @internal
     */
    _toYargsOptionsRecord(): ShapeToOdOptions<T>;

    _toYargsCommand<Y>(argv: y.Argv<Y>): y.Argv<Y>;
  }

  const command: typeof createOdCommand;
}
