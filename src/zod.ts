import type {Argv, InferredOptionTypes, Options as YOptions} from 'yargs';
import type z from 'zod';
import type {kZodlaw} from './zodlaw';

declare module 'zod' {
  /**
   * Option config from {@linkcode YOptions yargs.Options} which cannot be expressed via Zod itself
   */
  type ZodlawOptions = Pick<
    YOptions,
    | 'describe'
    | 'count'
    | 'defaultDescription'
    | 'deprecated'
    | 'global'
    | 'group'
    | 'hidden'
    | 'nargs'
    | 'normalize'
  >;

  type ZodlawOptionsRecord = Record<string, ZodlawOptions>;

  /**
   * Zodlaw settings for a {@linkcode z.ZodObject}.
   *
   * @todo Should also support a `Record<string, ZodlawPositionalOption>` and
   * `Record<string, ZodlawCommandOption>`
   */
  type ZodlawObject = ZodlawOptionsRecord;

  /**
   * Augment {@linkcode z.ZodObjectDef} to include a `zodlawOptionsRecord` property
   *
   * @todo Should eventually have `zodlawPositionals` and `zodlawCommands`
   */

  interface ZodObjectDef {
    zodlawOptionsRecord?: ZodlawOptionsRecord;
  }

  /**
   * Augment {@linkcode z.ZodBooleanDef} to include a `zodlawOptions` property
   *
   * @remarks Booleans can only be options; they cannot be positional arguments nor commands
   */
  interface ZodBooleanDef {
    zodlawOptions?: ZodlawOptions;
  }

  // TODO: ZodString
  // TODO: ZodNumber
  // TODO: ZodArray
  // TODO: ZodEnum

  /**
   * Any Zod class monkeypatched by zodlaw _must_ extend this interface
   *
   * @todo add `zodlaw()`
   */
  interface ZodlawType {
    /**
     * @internal
     */
    [kZodlaw]: true;

    /**
     * @private
     */
    _newThis(): this;
  }

  interface ZodBoolean extends ZodlawType {
    zodlaw(): this['_def'] extends {
      zodlawOptions: infer Z extends ZodlawOptions;
    }
      ? Z
      : ZodlawOptions | undefined;

    option(config?: ZodlawOptions): z.ZodBoolean &
      z.ZodType<
        boolean,
        z.ZodBooleanDef & this['_def'] extends {
          zodlawOptions: infer Z extends ZodlawOptions;
        }
          ? this['_def'] & {zodlawOptions: Z & ZodlawOptions}
          : this['_def'] & {zodlawOptions: ZodlawOptions}
      >;
  }

  interface ZodObject<
    T extends z.ZodRawShape,
    UnknownKeys extends z.UnknownKeysParam = z.UnknownKeysParam,
    Catchall extends z.ZodTypeAny = z.ZodTypeAny,
    Output = z.objectOutputType<T, Catchall, UnknownKeys>,
    Input = z.objectInputType<T, Catchall, UnknownKeys>,
  > extends ZodlawType {
    zodlaw(): this['_def'] extends {zodlawOptionsRecord: infer Z}
      ? Z
      : ZodlawOptionsRecord | undefined;

    /**
     * @param yargs Yargs instance
     * @returns A Yargs instance with whatever config comes out of the schema
     */
    createParser(yargs: Argv): this['_def'] extends {
      zodlawOptionsRecord: infer Z extends ZodlawOptionsRecord;
    }
      ? Argv<Omit<Output, keyof Output>> & InferredOptionTypes<Z>
      : Argv;

    options(config?: ZodlawOptionsRecord): z.ZodObject<
      T,
      UnknownKeys,
      Catchall,
      Output,
      Input
    > &
      z.ZodType<
        T,
        z.ZodObjectDef<T, UnknownKeys, Catchall> & this['_def'] extends {
          zodlawOptionsRecord: infer Z extends ZodlawOptionsRecord;
        }
          ? this['_def'] & {zodlawOptionsRecord: Z & ZodlawOptionsRecord}
          : this['_def'] & {zodlawOptionsRecord: ZodlawOptionsRecord},
        Input
      >;
  }
}
