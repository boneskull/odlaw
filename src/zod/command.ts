/* eslint-disable @typescript-eslint/ban-types */
/**
 * Implementation for describing Yargs commands via Zod schemas.
 * @packageDocumentation
 */

/* eslint-disable camelcase */
import {SetRequired} from 'type-fest';
import {SimpleMerge} from 'type-fest/source/merge';
import type * as y from 'yargs';
import z from 'zod';
import {ShapeToOdOptions} from './option';

export type ActuallyAnyZodObject = z.ZodObject<any, any, any, any, any>;

export type OdMiddleware<T extends ActuallyAnyZodObject> = y.MiddlewareFunction<
  ShapeToOdOptions<T['shape']>
>;

/**
 * Equivalent to a `yargs` command handler function
 *
 */
export type OdCommandHandler<Shape extends z.ZodRawShape> = (
  args: y.ArgumentsCamelCase<y.InferredOptionTypes<ShapeToOdOptions<Shape>>>,
) => void | Promise<void>;

export interface DynamicOdCommandOptions<T extends ActuallyAnyZodObject> {
  handler?: OdCommandHandler<T['shape']>;
  /**
   * @todo existentialize
   */
  middlewares?: OdMiddleware<T>[];
  deprecated?: boolean | string;
}

export interface OdCommandOptions<T extends ActuallyAnyZodObject>
  extends DynamicOdCommandOptions<T> {
  command: string | readonly string[];
}

/**
 * Properties of a {@linkcode OdCommand} instance.
 */
export interface OdCommandTypeDef<
  T extends ActuallyAnyZodObject,
  OCO extends OdCommandOptions<T> = OdCommandOptions<T>,
> extends z.ZodTypeDef {
  odCommandOptions: OCO;
  innerType: T;
  description: string;
}

export type OdCommandRawCreateParams = SetRequired<
  NonNullable<z.RawCreateParams>,
  'description'
>;

function createOdCommand<
  T extends ActuallyAnyZodObject,
  OCO extends OdCommandOptions<T>,
>(odCommandOptions: OCO, params: OdCommandRawCreateParams, innerType?: T) {
  innerType ??= z.object({}) as T;

  const def = {
    innerType,
    odCommandOptions,
    ...processCreateParams(params),
  };

  return new OdCommand(def);
}

export type ExtendOdCommand<
  T extends ActuallyAnyZodObject,
  DOCO extends DynamicOdCommandOptions<T>,
> = T extends OdCommand<any>
  ? OdCommand<
      T['_odInnerType'],
      T['_def']['odCommandOptions'] & Omit<DOCO, 'command'>
    >
  : OdCommand<T, DOCO extends {command: string} ? DOCO : never>;

export class OdCommand<
  T extends ActuallyAnyZodObject,
  OCO extends OdCommandOptions<T> = OdCommandOptions<T>,
> extends z.ZodType<T['_output'], OdCommandTypeDef<T, OCO>, T['_input']> {
  static create = createOdCommand;

  get _odInnerType(): T {
    return this._def.innerType;
  }

  _parse(input: z.ParseInput): z.ParseReturnType<T['_output']> {
    return this._def.innerType._parse(input);
  }

  middlewares<M extends OdMiddleware<T>[]>(
    middlewares: M,
  ): OdCommand<T, SimpleMerge<OCO, {middlewares: M}>> {
    return new OdCommand({
      ...this._def,
      odCommandOptions: {
        ...this._def.odCommandOptions,
        middlewares,
      },
    });
  }

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
