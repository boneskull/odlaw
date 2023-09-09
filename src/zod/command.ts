/* eslint-disable camelcase */
import {SetRequired} from 'type-fest';
import type * as yargs from 'yargs';
import z from 'zod';
import {YargsifyOdOptions} from './option';

export type ShapeToOdOptions<
  S extends z.ZodRawShape,
  Strict extends boolean = false,
> = {
  [K in keyof S]: YargsifyOdOptions<S[K], {demandOption: Strict}>;
};

export type Expand<T> = T extends infer U ? {[K in keyof U]: U[K]} : never;

export type ZodObjectToYargsOptionsRecord<T extends z.AnyZodObject> =
  ShapeToOdOptions<
    T['shape'],
    T['_def']['unknownKeys'] extends 'strict' ? true : false
  >;

export type ActuallyAnyZodObject = z.ZodObject<any, any, any, any, any>;

export type OdCommandHandler<S extends z.ZodRawShape> = (
  args: yargs.ArgumentsCamelCase<
    yargs.InferredOptionTypes<ShapeToOdOptions<S>>
  >,
) => void | Promise<void>;

export interface OdCommandTypeDef<T extends ActuallyAnyZodObject>
  extends z.ZodTypeDef {
  command: string | readonly string[];
  handler?: OdCommandHandler<T['shape']>;
  /**
   * @todo existentialize
   */
  middlewares?: yargs.MiddlewareFunction<ShapeToOdOptions<T['shape']>>[];
  deprecated?: boolean | string;

  typeName: 'OdCommand';
  innerType: T;
  description: string;
}

export type OdCommandRawCreateParams = SetRequired<
  NonNullable<z.RawCreateParams>,
  'description'
>;

function createOdCommand<T extends ActuallyAnyZodObject>(
  innerType: T,
  command: string | readonly string[],
  params: OdCommandRawCreateParams | string,
): OdCommand<T>;
function createOdCommand<T extends ActuallyAnyZodObject>(
  command: string | readonly string[],
  params: OdCommandRawCreateParams | string,
): OdCommand<T>;
function createOdCommand<T extends ActuallyAnyZodObject>(
  innerTypeOrCommand: T | string | readonly string[],
  commandOrParams: string | readonly string[] | OdCommandRawCreateParams,
  params?: OdCommandRawCreateParams | string,
): OdCommand<T> {
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
      throw new TypeError('Expected description');
    } else {
      command = innerTypeOrCommand;
      description = commandOrParams as string;
      innerType = z.object({}) as any;
    }
  }

  const def: OdCommandTypeDef<T> = {
    innerType,
    command,
    typeName: 'OdCommand',
    description,
  };

  return new OdCommand(def);
}

export class OdCommand<T extends ActuallyAnyZodObject> extends z.ZodType<
  T['_output'],
  OdCommandTypeDef<T>,
  T['_input']
> {
  _parse(input: z.ParseInput): z.ParseReturnType<T['_output']> {
    return this._def.innerType._parse(input);
  }

  static create = createOdCommand;

  _toYargsCommand<Y>(argv: yargs.Argv<Y>): yargs.Argv<Y> {
    const {command, handler, middlewares, deprecated, description, innerType} =
      this._def;
    const options = innerType._toYargsOptionsRecord();

    const yargsCommand = argv.command<typeof options>(
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

// function processCreateParams(
//   params: z.RawCreateParams,
// ): z.ProcessedCreateParams {
//   if (!params) return {};
//   const {errorMap, invalid_type_error, required_error, description} = params;
//   if (errorMap && (invalid_type_error || required_error)) {
//     throw new Error(
//       `Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`,
//     );
//   }
//   if (errorMap) return {errorMap, description};
//   const customMap: z.ZodErrorMap = (iss, ctx) => {
//     if (iss.code !== 'invalid_type') return {message: ctx.defaultError};
//     if (typeof ctx.data === 'undefined') {
//       return {message: required_error ?? ctx.defaultError};
//     }
//     return {message: invalid_type_error ?? ctx.defaultError};
//   };
//   return {errorMap: customMap, description};
// }
