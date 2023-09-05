/* eslint-disable no-use-before-define */
import type * as yargs from 'yargs';
import z from 'zod';
import './zod';
export const kZodlaw: unique symbol = Symbol('kZodlaw');

function isZodEffects(schema: any): schema is z.ZodEffects<z.ZodTypeAny> {
  return schema?._def?.typeName === z.ZodFirstPartyTypeKind.ZodEffects;
}

function isZodDefault(schema: any): schema is z.ZodDefault<z.ZodTypeAny> {
  return schema?._def?.typeName === z.ZodFirstPartyTypeKind.ZodDefault;
}

function isZodBranded(schema: any): schema is z.ZodBranded<any, any> {
  return schema?._def?.typeName === z.ZodFirstPartyTypeKind.ZodBranded;
}

/**
 * Utilties for the patchers
 * @internal
 */
const PatchUtils = {
  zodTypeToYargsType(schema: z.ZodTypeAny): yargs.Options['type'] {
    const source = PatchUtils.getSource(schema);
    if (
      source instanceof z.ZodString ||
      source instanceof z.ZodEnum ||
      (source instanceof z.ZodArray &&
        source.element._def.typeName === z.ZodFirstPartyTypeKind.ZodString)
    ) {
      return 'string';
    }
    if (source instanceof z.ZodBoolean) {
      return 'boolean';
    }
    if (source instanceof z.ZodNumber) {
      return 'number';
    }
    throw new TypeError('Unknown type: ' + source._def.typeName);
  },

  isZodEffects(schema: z.ZodTypeAny): schema is z.ZodEffects<z.ZodTypeAny> {
    return schema._def.typeName === z.ZodFirstPartyTypeKind.ZodEffects;
  },

  getSource(schema: z.ZodTypeAny): z.ZodTypeAny {
    if (isZodEffects(schema)) {
      return schema.sourceType();
    }
    if (isZodDefault(schema)) {
      return PatchUtils.getSource(schema._def.innerType);
    }
    if (isZodBranded(schema)) {
      return PatchUtils.getSource(schema._def.type);
    }
    return schema;
  },

  clone<Z extends z.ZodTypeAny>(schema: Z): Z {
    return new (schema.constructor as any)(schema._def);
  },

  /**
   * Type guard for {@linkcode ZodlawOptionType}
   * @param value Some Zod Type
   * @returns `true` if the `ZodType` is also a `ZodlawOptionType`
   */
  isZodlawOptionType<T extends z.ZodTypeAny>(
    value: T,
  ): value is T & z.ZodlawOptionType<any, T> {
    return (
      '_zodlaw' in value &&
      typeof value._zodlaw === 'function' &&
      'option' in value &&
      typeof value.option === 'function'
    );
  },

  /**
   * This is fairly defensive, but I wanted to be explicit about what we're passing around.
   * @param zlOpts - {@linkcode ZodlawOptions}
   * @param classSpecificOpts - Extra config that is specific to the `ZodType`
   * @returns Options for `yargs.option()`
   */
  zlOptsToYOpts(
    zlOpts: z.ZodlawOptions,
    classSpecificOpts: Partial<yargs.Options>,
  ): yargs.Options {
    return {
      alias: zlOpts.alias,
      count: zlOpts.count,
      defaultDescription: zlOpts.defaultDescription,
      deprecated: zlOpts.deprecated,
      global: zlOpts.global,
      group: zlOpts.group,
      hidden: zlOpts.hidden,
      nargs: zlOpts.nargs,
      ...classSpecificOpts,
    };
  },
};

export function register(zod: typeof z) {
  const proto = zod.ZodType.prototype;

  if (proto[kZodlaw]) {
    return zod;
  }

  Object.assign(proto, <ThisType<z.ZodTypeAny>>{
    [kZodlaw]: true,

    alias(alias: string | string[]) {
      return this.option({alias});
    },

    global() {
      return this.option({global: true});
    },

    hidden() {
      return this.option({hidden: true});
    },

    defaultDescription(defaultDescription: string) {
      return this.option({defaultDescription});
    },

    group(group: string) {
      return this.option({group});
    },

    count() {
      return this.option({count: true});
    },

    normalize() {
      return this.option({normalize: true});
    },

    nargs(nargs: number) {
      return this.option({nargs});
    },

    option(config?: z.ZodlawOptions) {
      const zodlawOptions = this._def.zodlawOptions();
      this._def.zodlawOptions = zodlawOptions
        ? {...zodlawOptions, ...config}
        : config;

      return PatchUtils.clone(this);
    },

    options(config?: z.ZodlawOptionsRecord) {
      const zodlawOptionsRecord = this._def.zodlawOptionsRecord;
      this._def.zodlawOptionsRecord = zodlawOptionsRecord
        ? {...zodlawOptionsRecord, ...config}
        : config;

      return PatchUtils.clone(this);
    },

    _toYargsOptions(strict: boolean): yargs.Options {
      return {
        ...this._def.zodlawOptions,
        demandOption: strict,
        describe: this.description ?? this._def.zodlawOptions?.describe,
        type: PatchUtils.zodTypeToYargsType(this),
      };
    },

    _toYargs<Y>(argv: yargs.Argv<Y>) {
      if (!(this instanceof z.ZodObject)) {
        throw new TypeError('Expected ZodObject');
      }

      /**
       * Any `ZodlawOptions` created via this `ZodObject` itself
       */
      const zlOptionsRecord = this._def.zodlawOptionsRecord;

      if (zlOptionsRecord) {
        // todo: allow `.strict()` on `AnyZodlawType`
        const strict =
          'unknownKeys' in this._def && this._def.unknownKeys === 'strict';
        return argv.options(
          Object.entries(this.shape).reduce(
            (zlOptionsRecord, [key, value]) => ({
              ...zlOptionsRecord,

              [key]: {
                ...zlOptionsRecord[key],
                ...(value as z.ZodTypeAny)._toYargsOptions(strict),
              },
            }),
            zlOptionsRecord,
          ),
        );
      }
      return argv;
    },
  });

  return zod;
}
