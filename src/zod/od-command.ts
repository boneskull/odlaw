/* eslint-disable camelcase */
/**
 * Implementation for describing Yargs commands via Zod schemas.
 * @packageDocumentation
 */

// /* eslint-disable camelcase */
// import type {SetRequired} from 'type-fest';
import type * as y from 'yargs';
import z from 'zod';
import {zStringOrArray} from '../util';
import {ShapeToOdOptions} from './od-option';

export interface OdPositionalOptions {
  alias?: string | string[];
  demandOption?: boolean | string;
  describe?: string;
  normalize?: boolean;
}

export interface OdPositionalShape extends z.ZodRawShape {
  [x: string]: PositionalZodType;
}

export type PositionalZodType =
  | z.ZodString
  | z.ZodBoolean
  | z.ZodNumber
  | z.ZodEnum<any>
  | z.ZodOptional<any>
  | z.ZodDefault<any>;

const zPositionalZodType = z.enum([
  z.ZodFirstPartyTypeKind.ZodString,
  z.ZodFirstPartyTypeKind.ZodBoolean,
  z.ZodFirstPartyTypeKind.ZodNumber,
  z.ZodFirstPartyTypeKind.ZodEnum,
  z.ZodFirstPartyTypeKind.ZodOptional,
  z.ZodFirstPartyTypeKind.ZodDefault,
]);

const zOdPositionalShape = z.record(
  z.object({
    _def: z.object({
      typeName: zPositionalZodType,
    }),
  }),
);

export function isOdPositionalShape(value: any): value is OdPositionalShape {
  return zOdPositionalShape.safeParse(value).success;
}

export function isOdPositionalType(
  value: z.ZodTypeAny,
): value is PositionalZodType {
  return zPositionalZodType.safeParse(value._def.typeName).success;
}

export function positional<
  T extends AnyOdCommand,
  P extends PositionalZodType,
  Name extends string,
>(this: T, name: Name, schema: P, opts: OdPositionalOptions = {}) {
  if (!isOdPositionalType(schema)) {
    throw new TypeError('Unsupported positional schema');
  }

  const newSchema = schema._assignPositionalOptions(opts);
  const positionals = {...(this._def.odPositionals ?? {}), [name]: newSchema};

  return command(this, positionals);
}

/**
 * Equivalent to a `yargs` middleware function based on the shape of a
 * {@linkcode z.ZodObject}
 */
export type OdMiddleware<T extends z.ZodRawShape> = y.MiddlewareFunction<
  ShapeToOdOptions<T>
>;

/**
 * Equivalent to a `yargs` command handler function
 *
 */
export type OdCommandHandler<T extends z.ZodRawShape> = (
  args: y.ArgumentsCamelCase<ShapeToOdOptions<T>>,
) => void | Promise<void>;

/**
 * Options used when creating a yargs command from a {@linkcode z.ZodObject}
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
 * @param middlewares One ore more Yargs middleware functions, as array
 * @category Yargs API
 */
function middlewares<T extends AnyOdCommand>(
  this: T,
  middlewares: OdMiddleware<T['shape']>[],
): z.ZodObject<
  PartialShape<T['shape']>,
  T['_def']['unknownKeys'],
  T['_def']['catchall']
>;
/**
 * Assigns Yargs middleware to the command
 * @param middlewares One ore more Yargs middleware functions
 * @category Yargs API
 */
function middlewares<T extends AnyOdCommand>(
  this: T,
  ...middlewares: OdMiddleware<T['shape']>[]
): z.ZodObject<
  PartialShape<T['shape']>,
  T['_def']['unknownKeys'],
  T['_def']['catchall']
>;
function middlewares<T extends AnyOdCommand>(
  this: T,
  ...funcs: OdMiddleware<any>[] | [OdMiddleware<any>[]]
) {
  const middlewares = (
    Array.isArray(funcs[0]) ? funcs[0] : funcs
  ) as OdMiddleware<any>[];
  return new z.ZodObject({
    ...this._def,
    odCommandOptions: {
      ...this._def.odCommandOptions,
      middlewares,
    },
  });
}

/**
 * @todo Should we just return `undefined` if `this` is not a `ZodObject`?
 */
function _toYargsOptionsRecord(this: z.AnyZodObject) {
  return Object.fromEntries(
    Object.entries(this.shape).map(([name, value]) => [
      name,
      (value as any)._toYargsOptions(),
    ]),
  ) as Record<string, y.Options>;
}

function _toYargsCommand<
  S extends z.ZodRawShape,
  T extends z.ZodObject<S, any, any>,
  Y,
>(this: T, argv: y.Argv<Y>) {
  const {
    command,
    handler = () => {},
    middlewares,
    deprecated,
  } = this._def.odCommandOptions ?? {};
  const description =
    this._def.description ?? this._def.odCommandOptions?.describe ?? '';
  const options = this._toYargsOptionsRecord();

  const yargsCommand = argv.command(
    command,
    description,
    (argv: y.Argv<Y>) => {
      let newArgv: any = argv.options(options);

      if (this._def.odPositionals) {
        for (const [name, item] of Object.entries(this._def.odPositionals)) {
          const type = item._yargsType;

          // item; // ?
          newArgv = newArgv.positional(name, {
            ...type,
            ...item._def.odPositionalOptions,
          });
        }
      }

      return newArgv;
    },
    handler,
    middlewares,
    deprecated,
  );

  return yargsCommand;
}

export type OdCommandCreateParams<OCO extends OdCommandOptions<any>> =
  NonNullable<z.RawCreateParams> & OCO;

export type PartialShape<T extends z.ZodRawShape> = {
  [K in keyof T]: T[K] extends z.ZodOptional<any> ? T[K] : z.ZodOptional<T[K]>;
};

function createCommandFromZodObject<
  T extends z.AnyZodObject,
  OCO extends OdCommandOptions<T['shape']>,
>(
  obj: T,
  nameOrData:
    | OdCommandCreateParams<OCO>
    | OdPositionalShape
    | string
    | readonly string[],
  description?: string,
  handler?: OdCommandHandler<T['shape']>,
) {
  const newObj = obj.partial();
  let def = newObj._def;
  // OdCommandCreateParams extends OdCommandOptions
  if (isOdCommandOptions(nameOrData)) {
    const createParams = processCreateParams(
      nameOrData as OdCommandCreateParams<any>,
    );
    def = {
      ...def,
      ...createParams,
      odCommandOptions: {
        ...def.odCommandOptions,
        ...createParams.odCommandOptions,
      },
    };
  } else if (isOdPositionalShape(nameOrData)) {
    if (!def.odCommandOptions?.command) {
      throw new TypeError('Expected a command name; use command() first');
    }
    def = {...def, odPositionals: {...def.odPositionals, ...nameOrData}};
  } else if (typeof nameOrData === 'string' || Array.isArray(nameOrData)) {
    def = {
      ...def,
      description: description ?? def.description,
      odCommandOptions: {
        ...def.odCommandOptions,
        command: nameOrData,
        handler,
      },
    };
  } else {
    throw new TypeError('Invalid arguments');
  }

  return new z.ZodObject(def);
}

export function command<
  OCO extends OdCommandOptions<PartialShape<T['shape']>>,
  T extends z.AnyZodObject,
>(
  objectSchema: T,
  params?: OdCommandCreateParams<OCO>,
): z.ZodObject<
  PartialShape<T['shape']>,
  T['_def']['unknownKeys'],
  T['_def']['catchall']
>;
export function command<T extends z.AnyZodObject>(
  objectSchema: T,
  commandName: string | readonly string[],
  description?: string,
  handler?: OdCommandHandler<PartialShape<T['shape']>>,
): z.ZodObject<
  PartialShape<T['shape']>,
  T['_def']['unknownKeys'],
  T['_def']['catchall']
>;
export function command<T extends AnyOdCommand>(
  objectSchema: T,
  positionals: OdPositionalShape,
): z.ZodObject<
  PartialShape<T['shape']>,
  T['_def']['unknownKeys'],
  T['_def']['catchall']
>;
export function command<OCO extends OdCommandOptions<{}>>(
  params: OdCommandCreateParams<OCO>,
): z.ZodObject<{}>;
export function command(
  commandName: string | readonly string[],
  description?: string,
  handler?: OdCommandHandler<{}>,
): z.ZodObject<{}>;

export function command<T extends z.AnyZodObject>(
  this: T,
  commandName: string | readonly string[],
  description?: string,
  handler?: OdCommandHandler<PartialShape<T['shape']>>,
): z.ZodObject<
  PartialShape<T['shape']>,
  T['_def']['unknownKeys'],
  T['_def']['catchall']
>;
export function command<T extends AnyOdCommand>(
  this: T,
  positionals: OdPositionalShape,
): z.ZodObject<
  PartialShape<T['shape']>,
  T['_def']['unknownKeys'],
  T['_def']['catchall']
>;
export function command<
  OCO extends OdCommandOptions<any>,
  T extends z.AnyZodObject | AnyOdCommand,
>(
  this: T | unknown,
  a:
    | T
    | OdCommandCreateParams<OCO>
    | string
    | readonly string[]
    | OdPositionalShape,
  b?: OdCommandCreateParams<OCO> | string | readonly string[],
  c?: OdCommandHandler<any> | string,
  d?: OdCommandHandler<any>,
) {
  if (this instanceof z.ZodObject) {
    return createCommandFromZodObject(
      this,
      a as
        | OdCommandCreateParams<OCO>
        | OdPositionalShape
        | string
        | readonly string[],
      b as string | undefined,
      c as OdCommandHandler<any> | undefined,
    );
  }
  if (a instanceof z.ZodObject) {
    return createCommandFromZodObject(
      a,
      b as
        | OdCommandCreateParams<OCO>
        | OdPositionalShape
        | string
        | readonly string[],
      c as string | undefined,
      d as OdCommandHandler<any> | undefined,
    );
  }
  if (isOdCommandOptions(a)) {
    return new z.ZodObject({
      unknownKeys: 'strip',
      catchall: z.never(),
      typeName: z.ZodFirstPartyTypeKind.ZodObject,
      shape: () => ({}),
      odCommandOptions: a,
      description: a.describe,
    });
  }
  if (zStringOrArray.parse(a)) {
    const command = a;
    const description = b as string;
    const handler = c as OdCommandHandler<{}>;
    return new z.ZodObject({
      unknownKeys: 'strip',
      catchall: z.never(),
      typeName: z.ZodFirstPartyTypeKind.ZodObject,
      shape: () => ({}),
      odCommandOptions: {
        command: command as z.infer<typeof zStringOrArray>,
        handler,
      },
      description,
    });
  }
  throw new TypeError('Expected a command name, ZodObject, or configuration');
}

/**
 * This function lifted from Zod itself, with some modifications.
 * @author {@link https://github.com/colinhacks}
 */
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

const zOdCommandOptions = z.object({command: z.string()});

function isOdCommandOptions(value: any): value is OdCommandOptions<any> {
  return zOdCommandOptions.safeParse(value).success;
}

export type AnyOdCommand = z.ZodObject<
  any,
  any,
  any,
  z.ZodRawShape,
  z.ZodRawShape
> & {
  _def: {odCommandOptions: OdCommandOptions<any>};
};

export const OdCommandZodType = {
  _toYargsCommand,
  _toYargsOptionsRecord,
  command,
  middlewares,
  positional,
} as const;
