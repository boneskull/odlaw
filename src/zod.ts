import type {SimpleMerge as Merge} from 'type-fest/source/merge.d.ts';
import type {Argv, InferredOptionTypes, Options as YOptions} from 'yargs';
import z from 'zod';
import type {kZodlaw} from './zodlaw';

declare module 'zod' {
  /**
   * Option config from {@linkcode YOptions yargs.Options} which cannot be expressed via Zod itself
   */
  type ZodlawOptions = Pick<
    YOptions,
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
     * @internal
     */
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
    option(config?: ZodlawOptions): ZodlawOptionType;

    global(): ZodlawOptionType;

    hidden(): ZodlawOptionType;

    deprecated<M extends string | boolean>(message?: M): ZodlawOptionType;

    defaultDescription<M extends string>(
      defaultDescription?: M,
    ): ZodlawOptionType;

    group<G extends string>(group: G): ZodlawOptionType;

    count?(): ZodlawOptionType;

    nargs?(count: number): ZodlawOptionType;

    normalize?(): ZodlawOptionType;

    alias<A extends string | string[]>(alias: A): ZodlawOptionType;

    /**
     * This function is expected to be called within the context of a parent
     * `ZodObject`. That `ZodObject` may be called with `.strict()`, and if so,
     * the `strict` parameter would be `true` here.
     *
     * Generally, you _don't_ want to demand options on the CLI, because it's
     * not ergonomic; provide _sensible defaults_ instead.
     */
    _configureOptions(strict?: boolean): YOptions;
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
    _def: Merge<
      Z['_def'],
      Z['_def'] extends {zodlawOptions: infer ZLO}
        ? {zodlawOptions: Merge<ZLO, OValue>}
        : {zodlawOptions: OValue}
    >;
  };

  interface ZodArray<
    T extends z.ZodTypeAny,
    Cardinality extends z.ArrayCardinality = 'many',
  > extends ZodlawOptionType {
    option<O extends ZodlawOptions>(
      config?: O,
    ): this &
      z.ZodType<
        z.arrayOutputType<T, Cardinality>,
        this['_def'] &
          (this['_def'] extends {
            zodlawOptions: infer ZLO;
          }
            ? {zodlawOptions: Merge<ZLO, O>}
            : {zodlawOptions: O})
      >;
    alias<const Alias extends string | string[]>(
      alias: Alias,
    ): ZodlawOptionsResult<this, {alias: Alias}>;

    defaultDescription<const M extends string>(
      defaultDescription?: M,
    ): ZodlawOptionsResult<this, {defaultDescription: M}>;

    group<const G extends string>(
      group: G,
    ): ZodlawOptionsResult<this, {group: G}>;

    global(): ZodlawOptionsResult<this, {global: true}>;

    hidden(): ZodlawOptionsResult<this, {hidden: true}>;

    deprecated<const M extends string | boolean>(
      message?: M,
    ): ZodlawOptionsResult<
      this,
      {
        deprecated: M;
      }
    >;

    nargs(count: number): ZodlawOptionsResult<this, {nargs: number}>;

    normalize(): ZodlawOptionsResult<this, {normalize: true}>;

    _zodlaw(): this['_def'] extends {
      zodlawOptions: infer Z extends ZodlawOptions;
    }
      ? Z
      : ZodlawOptions | undefined;

    _configureOptions<Strict extends boolean>(
      strict?: Strict,
    ): this['_def'] extends {
      zodlawOptions: infer ZLO;
    }
      ? Merge<ZLO, {type: 'string'; demandOption: Strict; array: true}>
      : {
          type: 'string';
          array: true;
          demandOption: Strict;
        };
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
            ? {zodlawOptions: Merge<ZLO, O>}
            : {zodlawOptions: O})
      >;

    alias<const Alias extends string | string[]>(
      alias: Alias,
    ): ZodlawOptionsResult<this, {alias: Alias}>;

    defaultDescription<const M extends string>(
      defaultDescription?: M,
    ): ZodlawOptionsResult<this, {defaultDescription: M}>;

    group<const G extends string>(
      group: G,
    ): ZodlawOptionsResult<this, {group: G}>;

    global(): ZodlawOptionsResult<this, {global: true}>;

    hidden(): ZodlawOptionsResult<this, {hidden: true}>;

    deprecated<const M extends string | boolean>(
      message?: M,
    ): ZodlawOptionsResult<
      this,
      {
        deprecated: M;
      }
    >;

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

    _configureOptions<Strict extends boolean>(
      strict?: Strict,
    ): this['_def'] extends {
      zodlawOptions: infer ZLO;
    }
      ? Merge<ZLO, {type: 'boolean'; demandOption: Strict}>
      : {
          type: 'boolean';
          demandOption: Strict;
        };
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
    alias<const Alias extends string | string[]>(
      alias: Alias,
    ): ZodlawOptionsResult<this, {alias: Alias}>;

    global(): ZodlawOptionsResult<this, {global: true}>;

    hidden(): ZodlawOptionsResult<this, {hidden: true}>;

    deprecated<const M extends string | boolean>(
      message?: M,
    ): ZodlawOptionsResult<
      this,
      {
        deprecated: M;
      }
    >;

    defaultDescription<const M extends string>(
      defaultDescription?: M,
    ): ZodlawOptionsResult<this, {defaultDescription: M}>;

    group<const G extends string>(
      group: G,
    ): ZodlawOptionsResult<this, {group: G}>;

    nargs(count: number): ZodlawOptionsResult<this, {nargs: number}>;
    _zodlaw(): this['_def'] extends {
      zodlawOptions: infer Z extends ZodlawOptions;
    }
      ? Z
      : ZodlawOptions | undefined;

    _configureOptions<Strict extends boolean>(
      strict?: Strict,
    ): this['_def'] extends {
      zodlawOptions: infer ZLO;
    }
      ? Merge<ZLO, {type: 'number'; demandOption: Strict}>
      : {
          type: 'number';
          demandOption: Strict;
        };
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

    alias<const Alias extends string | string[]>(
      alias: Alias,
    ): ZodlawOptionsResult<this, {alias: Alias}>;

    defaultDescription<const M extends string>(
      defaultDescription?: M,
    ): ZodlawOptionsResult<this, {defaultDescription: M}>;

    group<const G extends string>(
      group: G,
    ): ZodlawOptionsResult<this, {group: G}>;

    global(): ZodlawOptionsResult<this, {global: true}>;

    hidden(): ZodlawOptionsResult<this, {hidden: true}>;

    deprecated<const M extends string | boolean>(
      message?: M,
    ): ZodlawOptionsResult<
      this,
      {
        deprecated: M;
      }
    >;

    nargs(count: number): ZodlawOptionsResult<this, {nargs: number}>;

    normalize(): ZodlawOptionsResult<this, {normalize: true}>;

    _zodlaw(): this['_def'] extends {
      zodlawOptions: infer Z extends ZodlawOptions;
    }
      ? Z
      : ZodlawOptions | undefined;

    _configureOptions<Strict extends boolean>(
      strict?: Strict,
    ): this['_def'] extends {
      zodlawOptions: infer ZLO;
    }
      ? Merge<ZLO, {type: 'string'; demandOption: Strict}>
      : {
          type: 'string';
          demandOption: Strict;
        };
  }

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
    alias<const Alias extends string | string[]>(
      alias: Alias,
    ): ZodlawOptionsResult<this, {alias: Alias}>;

    defaultDescription<const M extends string>(
      defaultDescription?: M,
    ): ZodlawOptionsResult<this, {defaultDescription: M}>;

    group<const G extends string>(
      group: G,
    ): ZodlawOptionsResult<this, {group: G}>;

    global(): ZodlawOptionsResult<this, {global: true}>;

    hidden(): ZodlawOptionsResult<this, {hidden: true}>;

    deprecated<const M extends string | boolean>(
      message?: M,
    ): ZodlawOptionsResult<
      this,
      {
        deprecated: M;
      }
    >;

    nargs(count: number): ZodlawOptionsResult<this, {nargs: number}>;

    _zodlaw(): this['_def'] extends {
      zodlawOptions: infer Z extends ZodlawOptions;
    }
      ? Z
      : ZodlawOptions | undefined;

    _configureOptions<Strict extends boolean>(
      strict?: Strict,
    ): this['_def'] extends {
      zodlawOptions: infer ZLO;
    }
      ? Merge<ZLO, {choices: T; demandOption: Strict}>
      : {
          choices: T;
          demandOption: Strict;
        };
  }

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
    _configureParser<Y>(yargs: Argv<Y>): this['_def'] extends {
      zodlawOptionsRecord: infer Z extends ZodlawOptionsRecord;
    }
      ? Argv<Merge<Y, InferredOptionTypes<Z>>>
      : Argv<Y>;

    options<Z extends ZodlawOptionsRecord>(
      config?: Z,
    ): z.ZodObject<T, UnknownKeys, Catchall, Output, Input> &
      z.ZodType<
        T,
        this['_def'] &
          (this['_def'] extends {
            zodlawOptionsRecord: infer ZLO;
          }
            ? {zodlawOptionsRecord: Merge<ZLO, Z>}
            : {zodlawOptionsRecord: Z}),
        Input
      >;
  }
}
