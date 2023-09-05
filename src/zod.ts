/* eslint-disable no-use-before-define */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type {SimpleMerge} from 'type-fest/source/merge.d.ts';
import type * as yargs from 'yargs';
import z from 'zod';
import type {kZodlaw} from './zodlaw';

type ZodToYargsType<T extends z.ZodTypeAny> = T extends z.ZodBoolean
  ? 'boolean'
  : T extends z.ZodString
  ? 'string'
  : T extends z.ZodNumber
  ? 'number'
  : T extends z.ZodArray<infer E>
  ? ZodToYargsType<E>
  : T extends z.ZodEnum<any>
  ? 'string'
  : undefined;
declare module 'zod' {
  /**
   * Option config from {@linkcode YOptions yargs.Options} which cannot be expressed via Zod itself
   */
  type ZodlawOptions = Pick<
    yargs.Options,
    | 'alias'
    | 'count'
    | 'defaultDescription'
    | 'deprecated'
    | 'describe'
    | 'global'
    | 'group'
    | 'hidden'
    | 'nargs'
    | 'normalize'
    | 'type'
  >;

  type ZodlawOptionsRecord = Record<string, ZodlawOptions>;

  type ZodlawOptionType<
    ZO extends ZodlawOptions,
    T extends z.ZodTypeAny,
  > = z.ZodType<
    T['_output'],
    SimpleMerge<
      T['_def'],
      T['_def'] extends {zodlawOptions: infer Z}
        ? {zodlawOptions: SimpleMerge<Z, ZO>}
        : {zodlawOptions: ZO}
    >,
    T['_input']
  >;

  type ZodlawOptionsType<
    ZOR extends ZodlawOptionsRecord,
    T extends z.ZodTypeAny,
  > = z.ZodType<
    T['_output'],
    SimpleMerge<
      T['_def'],
      T['_def'] extends {zodlawOptionsRecord: infer Z}
        ? {zodlawOptions: SimpleMerge<Z, ZOR>}
        : {zodlawOptions: ZOR}
    >,
    T['_input']
  >;

  interface ZodTypeDef {
    zodlawOptions?: ZodlawOptions;
    zodlawOptionsRecord?: ZodlawOptionsRecord;
  }

  /**
   * Anything that has an `option()` method should extend this _and narrow each method_.
   */
  interface ZodType<
    Output = any,
    Def extends ZodTypeDef = ZodTypeDef,
    Input = Output,
  > {
    /**
     * @internal
     */
    [kZodlaw]: true;

    option<ZO extends ZodlawOptions>(config?: ZO): ZodlawOptionType<ZO, this>;

    options<ZOR extends ZodlawOptionsRecord>(
      config?: ZOR,
    ): ZodlawOptionsType<ZOR, this>;

    global(): ZodlawOptionType<{global: true}, this>;

    hidden(): ZodlawOptionType<{hidden: true}, this>;

    deprecated<M extends string | boolean>(
      message?: M,
    ): ZodlawOptionType<{deprecated: M}, this>;

    defaultDescription<M extends string>(
      defaultDescription?: M,
    ): ZodlawOptionType<{defaultDescription: M}, this>;

    group<G extends string>(group: G): ZodlawOptionType<{group: G}, this>;

    count(): ZodlawOptionType<{count: true}, this>;

    nargs(nargs: number): ZodlawOptionType<{nargs: number}, this>;

    normalize(): ZodlawOptionType<{normalize: true}, this>;

    alias<A extends string | string[]>(
      alias: A,
    ): ZodlawOptionType<{alias: A}, this>;

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
    ): ZodlawOptionType<
      {
        demandOption: Strict;
        describe?: string;
        type: ZodToYargsType<this>;
      },
      this
    >;

    _toYargs<Y>(yargs: yargs.Argv<Y>): this['_def'] extends {
      zodlawOptionsRecord: infer Z extends ZodlawOptionsRecord;
    }
      ? yargs.Argv<SimpleMerge<Y, yargs.InferredOptionTypes<Z>>>
      : yargs.Argv<Y>;
  }
}
