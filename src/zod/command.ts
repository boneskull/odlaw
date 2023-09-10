/* eslint-disable @typescript-eslint/ban-types */
/**
 * Implementation for describing Yargs commands via Zod schemas.
 * @packageDocumentation
 */

/* eslint-disable camelcase */
import {SetOptional, SetRequired} from 'type-fest';
import type * as y from 'yargs';
import z from 'zod';
import {YargsifyOdOptions} from './option';

export type ShapeToOdOptions<
  S extends z.ZodRawShape,
  Strict extends boolean = false,
> = {
  [K in keyof S]: YargsifyOdOptions<S[K], {demandOption: Strict}>;
};

export type ZodObjectToYargsOptionsRecord<T extends z.AnyZodObject> =
  ShapeToOdOptions<
    T['shape'],
    T['_def']['unknownKeys'] extends 'strict' ? true : false
  >;

export type ActuallyAnyZodObject = z.ZodObject<any, any, any, any, any>;

/**
 * Equivalent to a `yargs` command handler function
 *
 */
export type OdCommandHandler<S extends z.ZodRawShape> = (
  args: y.ArgumentsCamelCase<y.InferredOptionTypes<ShapeToOdOptions<S>>>,
) => void | Promise<void>;

export interface DynamicOdCommandOptions<T extends z.ZodRawShape> {
  handler?: OdCommandHandler<T>;
  /**
   * @todo existentialize
   */
  middlewares?: y.MiddlewareFunction<ShapeToOdOptions<T>>[];
  deprecated?: boolean | string;
}

export interface OdCommandOptions<T extends z.ZodRawShape>
  extends DynamicOdCommandOptions<T> {
  command: string | readonly string[];
}

/**
 * Properties of a {@linkcode OdCommand} instance.
 */
export interface OdCommandTypeDef<
  T extends z.ZodRawShape = z.ZodRawShape,
  UnknownKeys extends z.UnknownKeysParam = z.UnknownKeysParam,
  Catchall extends z.ZodTypeAny = z.ZodTypeAny,
  OCO extends OdCommandOptions<T> = OdCommandOptions<T>,
> extends z.ZodObjectDef<T, UnknownKeys, Catchall> {
  odCommandOptions: OCO;
  innerType: T;
  description: string;
}

export type OdCommandRawCreateParams<T extends z.ZodRawShape> = SetOptional<
  OdCommandOptions<T>,
  'command'
> &
  SetRequired<NonNullable<z.RawCreateParams>, 'description'>;

function createOdCommand<
  T extends z.ZodRawShape,
  UnknownKeys extends z.UnknownKeysParam = z.UnknownKeysParam,
  Catchall extends z.ZodTypeAny = z.ZodTypeAny,
>(
  command: string | readonly string[],
  params: OdCommandRawCreateParams<T> | string,
  shape?: T,
): OdCommand<T>;
function createOdCommand<
  UnknownKeys extends z.UnknownKeysParam = z.UnknownKeysParam,
  Catchall extends z.ZodTypeAny = z.ZodTypeAny,
>(
  command: string | readonly string[],
  params: OdCommandRawCreateParams<{}> | string,
): OdCommand<{}>;
function createOdCommand<
  T extends z.ZodRawShape,
  UnknownKeys extends z.UnknownKeysParam = z.UnknownKeysParam,
  Catchall extends z.ZodTypeAny = z.ZodTypeAny,
>(
  command: string | readonly string[],
  params: OdCommandRawCreateParams<T | {}> | string,
  shape?: T,
) {
  let description: string;
  let errorMap: z.ZodErrorMap | undefined;
  let invalid_type_error: string | undefined;
  let required_error: string | undefined;
  let odCommandOptions: SetOptional<OdCommandOptions<T>, 'command'> | undefined;
  shape ??= {};

  if (typeof params === 'string') {
    description = params;
  } else {
    ({
      errorMap,
      invalid_type_error,
      required_error,
      description,
      ...odCommandOptions
    } = params);
  }

  const def: OdCommandTypeDef<T, UnknownKeys, Catchall> = {
    odCommandOptions: {...odCommandOptions, command},
    ...processCreateParams({
      errorMap,
      invalid_type_error,
      required_error,
      description,
    }),
  };

  return new OdCommand(shape, def);
}

// export type ExtendOdCommand<
//   T extends ActuallyAnyZodObject,
//   DOCO extends DynamicOdCommandOptions<T>,
// > = T extends OdCommand<any>
//   ? OdCommand<
//       T['_odInnerType'],
//       T['_def']['odCommandOptions'] & Omit<DOCO, 'command'>
//     >
//   : OdCommand<T, DOCO extends {command: string} ? DOCO : never>;

export class OdCommand<
  T extends z.ZodRawShape,
  UnknownKeys extends z.UnknownKeysParam = z.UnknownKeysParam,
  Catchall extends z.ZodTypeAny = z.ZodTypeAny,
  Output = z.objectOutputType<T, Catchall, UnknownKeys>,
  Input = z.objectInputType<T, Catchall, UnknownKeys>,
  OCO extends OdCommandOptions<T> = OdCommandOptions<T>,
> extends z.ZodObject<
  Output,
  OdCommandTypeDef<T, UnknownKeys, Catchall, OCO>,
  Input
> {
  static create = createOdCommand;

  /**
   *
   * @param argv Yargs instance
   * @returns Yargs instance with a new command on it
   * @internal
   */
  _toYargsCommand<Y>(argv: y.Argv<Y>): y.Argv<Y> {
    const {command, handler, middlewares, deprecated} =
      this._def.odCommandOptions;
    const description = this._def.description;
    const innerType = this._def.innerType;
    const options = innerType._toYargsOptionsRecord();

    const yargsCommand = argv.command(
      command,
      description,
      options,
      handler,
      middlewares,
      deprecated,
    );
    return yargsCommand;
  }
}

function processCreateParams(
  params: SetRequired<NonNullable<z.RawCreateParams>, 'description'>,
): SetRequired<z.ProcessedCreateParams, 'description'> {
  const {errorMap, invalid_type_error, required_error, description} = params;
  if (errorMap && (invalid_type_error || required_error)) {
    throw new Error(
      `Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`,
    );
  }
  if (errorMap) return {errorMap, description};
  const customMap: z.ZodErrorMap = (iss, ctx) => {
    if (iss.code !== 'invalid_type') return {message: ctx.defaultError};
    if (typeof ctx.data === 'undefined') {
      return {message: required_error ?? ctx.defaultError};
    }
    return {message: invalid_type_error ?? ctx.defaultError};
  };
  return {errorMap: customMap, description};
}
