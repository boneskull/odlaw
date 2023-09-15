/* eslint-disable camelcase */
/**
 * Implementation for describing Yargs commands via Zod schemas.
 * @packageDocumentation
 */

// /* eslint-disable camelcase */
// import type {SetRequired} from 'type-fest';
import type * as y from 'yargs';
import z from 'zod';
import {ShapeToOdOptions} from './od-option';
import {createPositional, isPositionalTuple} from './od-positional';
import {getYargsTypeForPositional} from './yargs';

/**
 * Equivalent to a `yargs` middleware function based on the shape of a
 * {@linkcode z.ZodObject} or {@linkcode OdCommand}
 */
export type OdMiddleware<T extends z.ZodRawShape> = y.MiddlewareFunction<
  ShapeToOdOptions<T>
>;

/**
 * Equivalent to a `yargs` command handler function
 *
 */
export type OdCommandHandler<T extends z.ZodRawShape> = (
  args: y.ArgumentsCamelCase<
    y.InferredOptionTypes<ShapeToOdOptions<PartialShape<T>>>
  >,
) => void | Promise<void>;

/**
 * Options used when creating a yargs command from a {@linkcode OdCommand}
 */
export interface OdCommandOptions<T extends z.ZodRawShape> {
  /**
   * Name of comman or array of names (aliases)
   */
  command: string | readonly string[];
  /**
   * Handler for the command
   */
  handler?: OdCommandHandler<T>;

  /**
   * Middleware function(s) for the command
   */
  middlewares?: OdMiddleware<T>[];

  /**
   * Whether the command is deprecated. If `string`, a message
   */
  deprecated?: boolean | string;

  describe?: string;
}

/**
 * Assigns Yargs middleware to the command
 * @param middlewares One ore more Yargs middleware functions
 * @category Yargs API
 */
function middlewares(
  this: z.AnyZodObject,
  middlewares: OdMiddleware<z.AnyZodObject['shape']>[],
): z.ZodObject<
  {
    [K in keyof z.AnyZodObject['shape']]: z.ZodOptional<
      z.AnyZodObject['shape'][K]
    >;
  },
  z.AnyZodObject['_def']['unknownKeys'],
  z.AnyZodObject['_def']['catchall']
>;

function middlewares(
  this: z.AnyZodObject,
  ...middlewares: OdMiddleware<z.AnyZodObject['shape']>[]
): z.ZodObject<
  {
    [K in keyof z.AnyZodObject['shape']]: z.ZodOptional<
      z.AnyZodObject['shape'][K]
    >;
  },
  z.AnyZodObject['_def']['unknownKeys'],
  z.AnyZodObject['_def']['catchall']
>;
/**
 *
 * @param middlewares One ore more Yargs middleware functions
 * @returns New {@linkcode OdCommand} with the given middlewares
 */
function middlewares(
  this: z.AnyZodObject,
  ...middlewares:
    | OdMiddleware<z.AnyZodObject['shape']>[]
    | [OdMiddleware<z.AnyZodObject['shape']>[]]
) {
  if (Array.isArray(middlewares[0])) {
    return new z.ZodObject({
      ...this._def,
      unknownKeys: 'passthrough',
      odCommandOptions: {
        ...this._def.odCommandOptions,
        middlewares: middlewares[0],
      },
    });
  }
  return new z.ZodObject({
    ...this._def,
    unknownKeys: 'passthrough',
    odCommandOptions: {
      ...this._def.odCommandOptions,
      middlewares: middlewares as any,
    },
  });
}

export const OdCommandZodType = {
  command: createOdCommand,

  _toYargsCommand<
    Y,
    S extends z.ZodRawShape,
    T extends z.ZodObject<S, any, any>,
  >(this: T, argv: y.Argv<Y>) {
    const {command, handler, middlewares, deprecated} =
      this._def.odCommandOptions ?? {};
    const description =
      this._def.description ?? this._def.odCommandOptions?.describe ?? '';
    const options = this._toYargsOptionsRecord();

    // type YOptions = y.Argv<
    //   y.Omit<Y, keyof typeof options> & y.InferredOptionTypes<typeof options>
    // >;
    // const optionsBuilder = (argv: y.Argv<Y>) => argv.options( options);

    const yargsCommand = argv.command(
      command,
      description,
      (argv: y.Argv<Y>) => {
        let newArgv = argv.options(options);
        const posTuple = this.shape._;
        if (isPositionalTuple(posTuple)) {
          const opts = posTuple._def.odPositionalOptions ?? [];

          if (opts.length !== posTuple.items.length) {
            throw new ReferenceError('Positional options are out of sync');
          }

          for (let i = 0; i < posTuple.items.length; i++) {
            const {name, ...rest} = opts[i];
            const item = posTuple.items[i];
            const type = getYargsTypeForPositional(item);
            if (!type) {
              throw new TypeError('Unsupported positional schema');
            }
            newArgv = newArgv.positional(name, {...type, ...rest});
          }
          return newArgv;
        }
        return newArgv;
      },
      handler,
      middlewares,
      deprecated,
    );

    return yargsCommand;
  },

  middlewares,

  /**
   * @todo Should we just return `undefined` if `this` is not a `ZodObject`?
   */
  _toYargsOptionsRecord(this: z.AnyZodObject) {
    const record: Record<string, y.Options> = {};
    for (const key of Object.keys(this._def.shape)) {
      record[key] = this.shape[key]._toYargsOptions();
    }
    return record;
  },

  positional: createPositional,
};

export type OdCommandCreateParams<OCO extends OdCommandOptions<any>> =
  NonNullable<z.RawCreateParams> & OCO;

export type PartialShape<T extends z.ZodRawShape> = {
  [K in keyof T]: T[K] extends z.ZodOptional<any> ? T[K] : z.ZodOptional<T[K]>;
};

export function createOdCommand<
  OCO extends OdCommandOptions<T['shape']>,
  T extends z.AnyZodObject,
>(
  this: unknown,
  zObj: T,
  params?: OdCommandCreateParams<OCO>,
): z.ZodObject<
  PartialShape<T['shape']>,
  T['_def']['unknownKeys'],
  T['_def']['catchall']
>;
export function createOdCommand<T extends z.AnyZodObject>(
  this: unknown,
  zObj: T,
  name: string | readonly string[],
  description?: string,
  handler?: OdCommandHandler<T['shape']>,
): z.ZodObject<
  PartialShape<T['shape']>,
  T['_def']['unknownKeys'],
  T['_def']['catchall']
>;
export function createOdCommand<OCO extends OdCommandOptions<z.ZodRawShape>>(
  this: z.AnyZodObject | unknown,
  params: OdCommandCreateParams<OCO>,
): z.ZodObject<z.ZodRawShape>;
export function createOdCommand(
  this: z.AnyZodObject | unknown,
  name: string | readonly string[],
  description?: string,
  handler?: OdCommandHandler<z.ZodRawShape>,
): z.ZodObject<z.ZodRawShape>;
export function createOdCommand<
  OCO extends OdCommandOptions<T['shape'] | z.ZodRawShape>,
  T extends z.AnyZodObject,
>(
  this: z.AnyZodObject | unknown,
  a: T | OdCommandCreateParams<OCO> | string | readonly string[],
  b?: OdCommandCreateParams<OCO> | string | readonly string[],
  c?: OdCommandHandler<T['shape'] | z.ZodRawShape> | string,
  d?: OdCommandHandler<T['shape']>,
):
  | z.ZodObject<
      PartialShape<T['shape']>,
      T['_def']['unknownKeys'],
      T['_def']['catchall']
    >
  | z.ZodObject<{}> {
  if (this instanceof z.ZodObject) {
    if (isOdCommandOptions(a)) {
      return createOdCommand(this, a as OdCommandCreateParams<any>);
    } else if (a instanceof z.ZodObject) {
      throw new TypeError('Expected a command name or configuration');
    }
    const {shape} = this;
    return createOdCommand(
      this,
      a as string | readonly string[],
      b as string | undefined,
      c as OdCommandHandler<typeof shape> | undefined,
    );
  }
  if (a instanceof z.ZodObject) {
    const zPartial = a.partial();
    if (b && typeof b === 'object' && !Array.isArray(b)) {
      const createParams = processCreateParams(b as OdCommandCreateParams<any>);
      return new z.ZodObject({
        ...zPartial._def,
        unknownKeys: 'passthrough',
        ...createParams,
        odCommandOptions: {
          ...zPartial._def.odCommandOptions,
          ...createParams.odCommandOptions,
        },
      });
    } else if (b && (typeof b === 'string' || Array.isArray(b))) {
      return new z.ZodObject({
        ...zPartial._def,
        description: (c as string) ?? zPartial.description,
        unknownKeys: 'passthrough',
        odCommandOptions: {
          ...zPartial._def.odCommandOptions,
          command: b,
          handler: d,
        },
      });
    } else {
      throw new TypeError(
        'Expected a string or configuration as second argument',
      );
    }
  }

  if (isOdCommandOptions(a)) {
    return new z.ZodObject({
      unknownKeys: 'passthrough',
      catchall: z.never(),
      typeName: z.ZodFirstPartyTypeKind.ZodObject,
      shape: () => ({}),
      odCommandOptions: a,
      description: a.describe,
    });
  }
  if (typeof a === 'string' || Array.isArray(a)) {
    const command = a;
    const description = b as string;
    const handler = c as OdCommandHandler<{}>;
    return new z.ZodObject({
      unknownKeys: 'passthrough',
      catchall: z.never(),
      typeName: z.ZodFirstPartyTypeKind.ZodObject,
      shape: () => ({}),
      odCommandOptions: {command, handler},
      description,
    });
  }
  throw new TypeError('Expected a command name, ZodObject, or configuration');
}

function processCreateParams<
  OCO extends OdCommandOptions<any>,
  P extends OdCommandCreateParams<OCO>,
>(params: P) {
  const {errorMap, invalid_type_error, required_error, description, ...rest} =
    params;
  if (errorMap && (invalid_type_error || required_error)) {
    throw new Error(
      `Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`,
    );
  }
  if (errorMap) {
    return {errorMap, description, odCommandOptions: rest};
  }
  const customMap: z.ZodErrorMap = (iss, ctx) => {
    if (iss.code !== 'invalid_type') return {message: ctx.defaultError};
    if (typeof ctx.data === 'undefined') {
      return {message: required_error ?? ctx.defaultError};
    }
    return {message: invalid_type_error ?? ctx.defaultError};
  };
  return {errorMap: customMap, description, odCommandOptions: rest};
}

function isOdCommandOptions(value: any): value is OdCommandOptions<any> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'command' in value &&
    typeof value.command === 'string'
  );
}

export interface CommandDef<T extends z.ZodRawShape> extends z.ZodObjectDef<T> {
  odCommandOptions: OdCommandOptions<T>;
}

export type OdCommand<
  T extends z.ZodRawShape,
  UnknownKeys extends z.UnknownKeysParam = z.UnknownKeysParam,
  Catchall extends z.ZodTypeAny = z.ZodTypeAny,
  Output = z.objectOutputType<T, Catchall, UnknownKeys>,
  Input = z.objectInputType<T, Catchall, UnknownKeys>,
> = z.ZodObject<T, UnknownKeys, Catchall, Output, Input> & {
  _def: {odCommandOptions: OdCommandOptions<T>};
};
