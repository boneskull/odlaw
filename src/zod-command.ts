/* eslint-disable camelcase */
import {SetRequired} from 'type-fest';
import type * as yargs from 'yargs';
import z from 'zod';

export type ShapeToZodlawOptions<T extends z.ZodRawShape> = {
  [K in keyof T]: z.ZodlawOptionsType<
    T[K]['_def']['zodlawOptions'],
    T[K]
  >['_def']['zodlawOptions'];
};

export type ZodlawCommandHandler<Shape extends z.ZodRawShape> = (
  args: yargs.ArgumentsCamelCase<
    yargs.InferredOptionTypes<ShapeToZodlawOptions<Shape>>
  >,
) => void | Promise<void>;

export interface ZodlawCommandTypeDef<
  T extends z.ZodTypeAny & {shape: z.ZodRawShape},
> extends z.ZodTypeDef {
  command: string | readonly string[];
  handler?: ZodlawCommandHandler<T['shape']>;
  /**
   * @todo existentialize
   */
  middlewares?: yargs.MiddlewareFunction<ShapeToZodlawOptions<T['shape']>>[];
  deprecated?: boolean | string;

  typeName: 'ZodlawCommand';
  innerType: T;
  description: string;
}

export type ZodlawCommandRawCreateParams = SetRequired<
  NonNullable<z.RawCreateParams>,
  'description'
>;

function createZodlawCommand<T extends z.ZodTypeAny & {shape: z.ZodRawShape}>(
  innerType: T,
  command: string | readonly string[],
  params: ZodlawCommandRawCreateParams | string,
): ZodlawCommand<T>;
function createZodlawCommand<
  T extends z.ZodTypeAny & {shape: z.ZodRawShape} = z.ZodTypeAny & {
    shape: z.ZodRawShape;
  },
>(
  command: string | readonly string[],
  params: ZodlawCommandRawCreateParams | string,
): ZodlawCommand<T>;
function createZodlawCommand<
  T extends z.ZodTypeAny & {shape: z.ZodRawShape} = z.ZodTypeAny & {
    shape: z.ZodRawShape;
  },
>(
  innerTypeOrCommand: T | string | readonly string[],
  commandOrParams: string | readonly string[] | ZodlawCommandRawCreateParams,
  params?: ZodlawCommandRawCreateParams | string,
): ZodlawCommand<T> {
  let description: string;
  let command: string | readonly string[];
  let innerType: T;
  if (typeof params === 'string') {
    description = params;
    command = commandOrParams as string | readonly string[];
    innerType = innerTypeOrCommand as T;
  } else if (typeof params === 'object') {
    description = params.description;
    command = commandOrParams as string | readonly string[];
    innerType = innerTypeOrCommand as T;
  } else {
    if (innerTypeOrCommand instanceof z.ZodType) {
      description = innerTypeOrCommand._def.description;
      command = commandOrParams as string | readonly string[];
      innerType = innerTypeOrCommand;
    } else {
      command = innerTypeOrCommand;
      description = commandOrParams as string;
      innerType = z.object({}) as any;
    }
  }

  const def: ZodlawCommandTypeDef<T> = {
    innerType,
    command,
    typeName: 'ZodlawCommand',
    description,
  };

  return new ZodlawCommand(def);
}

export class ZodlawCommand<
  T extends z.ZodTypeAny & {shape: z.ZodRawShape} = z.ZodTypeAny & {
    shape: z.ZodRawShape;
  },
> extends z.ZodType<T['_output'], ZodlawCommandTypeDef<T>, T['_input']> {
  _parse(input: z.ParseInput): z.ParseReturnType<T['_output']> {
    return this._def.innerType._parse(input);
  }

  static create = createZodlawCommand;

  _toYargsCommand<Y>(argv: yargs.Argv<Y>): yargs.Argv<Y> {
    const {command, handler, middlewares, deprecated, description, innerType} =
      this._def;
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
  params: z.RawCreateParams,
): z.ProcessedCreateParams {
  if (!params) return {};
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
/**
 *
 * z.command('foo', ')
 */
