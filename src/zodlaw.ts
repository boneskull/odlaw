/* eslint-disable no-use-before-define */
import {Argv, InferredOptionTypes, Options as YOptions} from 'yargs';
import z from 'zod';

const kZodlaw = Symbol('zodlaw');

declare module 'zod' {
  type ZodlawType = 'option' | 'command' | 'positional';
  interface BaseZodlawOption {
    describe?: string;
    count?: boolean;
    defaultDescription?: string;
    deprecated?: boolean | string;
    global?: boolean;
    group?: string;
    hidden?: boolean;
    nargs?: number;
    normalize?: boolean;
  }

  interface ZodlawOption extends BaseZodlawOption {
    // zodlawType: 'option';
  }

  type YOptionArgs = Record<string, YOptions>;

  interface ZodlawCommand {
    // zodlawType: 'command';
  }

  interface ZodlawPositional extends BaseZodlawOption {
    // zodlawType: 'positional';
  }

  type YPositionalArgs = [name: string, config: ZodlawPositional];

  type ZodlawOptions = Record<string, ZodlawOption>;
  type ZodlawObject = ZodlawOptions;

  type ZodlawPrimitive = ZodlawOption;

  interface ZodObjectDef {
    zodlawOptions?: ZodlawOptions;
  }

  interface ZodBooleanDef {
    zodlawOption?: ZodlawOption;
  }

  // interface ZodType<Output = any, Def extends z.ZodTypeDef = z.ZodTypeDef, Input = Output> {

  // }

  // allowable types:
  // - boolean
  // - number
  // - string
  // - array
  // - enum

  interface ZodBoolean {
    zodlaw(): this['_def'] extends {zodlawOption: infer Z extends ZodlawOption}
      ? Z
      : ZodlawOption | undefined;

    option(config?: ZodlawOption): z.ZodBoolean &
      z.ZodType<
        boolean,
        z.ZodBooleanDef & this['_def'] extends {
          zodlawOption: infer Z extends ZodlawOption;
        }
          ? this['_def'] & {zodlawOption: Z & ZodlawOption}
          : this['_def'] & {zodlawOption: ZodlawOption}
      >;

    [kZodlaw]: true;
  }

  interface ZodObject<
    T extends z.ZodRawShape,
    UnknownKeys extends z.UnknownKeysParam = z.UnknownKeysParam,
    Catchall extends z.ZodTypeAny = z.ZodTypeAny,
    Output = z.objectOutputType<T, Catchall, UnknownKeys>,
    Input = z.objectInputType<T, Catchall, UnknownKeys>,
  > {
    zodlaw(): this['_def'] extends {zodlawOptions: infer Z}
      ? Z
      : ZodlawOptions | undefined;

    createParser(yargs: Argv): this['_def'] extends {
      zodlawOptions: infer Z extends ZodlawOptions;
    }
      ? Argv<Omit<Output, keyof Output>> & InferredOptionTypes<Z>
      : Argv;

    options(config?: Record<string, BaseZodlawOption>): z.ZodObject<
      T,
      UnknownKeys,
      Catchall,
      Output,
      Input
    > &
      z.ZodType<
        T,
        z.ZodObjectDef<T, UnknownKeys, Catchall> & this['_def'] extends {
          zodlawOptions: infer Z extends ZodlawOptions;
        }
          ? this['_def'] & {zodlawOptions: Z & ZodlawOptions}
          : this['_def'] & {zodlawOptions: ZodlawOptions},
        Input
      >;

    [kZodlaw]: true;
  }
}

function registerZodObject(zod: typeof z) {
  const proto = zod.ZodObject.prototype;

  if (proto[kZodlaw]) {
    return zod;
  }

  proto.zodlaw = function zodlaw(): z.ZodlawObject | undefined {
    return this._def.zodlawOptions;
  };

  proto.options = function options(
    config: Record<string, z.ZodlawOption> = {},
  ) {
    const zodlawOptions = this.zodlaw();
    if (zodlawOptions) {
      this._def.zodlawOptions = {...zodlawOptions, ...config};
    } else {
      this._def.zodlawOptions = config;
    }

    const This = (this as any).constructor;
    return new This(this._def);
  };

  proto.createParser = function createParser(yargs: Argv) {
    /**
     * Any `ZodlawOptions` created via this `ZodObject` itself
     */
    const zodlawOpts = this.zodlaw();
    if (zodlawOpts) {
      // TODO: filter on supported types
      for (const key of this._getCached().keys) {
        const value = this.shape[key];
        const yOpts = (zodlawOpts[key] ??= {});

        // TODO: breakout into its own function to pull in attributes from the zod schema
        // which don't exist in ZodlawOption
        const {description} = value._def ?? {};
        if (description) {
          yOpts.describe ??= description;
        }

        /**
         * Any `ZodlawOption` created on the `ZodObject` property itself
         */
        const zodlawOpt = value.zodlaw();
        Object.assign(yOpts, zodlawOpt);
      }
      return yargs.options(zodlawOpts);
    }
    return yargs;
  };

  proto[kZodlaw] = true;

  return zod;
}

function registerZodBoolean(zod: typeof z) {
  const proto = zod.ZodBoolean.prototype;

  if (proto[kZodlaw]) {
    return zod;
  }

  proto.zodlaw = function zodlaw(): z.ZodlawOption | undefined {
    return this._def.zodlawOption;
  };

  proto.option = function option(config?: z.ZodlawOption) {
    this._def.zodlawOption = {...this._def.zodlawOption, ...config};

    const This = (this as any).constructor;
    return new This(this._def);
  };

  return zod;
}

export function register(zod: typeof z) {
  zod = registerZodObject(zod);
  zod = registerZodBoolean(zod);
  return zod;
}
