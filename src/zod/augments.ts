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
import {
  OdCommandCreateParams,
  OdCommandHandler,
  OdCommandOptions,
  OdMiddleware,
  createOdCommand,
} from './od-command';
import type {
  ExtendOdOptions,
  OdOptions,
  ShapeToOdOptions,
  Yargsify,
} from './od-option';
import {
  ExtendPositionalTuple,
  OdPositionalOptions,
  PositionalTuple,
  PositionalTupleItems,
  PositionalZodType,
} from './od-positional';
import type {kOd} from './register';
import {YargsType} from './yargs';

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
    option<OO extends Exact<OdOptions, OO>>(
      config: OO,
    ): ExtendOdOptions<this, OO>;

    /**
     * Set Yargs' `global` flag for this `ZodType`
     */
    global(): ExtendOdOptions<this, {global: true}>;

    /**
     * Set Yargs' `hidden` flag for this `ZodType`
     */
    hidden(): ExtendOdOptions<this, {hidden: true}>;

    /**
     * Set Yargs' `deprecated` flag (or message) for this `ZodType`
     */
    deprecated<M extends string>(
      message?: M,
    ): ExtendOdOptions<this, {deprecated: M extends string ? M : true}>;

    /**
     * Set Yargs' `defaultDescription` `string` for this `ZodType`
     */
    defaultDescription<M extends string>(
      defaultDescription?: M,
    ): ExtendOdOptions<this, {defaultDescription: M}>;

    /**
     * Set Yargs' `group` `string` for this `ZodType`; used in help text only
     * @param group Display group
     */
    group<G extends string>(group: G): ExtendOdOptions<this, {group: G}>;

    /**
     * Change this `ZodType` into Yargs' "count" type
     */
    count(): ExtendOdOptions<this, {count: true}>;

    /**
     * Set Yargs' `demandOption` flag; require this option to be provided.
     *
     * Recommended to avoid for ergonomics; use a positional instead.
     * @param message Error message
     */
    demandOption<M extends string | boolean>(
      message?: M,
    ): ExtendOdOptions<this, {demandOption: M}>;

    /**
     * Provide aliases for this `ZodType`; usually of the "shorthand"
     * single-character variety
     * @param alias Alias or aliases
     */
    alias<A extends string | readonly string[]>(
      alias: A,
    ): ExtendOdOptions<this, {alias: A}>;

    /**
     * Generate the object which will be passed to `yargs.options()` for this `ZodType`.
     *
     * This function is expected to be called within the context of a parent
     * `ZodObject`. That `ZodObject` may be called with `.strict()`, and if so,
     * the `strict` parameter would be `true` here.
     *
     * @internal
     */
    _toYargsOptions(): ExpandDeep<Yargsify<this>>;
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
    option<DOO extends Exact<OdOptions, DOO>>(
      config: DOO,
    ): ExtendOdOptions<this, DOO>;

    /**
     * Set Yargs' `global` flag for this `ZodType`
     */
    global(): ExtendOdOptions<this, {global: true}>;

    /**
     * Set Yargs' `hidden` flag for this `ZodType`
     */
    hidden(): ExtendOdOptions<this, {hidden: true}>;

    /**
     * Set Yargs' `deprecated` flag (or message) for this `ZodType`
     */
    deprecated<Msg extends string | boolean>(
      message?: Msg,
    ): ExtendOdOptions<this, {deprecated: Msg}>;

    /**
     * Set Yargs' `defaultDescription` `string` for this `ZodType`
     */
    defaultDescription<Desc extends string>(
      defaultDescription?: Desc,
    ): ExtendOdOptions<this, {defaultDescription: Desc}>;

    /**
     * Set Yargs' `group` `string` for this `ZodType`; used in help text only
     * @param group Display group
     */
    group<Group extends string>(
      group: Group,
    ): ExtendOdOptions<this, {group: Group}>;

    /**
     * Change this `ZodType` into Yargs' "count" type
     */
    count(): ExtendOdOptions<this, {count: true}>;

    /**
     * Set Yargs' `demandOption` flag; require this option to be provided.
     *
     * Recommended to avoid for ergonomics; use a positional instead.
     * @param message Error message
     */
    demandOption<Msg extends string>(
      message?: Msg,
    ): ExtendOdOptions<this, {demandOption: Msg extends string ? Msg : true}>;

    /**
     * Set Yargs' `nargs` value for this `ZodType` (i.e., "number of expected
     * arguments").
     */
    nargs<N extends number>(nargs: N): ExtendOdOptions<this, {nargs: N}>;

    /**
     * Set Yargs' `normalize` flag for this `ZodType`.
     */

    normalize(): ExtendOdOptions<this, {normalize: true}>;

    /**
     * Provide aliases for this `ZodType`; usually of the "shorthand"
     * single-character variety
     * @param alias Alias or aliases
     */
    alias<A extends string | readonly string[]>(
      alias: A,
    ): ExtendOdOptions<this, {alias: A}>;

    /**
     * Generate the object which will be passed to `yargs.options()` for this `ZodType`.
     *
     * This function is expected to be called within the context of a parent
     * `ZodObject`. That `ZodObject` may be called with `.strict()`, and if so,
     * the `strict` parameter would be `true` here.
     *
     * @internal
     */
    _toYargsOptions(): ExpandDeep<Yargsify<this>>;
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
    option<DOO extends Exact<OdOptions, DOO>>(
      config: DOO,
    ): ExtendOdOptions<this, DOO>;

    /**
     * Set Yargs' `global` flag for this `ZodType`
     */
    global(): ExtendOdOptions<this, {global: true}>;

    /**
     * Set Yargs' `hidden` flag for this `ZodType`
     */
    hidden(): ExtendOdOptions<this, {hidden: true}>;

    /**
     * Set Yargs' `deprecated` flag (or message) for this `ZodType`
     */
    deprecated<M extends string>(
      message?: M,
    ): ExtendOdOptions<this, {deprecated: M extends string ? M : true}>;

    /**
     * Set Yargs' `defaultDescription` `string` for this `ZodType`
     */
    defaultDescription<M extends string>(
      defaultDescription?: M,
    ): ExtendOdOptions<this, {defaultDescription: M}>;

    /**
     * Set Yargs' `group` `string` for this `ZodType`; used in help text only
     * @param group Display group
     */
    group<Group extends string>(
      group: Group,
    ): ExtendOdOptions<this, {group: Group}>;

    /**
     * Change this `ZodType` into Yargs' "count" type
     */
    count(): ExtendOdOptions<this, {count: true}>;
    /**
     * Set Yargs' `demandOption` flag; require this option to be provided.
     *
     * Recommended to avoid for ergonomics; use a positional instead.
     * @param message Error message
     */
    demandOption<Msg extends string>(
      message?: Msg,
    ): ExtendOdOptions<this, {demandOption: Msg extends string ? Msg : true}>;

    /**
     * Set Yargs' `nargs` value for this `ZodType` (i.e., "number of expected
     * arguments").
     */
    nargs<N extends number>(nargs: N): ExtendOdOptions<this, {nargs: N}>;

    /**
     * Provide aliases for this `ZodType`; usually of the "shorthand"
     * single-character variety
     * @param alias Alias or aliases
     */
    alias<A extends string | readonly string[]>(
      alias: A,
    ): ExtendOdOptions<this, {alias: A}>;

    /**
     * Generate the object which will be passed to `yargs.options()` for this `ZodType`.
     *
     * This function is expected to be called within the context of a parent
     * `ZodObject`. That `ZodObject` may be called with `.strict()`, and if so,
     * the `strict` parameter would be `true` here.
     *
     * @internal
     */
    _toYargsOptions(): ExpandDeep<Yargsify<this>>;
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
    option<DOO extends Exact<OdOptions, DOO>>(
      config: DOO,
    ): ExtendOdOptions<this, DOO>;

    /**
     * Set Yargs' `global` flag for this `ZodType`
     */
    global(): ExtendOdOptions<this, {global: true}>;

    /**
     * Set Yargs' `hidden` flag for this `ZodType`
     */
    hidden(): ExtendOdOptions<this, {hidden: true}>;

    /**
     * Set Yargs' `deprecated` flag (or message) for this `ZodType`
     */
    deprecated<M extends string>(
      message?: M,
    ): ExtendOdOptions<this, {deprecated: M extends string ? M : true}>;

    /**
     * Set Yargs' `defaultDescription` `string` for this `ZodType`
     */
    defaultDescription<M extends string>(
      defaultDescription?: M,
    ): ExtendOdOptions<this, {defaultDescription: M}>;

    /**
     * Set Yargs' `group` `string` for this `ZodType`; used in help text only
     * @param group Display group
     */
    group<Group extends string>(
      group: Group,
    ): ExtendOdOptions<this, {group: Group}>;

    /**
     * Change this `ZodType` into Yargs' "count" type
     */
    count(): ExtendOdOptions<this, {count: true}>;
    /**
     * Set Yargs' `demandOption` flag; require this option to be provided.
     *
     * Recommended to avoid for ergonomics; use a positional instead.
     * @param message Error message
     */
    demandOption<Msg extends string>(
      message?: Msg,
    ): ExtendOdOptions<this, {demandOption: Msg extends string ? Msg : true}>;

    /**
     * Set Yargs' `nargs` value for this `ZodType` (i.e., "number of expected
     * arguments").
     */
    nargs<N extends number>(nargs: N): ExtendOdOptions<this, {nargs: N}>;

    /**
     * Set Yargs' `normalize` flag for this `ZodType`.
     */

    normalize(): ExtendOdOptions<this, {normalize: true}>;

    /**
     * Provide aliases for this `ZodType`; usually of the "shorthand"
     * single-character variety
     * @param alias Alias or aliases
     */
    alias<A extends string | readonly string[]>(
      alias: A,
    ): ExtendOdOptions<this, {alias: A}>;

    /**
     * Generate the object which will be passed to `yargs.options()` for this `ZodType`.
     *
     * This function is expected to be called within the context of a parent
     * `ZodObject`. That `ZodObject` may be called with `.strict()`, and if so,
     * the `strict` parameter would be `true` here.
     *
     * @internal
     */
    _toYargsOptions(): ExpandDeep<Yargsify<this>>;
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
    option<DOO extends Exact<OdOptions, DOO>>(
      config: DOO,
    ): ExtendOdOptions<this, DOO>;

    /**
     * Set Yargs' `global` flag for this `ZodType`
     */
    global(): ExtendOdOptions<this, {global: true}>;

    /**
     * Set Yargs' `hidden` flag for this `ZodType`
     */
    hidden(): ExtendOdOptions<this, {hidden: true}>;

    /**
     * Set Yargs' `deprecated` flag (or message) for this `ZodType`
     */
    deprecated<M extends string>(
      message?: M,
    ): ExtendOdOptions<this, {deprecated: M extends string ? M : true}>;

    /**
     * Set Yargs' `defaultDescription` `string` for this `ZodType`
     */
    defaultDescription<M extends string>(
      defaultDescription?: M,
    ): ExtendOdOptions<this, {defaultDescription: M}>;

    /**
     * Set Yargs' `group` `string` for this `ZodType`; used in help text only
     * @param group Display group
     */
    group<Group extends string>(
      group: Group,
    ): ExtendOdOptions<this, {group: Group}>;

    /**
     * Change this `ZodType` into Yargs' "count" type
     */
    count(): ExtendOdOptions<this, {count: true}>;
    /**
     * Set Yargs' `demandOption` flag; require this option to be provided.
     *
     * Recommended to avoid for ergonomics; use a positional instead.
     * @param message Error message
     */
    demandOption<Msg extends string>(
      message?: Msg,
    ): ExtendOdOptions<this, {demandOption: Msg extends string ? Msg : true}>;

    /**
     * Set Yargs' `nargs` value for this `ZodType` (i.e., "number of expected
     * arguments").
     */
    nargs<N extends number>(nargs: N): ExtendOdOptions<this, {nargs: N}>;

    /**
     * Set Yargs' `normalize` flag for this `ZodType`.
     */

    normalize(): ExtendOdOptions<this, {normalize: true}>;

    /**
     * Provide aliases for this `ZodType`; usually of the "shorthand"
     * single-character variety
     * @param alias Alias or aliases
     */
    alias<A extends string | readonly string[]>(
      alias: A,
    ): ExtendOdOptions<this, {alias: A}>;

    /**
     * Generate the object which will be passed to `yargs.options()` for this `ZodType`.
     *
     * This function is expected to be called within the context of a parent
     * `ZodObject`. That `ZodObject` may be called with `.strict()`, and if so,
     * the `strict` parameter would be `true` here.
     *
     * @internal
     */
    _toYargsOptions(): ExpandDeep<Yargsify<this>>;
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
    option<DOO extends Exact<OdOptions, DOO>>(
      config: DOO,
    ): ExtendOdOptions<this, DOO>;

    /**
     * Set Yargs' `global` flag for this `ZodType`
     */
    global(): ExtendOdOptions<this, {global: true}>;

    /**
     * Set Yargs' `hidden` flag for this `ZodType`
     */
    hidden(): ExtendOdOptions<this, {hidden: true}>;

    /**
     * Set Yargs' `deprecated` flag (or message) for this `ZodType`
     */
    deprecated<M extends string>(
      message?: M,
    ): ExtendOdOptions<this, {deprecated: M extends string ? M : true}>;

    /**
     * Set Yargs' `defaultDescription` `string` for this `ZodType`
     */
    defaultDescription<M extends string>(
      defaultDescription?: M,
    ): ExtendOdOptions<this, {defaultDescription: M}>;

    /**
     * Set Yargs' `group` `string` for this `ZodType`; used in help text only
     * @param group Display group
     */
    group<Group extends string>(
      group: Group,
    ): ExtendOdOptions<this, {group: Group}>;

    /**
     * Change this `ZodType` into Yargs' "count" type
     */
    count(): ExtendOdOptions<this, {count: true}>;
    /**
     * Set Yargs' `demandOption` flag; require this option to be provided.
     *
     * Recommended to avoid for ergonomics; use a positional instead.
     * @param message Error message
     */
    demandOption<Msg extends string>(
      message?: Msg,
    ): ExtendOdOptions<this, {demandOption: Msg extends string ? Msg : true}>;

    /**
     * Set Yargs' `nargs` value for this `ZodType` (i.e., "number of expected
     * arguments").
     */
    nargs<N extends number>(nargs: N): ExtendOdOptions<this, {nargs: N}>;

    /**
     * Set Yargs' `normalize` flag for this `ZodType`.
     */

    normalize(): ExtendOdOptions<this, {normalize: true}>;

    /**
     * Provide aliases for this `ZodType`; usually of the "shorthand"
     * single-character variety
     * @param alias Alias or aliases
     */
    alias<A extends string | readonly string[]>(
      alias: A,
    ): ExtendOdOptions<this, {alias: A}>;

    /**
     * Generate the object which will be passed to `yargs.options()` for this `ZodType`.
     *
     * This function is expected to be called within the context of a parent
     * `ZodObject`. That `ZodObject` may be called with `.strict()`, and if so,
     * the `strict` parameter would be `true` here.
     *
     * @internal
     */
    _toYargsOptions(): ExpandDeep<Yargsify<this>>;
  }

  interface ZodDefault<T extends z.ZodTypeAny> {
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
    option<DOO extends Exact<OdOptions, DOO>>(
      config: DOO,
    ): ExtendOdOptions<this, DOO>;

    /**
     * Set Yargs' `global` flag for this `ZodType`
     */
    global(): ExtendOdOptions<this, {global: true}>;

    /**
     * Set Yargs' `hidden` flag for this `ZodType`
     */
    hidden(): ExtendOdOptions<this, {hidden: true}>;

    /**
     * Set Yargs' `deprecated` flag (or message) for this `ZodType`
     */
    deprecated<M extends string>(
      message?: M,
    ): ExtendOdOptions<this, {deprecated: M extends string ? M : true}>;

    /**
     * Set Yargs' `defaultDescription` `string` for this `ZodType`
     */
    defaultDescription<M extends string>(
      defaultDescription?: M,
    ): ExtendOdOptions<this, {defaultDescription: M}>;

    /**
     * Set Yargs' `group` `string` for this `ZodType`; used in help text only
     * @param group Display group
     */
    group<Group extends string>(
      group: Group,
    ): ExtendOdOptions<this, {group: Group}>;

    /**
     * Change this `ZodType` into Yargs' "count" type
     */
    count(): ExtendOdOptions<this, {count: true}>;
    /**
     * Set Yargs' `demandOption` flag; require this option to be provided.
     *
     * Recommended to avoid for ergonomics; use a positional instead.
     */
    demandOption(message: string): this;

    /**
     * Set Yargs' `nargs` value for this `ZodType` (i.e., "number of expected
     * arguments").
     */
    nargs<N extends number>(nargs: N): ExtendOdOptions<this, {nargs: N}>;

    /**
     * Set Yargs' `normalize` flag for this `ZodType`.
     */

    normalize(): ExtendOdOptions<this, {normalize: true}>;

    /**
     * Provide aliases for this `ZodType`; usually of the "shorthand"
     * single-character variety
     * @param alias Alias or aliases
     */
    alias<A extends string | readonly string[]>(
      alias: A,
    ): ExtendOdOptions<this, {alias: A}>;

    /**
     * Generate the object which will be passed to `yargs.options()` for this `ZodType`.
     *
     * This function is expected to be called within the context of a parent
     * `ZodObject`. That `ZodObject` may be called with `.strict()`, and if so,
     * the `strict` parameter would be `true` here.
     *
     * @internal
     */
    _toYargsOptions(): ExpandDeep<Yargsify<this>>;
  }

  interface ZodTupleDef<
    T extends z.ZodTupleItems | [] = z.ZodTupleItems,
    Rest extends z.ZodTypeAny | null = null,
  > {
    odPositionalOptions?: [...OdPositionalOptions[]];
  }

  interface ZodObjectDef<
    T extends z.ZodRawShape = z.ZodRawShape,
    UnknownKeys extends z.UnknownKeysParam = z.UnknownKeysParam,
    Catchall extends z.ZodTypeAny = z.ZodTypeAny,
  > {
    odCommandOptions: OdCommandOptions<T>;
  }

  type OptionalShape<T extends z.ZodRawShape> = {
    [K in keyof T]: T[K] extends z.ZodOptional<any>
      ? T[K]
      : z.ZodOptional<T[K]>;
  };

  interface ZodCommandDef<
    T extends z.ZodRawShape = z.ZodRawShape,
    Catchall extends z.ZodTypeAny = z.ZodTypeAny,
    OCO extends OdCommandOptions<OptionalShape<T>> = OdCommandOptions<
      OptionalShape<T>
    >,
  > extends ZodObjectDef<OptionalShape<T>, 'passthrough', Catchall> {
    odCommandOptions: OCO;
  }

  type ExtendOdCommandOptions<
    T extends ZodObject<any, any, any, any, any>,
    OCO extends OdCommandOptions<T['shape']> = OdCommandOptions<T['shape']>,
  > = T & {
    _def: T['_def'] & ZodCommandDef<T['shape'], T['_def']['catchall'], OCO>;
  };

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
    command<
      Cmd extends string | readonly string[],
      Desc extends string,
      Handler extends OdCommandHandler<T>,
    >(
      command: Cmd,
      description?: Desc,
      handler?: Handler,
    ): ExtendOdCommandOptions<
      this,
      {command: Cmd; description: Desc; handler: Handler}
    >;

    command<OCO extends OdCommandOptions<T>>(
      params: OdCommandCreateParams<OCO>,
    ): ExtendOdCommandOptions<this, OCO>;

    middlewares(middlewares: OdMiddleware<T>[]): ExtendOdCommandOptions<this>;
    middlewares(
      ...middlewares: OdMiddleware<T>[]
    ): ExtendOdCommandOptions<this>;

    positional<
      P extends PositionalZodType,
      OPO extends Partial<OdPositionalOptions>,
      CurItems extends PositionalTupleItems,
      S extends T & {_?: PositionalTuple<CurItems>},
    >(
      name: string,
      schema: P,
      opts?: OPO,
    ): ExtendOdCommandOptions<
      z.ZodObject<
        ExtendPositionalTuple<S, P, CurItems>,
        'passthrough',
        Catchall
      >
    >;

    handler(handler: OdCommandHandler<T>): ExtendOdCommandOptions<this>;

    deprecated(message?: string | boolean): ExtendOdCommandOptions<this>;

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
