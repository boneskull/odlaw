/* eslint-disable no-use-before-define */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {SimpleMerge} from 'type-fest/source/merge';
import type * as yargs from 'yargs';
import z, {ZodObjectDef} from 'zod';
import type {kZodlaw} from './zodlaw';

declare module 'zod' {
  type ZodToYargsType<Input> = Input extends boolean
    ? 'boolean'
    : Input extends number
    ? 'number'
    : Input extends string | [string, ...string[]] | string[]
    ? 'string'
    : never;

  /**
   * Option config from {@linkcode YOptions yargs.Options} which cannot be expressed via Zod itself
   */
  type ZodlawOptions = Pick<
    yargs.Options,
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
    | 'type'
  >;

  type ZodlawOptionsType<
    ZO extends ZodlawOptions,
    T extends z.ZodTypeAny,
  > = z.ZodType<
    T['_output'],
    T['_def'] & T['_def'] extends {zodlawOptions: infer Z}
      ? {zodlawOptions: SimpleMerge<Z, ZO>}
      : {zodlawOptions: ZO},
    T['_input']
  >;

  type ZodlawOptionsForShape<T extends z.AnyZodObject> = {
    [K in keyof T['shape']]: ZodlawOptionsType<
      T['shape'][K]['_def']['zodlawOptions'],
      T['shape'][K]
    >['_def']['zodlawOptions'];
  };

  // type ZodlawOptionsType<
  //   ZOR extends ZodlawOptionsRecord,
  //   T extends z.ZodTypeAny,
  // > = z.ZodType<
  //   T['_output'],
  //   SimpleMerge<
  //     T['_def'],
  //     T['_def'] extends {zodlawOptionsRecord: infer Z}
  //       ? {zodlawOptions: SimpleMerge<Z, ZOR>}
  //       : {zodlawOptions: ZOR}
  //   >,
  //   T['_input']
  // >;

  interface ZodTypeDef {
    zodlawOptions: ZodlawOptions;
    // zodlawOptionsRecord?: ZodlawOptionsRecord;
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

    option<ZO extends ZodlawOptions>(config?: ZO): ZodlawOptionsType<ZO, this>;

    // options<ZOR extends ZodlawOptionsRecord>(
    //   config?: ZOR,
    // ): ZodlawOptionsType<ZOR, this>;

    global(): ZodlawOptionsType<{global: true}, this>;

    hidden(): ZodlawOptionsType<{hidden: true}, this>;

    deprecated<M extends string | boolean>(
      message?: M,
    ): ZodlawOptionsType<{deprecated: M}, this>;

    defaultDescription<M extends string>(
      defaultDescription?: M,
    ): ZodlawOptionsType<{defaultDescription: M}, this>;

    group<G extends string>(group: G): ZodlawOptionsType<{group: G}, this>;

    count(): ZodlawOptionsType<{count: true}, this>;

    demandOption(): ZodlawOptionsType<{demandOption: true}, this>;

    nargs(nargs: number): ZodlawOptionsType<{nargs: number}, this>;

    normalize(): ZodlawOptionsType<{normalize: true}, this>;

    alias(
      alias: string | readonly string[],
    ): ZodlawOptionsType<{alias: string | readonly string[]}, this>;

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
    ): SimpleMerge<
      this['_def']['zodlawOptions'],
      {demandOption: Strict; describe?: string; type: ZodToYargsType<Input>}
    >;

    _toYargs<Y>(argv: yargs.Argv<Y>): this['_def'] extends ZodObjectDef<
      infer Shape,
      any,
      any
    >
      ? yargs.Argv<
          Y & {
            [K in keyof Shape]: SimpleMerge<
              Shape[K]['_def']['zodlawOptions'],
              {
                demandOption: Shape[K]['_def']['zodlawOptions'] extends {
                  demandOption: true;
                }
                  ? true
                  : Def extends {unknownKeys: 'strict'}
                  ? true
                  : false;
                describe?: string;
                // this will already be present; we don't have to add it in the impl
                type: ZodToYargsType<Shape[K]['_input']>;
              }
            >;
          }
        >
      : yargs.Argv<Y>;
  }
}
