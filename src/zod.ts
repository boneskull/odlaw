import type {Argv, InferredOptionTypes, Options as YOptions} from 'yargs';
import type z from 'zod';
import type {kZodlaw} from './zodlaw';

declare module 'zod' {
  /**
   * Option config from {@linkcode YOptions yargs.Options} which cannot be expressed via Zod itself
   */
  type ZodlawOptions = Pick<
    YOptions,
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

  interface ZodStringDef {
    zodlawOptions?: ZodlawOptions;
  }

  interface ZodNumberDef {
    zodlawOptions?: ZodlawOptions;
  }

  interface ZodArrayDef {
    zodlawOptions?: ZodlawOptions;
  }

  interface ZodEnumDef {
    zodlawOptions?: ZodlawOptions;
  }

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

  /**
   * These types are ones that we can translate into args
   */
  type AnyZodlaw =
    | z.ZodBoolean
    | z.ZodString
    | z.ZodNumber
    | z.ZodArray<any>
    | z.ZodEnum<any>;

  /**
   * Convenience type for returning a new {@linkcode z.ZodType} instance with its
   * {@linkcode z.ZodType._def _def} updated, containing changed {@linkcode ZodlawOptions}
   *
   * On the implementation side, see {@linkcode ZodlawType._newThis}
   */
  type ZodlawOptionsResult<
    Z extends z.ZodTypeAny,
    OValue extends Partial<ZodlawOptions>,
  > = Z & {
    _def: Z['_def'] & {zodlawOptions: OValue};
  };

  interface ZodlawOptionType extends ZodlawType {
    zodlaw(): ZodlawOptions | undefined;

    option<O extends ZodlawOptions>(config?: O): ZodlawOptionType;
  }

  interface ZodBoolean extends ZodlawOptionType {
    option<O extends ZodlawOptions>(
      config?: O,
    ): this &
      z.ZodType<
        boolean,
        this['_def'] &
          (this['_def'] extends {
            zodlawOptions: infer ZLO;
          }
            ? {zodlawOptions: ZLO & O}
            : {zodlawOptions: O})
      >;

    global(): ZodlawOptionsResult<this, {global: true}>;

    hidden(): ZodlawOptionsResult<this, {hidden: true}>;

    deprecated(message?: string): ZodlawOptionsResult<
      this,
      {
        deprecated: typeof message extends string ? string : true;
      }
    >;

    defaultDescription(
      defaultDescription?: string,
    ): ZodlawOptionsResult<this, {defaultDescription: string}>;

    group(name: string): ZodlawOptionsResult<this, {group: string}>;

    zodlaw(): this['_def'] extends {
      zodlawOptions: infer Z extends ZodlawOptions;
    }
      ? Z
      : ZodlawOptions | undefined;

    count(): ZodlawOptionsResult<this, {count: true}>;
  }

  interface ZodNumber extends ZodlawType {
    option<O extends ZodlawOptions>(
      config?: O,
    ): this &
      z.ZodType<
        boolean,
        this['_def'] &
          (this['_def'] extends {
            zodlawOptions: infer ZLO;
          }
            ? {zodlawOptions: ZLO & O}
            : {zodlawOptions: O})
      >;

    global(): ZodlawOptionsResult<this, {global: true}>;

    hidden(): ZodlawOptionsResult<this, {hidden: true}>;

    deprecated(message?: string): ZodlawOptionsResult<
      this,
      {
        deprecated: typeof message extends string ? string : true;
      }
    >;

    defaultDescription(
      defaultDescription?: string,
    ): ZodlawOptionsResult<this, {defaultDescription: string}>;

    group(name: string): ZodlawOptionsResult<this, {group: string}>;

    nargs(count: number): ZodlawOptionsResult<this, {nargs: number}>;
    zodlaw(): this['_def'] extends {
      zodlawOptions: infer Z extends ZodlawOptions;
    }
      ? Z
      : ZodlawOptions | undefined;
  }

  interface ZodString extends ZodlawType {
    option<O extends ZodlawOptions>(
      config?: O,
    ): this &
      z.ZodType<
        boolean,
        this['_def'] &
          (this['_def'] extends {
            zodlawOptions: infer ZLO;
          }
            ? {zodlawOptions: ZLO & O}
            : {zodlawOptions: O})
      >;

    global(): ZodlawOptionsResult<this, {global: true}>;

    hidden(): ZodlawOptionsResult<this, {hidden: true}>;

    deprecated(message?: string): ZodlawOptionsResult<
      this,
      {
        deprecated: typeof message extends string ? string : true;
      }
    >;

    defaultDescription(
      defaultDescription?: string,
    ): ZodlawOptionsResult<this, {defaultDescription: string}>;

    group(name: string): ZodlawOptionsResult<this, {group: string}>;

    nargs(count: number): ZodlawOptionsResult<this, {nargs: number}>;

    normalize(): ZodlawOptionsResult<this, {normalize: true}>;
    zodlaw(): this['_def'] extends {
      zodlawOptions: infer Z extends ZodlawOptions;
    }
      ? Z
      : ZodlawOptions | undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ZodEnum<T extends [string, ...string[]]> extends ZodlawType {
    option<O extends ZodlawOptions>(
      config?: O,
    ): this &
      z.ZodType<
        boolean,
        this['_def'] &
          (this['_def'] extends {
            zodlawOptions: infer ZLO;
          }
            ? {zodlawOptions: ZLO & O}
            : {zodlawOptions: O})
      >;

    global(): ZodlawOptionsResult<this, {global: true}>;

    hidden(): ZodlawOptionsResult<this, {hidden: true}>;

    deprecated(message?: string): ZodlawOptionsResult<
      this,
      {
        deprecated: typeof message extends string ? string : true;
      }
    >;

    defaultDescription(
      defaultDescription?: string,
    ): ZodlawOptionsResult<this, {defaultDescription: string}>;

    group(name: string): ZodlawOptionsResult<this, {group: string}>;

    nargs(count: number): ZodlawOptionsResult<this, {nargs: number}>;

    zodlaw(): this['_def'] extends {
      zodlawOptions: infer Z extends ZodlawOptions;
    }
      ? Z
      : ZodlawOptions | undefined;
  }

  interface ZodObject<
    T extends z.ZodRawShape,
    UnknownKeys extends z.UnknownKeysParam = z.UnknownKeysParam,
    Catchall extends z.ZodTypeAny = z.ZodTypeAny,
    Output = z.objectOutputType<T, Catchall, UnknownKeys>,
    Input = z.objectInputType<T, Catchall, UnknownKeys>,
  > extends ZodlawType {
    zodlaw(): this['_def'] extends {
      zodlawOptionsRecord: infer Z extends ZodlawOptionsRecord;
    }
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
        this['_def'] &
          (this['_def'] extends {
            zodlawOptionsRecord: infer Z extends ZodlawOptionsRecord;
          }
            ? {zodlawOptionsRecord: Z & ZodlawOptionsRecord}
            : {zodlawOptionsRecord: ZodlawOptionsRecord}),
        Input
      >;
  }
}
