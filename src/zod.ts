import type {
  Argv,
  InferredOptionType,
  InferredOptionTypes,
  Options as YOptions,
} from 'yargs';
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
    | 'type'
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
   * @typeArgument {ZodlawData} The value returned by {@linkcode _zodlaw}
   */
  interface ZodlawType<ZodlawData> {
    /**
     * @internal
     */
    [kZodlaw]: true;

    /**
     * @private
     */
    _newThis(): this;

    _zodlaw(): ZodlawData | undefined;
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
   * Anything that has an `option()` method should extend this _and narrow each method_.
   */
  interface ZodlawOptionType extends ZodlawType<ZodlawOptions> {
    _defaultType: ZodlawOptions['type'];
    option(config?: ZodlawOptions): ZodlawOptionType;

    global?(): ZodlawOptionType;

    hidden?(): ZodlawOptionType;

    deprecated?(message?: string): ZodlawOptionType;

    defaultDescription?(defaultDescription?: string): ZodlawOptionType;

    group?(name: string): ZodlawOptionType;

    count?(): ZodlawOptionType;

    nargs?(count: number): ZodlawOptionType;

    normalize?(): ZodlawOptionType;

    /**
     * This function is expected to be called within the context of a parent
     * `ZodObject`. That `ZodObject` may be called with `.strict()`, and if so,
     * the `strict` parameter would be `true` here.
     *
     * Generally, you _don't_ want to demand options on the CLI, because it's
     * not ergonomic; provide _sensible defaults_ instead.
     */
    _configureParser(name: string, yargs: Argv, strict?: boolean): Argv;
  }

  /**
   * Convenience type for returning a new {@linkcode z.ZodType} instance with its
   * {@linkcode z.ZodType._def _def} updated, containing changed {@linkcode ZodlawOptions}
   *
   * On the implementation side, see {@linkcode ZodlawType._newThis}
   */
  type ZodlawOptionsResult<
    Z extends z.ZodTypeAny & ZodlawOptionType,
    OValue extends Partial<ZodlawOptions>,
  > = Z & {
    _def: Z['_def'] & {zodlawOptions: OValue};
  };

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

    _zodlaw(): this['_def'] extends {
      zodlawOptions: infer Z extends ZodlawOptions;
    }
      ? Z
      : ZodlawOptions | undefined;

    /**
     * This forces the type to `number` via {@linkcode InferredOptionType}
     * regardless of `type`
     */
    count(): ZodlawOptionsResult<this, {count: true}>;

    _configureParser<const OptName extends string, A, Strict extends boolean>(
      name: OptName,
      yargs: Argv<A>,
      strict?: Strict,
    ): this['_def'] extends {
      zodlawOptions: infer Z extends ZodlawOptions;
    }
      ? Argv<
          Omit<A, OptName> & {
            [K in OptName]: InferredOptionType<
              Z & {type: 'boolean'; demandOption: Strict}
            >;
          }
        >
      : Argv<
          Omit<A, OptName> & {
            [K in OptName]: InferredOptionType<{
              type: 'boolean';
              demandOption: Strict;
            }>;
          }
        >;
  }

  interface ZodNumber extends ZodlawOptionType {
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
    _zodlaw(): this['_def'] extends {
      zodlawOptions: infer Z extends ZodlawOptions;
    }
      ? Z
      : ZodlawOptions | undefined;

    _configureParser<const OptName extends string, A, Strict extends boolean>(
      name: OptName,
      yargs: Argv<A>,
      strict?: Strict,
    ): this['_def'] extends {
      zodlawOptions: infer Z extends ZodlawOptions;
    }
      ? Argv<
          Omit<A, OptName> & {
            [K in OptName]: InferredOptionType<
              Z & {type: 'number'; demandOption: Strict}
            >;
          }
        >
      : Argv<
          Omit<A, OptName> & {
            [K in OptName]: InferredOptionType<{
              type: 'number';
              demandOption: Strict;
            }>;
          }
        >;
  }

  interface ZodString extends ZodlawOptionType {
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

    _zodlaw(): this['_def'] extends {
      zodlawOptions: infer Z extends ZodlawOptions;
    }
      ? Z
      : ZodlawOptions | undefined;

    _configureParser<const OptName extends string, A, Strict extends boolean>(
      name: OptName,
      yargs: Argv<A>,
      strict?: Strict,
    ): this['_def'] extends {
      zodlawOptions: infer Z extends ZodlawOptions;
    }
      ? Argv<
          Omit<A, OptName> & {
            [K in OptName]: InferredOptionType<
              Z & {
                type: 'string';
                demandOption: Strict;
              }
            >;
          }
        >
      : Argv<
          Omit<A, OptName> & {
            [K in OptName]: InferredOptionType<{
              type: 'string';
              demandOption: Strict;
            }>;
          }
        >;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ZodEnum<T extends [string, ...string[]]> extends ZodlawOptionType {
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

    _zodlaw(): this['_def'] extends {
      zodlawOptions: infer Z extends ZodlawOptions;
    }
      ? Z
      : ZodlawOptions | undefined;

    _configureParser<const OptName extends string, A, Strict extends boolean>(
      name: OptName,
      yargs: Argv<A>,
      strict?: Strict,
    ): this['_def'] extends {
      zodlawOptions: infer Z extends ZodlawOptions;
      values: infer T;
    }
      ? Argv<
          Omit<A, OptName> & {
            [K in OptName]: InferredOptionType<
              Z & {choices: T; demandOption: Strict}
            >;
          }
        >
      : Argv<
          Omit<A, OptName> & {
            [K in OptName]: InferredOptionType<{
              choices: T;
              demandOption: Strict;
            }>;
          }
        >;
  }

  type blah = InferredOptionType<{choices: ['a', 'b', 'c']}>;

  interface ZodObject<
    T extends z.ZodRawShape,
    UnknownKeys extends z.UnknownKeysParam = z.UnknownKeysParam,
    Catchall extends z.ZodTypeAny = z.ZodTypeAny,
    Output = z.objectOutputType<T, Catchall, UnknownKeys>,
    Input = z.objectInputType<T, Catchall, UnknownKeys>,
  > extends ZodlawType<ZodlawOptionsRecord> {
    _zodlaw(): this['_def'] extends {
      zodlawOptionsRecord: infer Z extends ZodlawOptionsRecord;
    }
      ? Z
      : ZodlawOptionsRecord | undefined;

    /**
     * @param yargs Yargs instance
     * @returns A Yargs instance with whatever config comes out of the schema
     */
    _configureParser(yargs: Argv): this['_def'] extends {
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
