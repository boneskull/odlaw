/* eslint-disable no-use-before-define */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type * as yargs from 'yargs';
import z, {ZodObjectDef} from 'zod';
import {
  OdCommand,
  OdCommandHandler,
  ZodObjectToYargsOptionsRecord,
} from './command';
import type {kOd} from './monkeypatch';
import {
  DynamicOdOptions,
  OdOptionsType,
  YargsType,
  YargsifyOdOptions,
} from './option';

declare module 'zod' {
  /**
   * Anything that has an `option()` method should extend this _and narrow each method_.
   */
  interface ZodType<
    Output = any,
    Def extends z.ZodTypeDef = z.ZodTypeDef,
    Input = Output,
  > {
    /**
     * @internal
     */
    [kOd]: true;

    _yargsType: YargsType<Input>;

    // _yargsType: InputToYargsType<Input>;

    option<ZO extends DynamicOdOptions>(config?: ZO): OdOptionsType<this, ZO>;

    global(): OdOptionsType<this, {global: true}>;

    hidden(): OdOptionsType<this, {hidden: true}>;

    deprecated<M extends string | boolean>(
      message?: M,
    ): OdOptionsType<this, {deprecated: M}>;

    defaultDescription<M extends string>(
      defaultDescription?: M,
    ): OdOptionsType<this, {defaultDescription: M}>;

    group<G extends string>(group: G): OdOptionsType<this, {group: G}>;

    count(): OdOptionsType<this, {count: true}>;

    demandOption(): OdOptionsType<this, {demandOption: true}>;

    nargs(nargs: number): OdOptionsType<this, {nargs: number}>;

    normalize(): OdOptionsType<this, {normalize: true}>;

    alias<A extends string | readonly string[]>(
      alias: A,
    ): OdOptionsType<this, {alias: A}>;

    /**
     * This function is expected to be called within the context of a parent
     * `ZodObject`. That `ZodObject` may be called with `.strict()`, and if so,
     * the `strict` parameter would be `true` here.
     *
     * Generally, you _don't_ want to demand options on the CLI, because it's
     * not ergonomic; provide _sensible defaults_ instead.
     */
    _toYargsOptions<Strict extends boolean>(
      strict: Strict,
    ): YargsifyOdOptions<this, {demandOption: Strict}>;

    _toYargsOptionsRecord(): ZodObjectToYargsOptionsRecord<this>;

    _toYargs<Y>(
      argv: yargs.Argv<Y>,
    ): this['_def'] extends ZodObjectDef<any>
      ? yargs.Argv<Y & ZodObjectToYargsOptionsRecord<this>>
      : yargs.Argv<Y>;
  }

  interface ZodObject<
    T extends z.ZodRawShape,
    UnknownKeys extends z.UnknownKeysParam = z.UnknownKeysParam,
    Catchall extends z.ZodTypeAny = z.ZodTypeAny,
    Output = z.objectOutputType<T, Catchall, UnknownKeys>,
    Input = z.objectInputType<T, Catchall, UnknownKeys>,
  > {
    command(
      command: string | readonly string[],
      handler?: OdCommandHandler<T>,
    ): OdCommand<this>;
  }
}
