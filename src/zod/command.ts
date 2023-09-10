/* eslint-disable @typescript-eslint/ban-types */
/**
 * Implementation for describing Yargs commands via Zod schemas.
 * @packageDocumentation
 */

/* eslint-disable camelcase */
import {SetRequired} from 'type-fest';
import type * as y from 'yargs';
import z from 'zod';
import {OdType} from '..';
import {ShapeToOdOptions} from './option';

export type OdMiddleware<T extends z.AnyZodObject> = y.MiddlewareFunction<
  ShapeToOdOptions<T['shape']>
>;

/**
 * Equivalent to a `yargs` command handler function
 *
 */
export type OdCommandHandler<Shape extends z.ZodRawShape> = (
  args: y.ArgumentsCamelCase<y.InferredOptionTypes<ShapeToOdOptions<Shape>>>,
) => void | Promise<void>;

export interface DynamicOdCommandOptions<T extends z.AnyZodObject> {
  handler?: OdCommandHandler<T['shape']>;
  /**
   * @todo existentialize
   */
  middlewares?: OdMiddleware<T>[];
  deprecated?: boolean | string;
}

export interface OdCommandOptions<T extends z.AnyZodObject>
  extends DynamicOdCommandOptions<T> {
  command: string | readonly string[];
}

/**
 * Properties of a {@linkcode OdCommand} instance.
 */
export interface OdCommandTypeDef<
  T extends z.AnyZodObject,
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
  T extends z.AnyZodObject,
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

/**
 * Adapted from Zod sources
 */
export type DeepPartial<T extends z.ZodTypeAny> =
  T extends z.ZodObject<z.ZodRawShape>
    ? z.ZodObject<
        {
          [k in keyof T['shape']]: z.ZodOptional<DeepPartial<T['shape'][k]>>;
        },
        T['_def']['unknownKeys'],
        T['_def']['catchall']
      >
    : T extends z.ZodArray<infer Type, infer Card>
    ? z.ZodArray<DeepPartial<Type>, Card>
    : T extends z.ZodOptional<infer Type>
    ? z.ZodOptional<DeepPartial<Type>>
    : T extends z.ZodNullable<infer Type>
    ? z.ZodNullable<DeepPartial<Type>>
    : T extends z.ZodTuple<infer Items>
    ? {
        [k in keyof Items]: Items[k] extends z.ZodTypeAny
          ? DeepPartial<Items[k]>
          : never;
      } extends infer PI
      ? PI extends z.ZodTupleItems
        ? z.ZodTuple<PI>
        : never
      : never
    : T extends OdCommand<infer Type, infer OCO>
    ? OdCommand<DeepPartial<Type>, OCO>
    : T extends OdType<infer Type, infer ZO>
    ? OdType<DeepPartial<Type>, ZO>
    : never;

/**
 * Represents a Yargs command; mimics the {@linkcode z.ZodObject} API.
 *
 * The property {@linkcode OdCommand._odInnerType} is a {@linkcode z.ZodObject},
 * but {@linkcode OdCommand} itself is not.
 */
export class OdCommand<
  T extends z.AnyZodObject,
  OCO extends OdCommandOptions<T> = OdCommandOptions<T>,
> extends z.ZodType<T['_output'], OdCommandTypeDef<T, OCO>, T['_input']> {
  static create = createOdCommand;

  get _odInnerType(): T {
    return this._def.innerType;
  }

  _parse(input: z.ParseInput): z.ParseReturnType<T['_output']> {
    return this._def.innerType._parse(input);
  }

  middlewares(
    middlewares: OdMiddleware<T>[],
  ): OdCommand<T, OCO & {middlewares: OdMiddleware<T>[]}>;
  middlewares(
    ...middlewares: OdMiddleware<T>[]
  ): OdCommand<T, OCO & {middlewares: OdMiddleware<T>[]}>;
  /**
   *
   * @param middlewares One ore more Yargs middleware functions
   * @returns New {@linkcode OdCommand} with the given middlewares
   */
  middlewares(...middlewares: OdMiddleware<T>[] | [OdMiddleware<T>[]]) {
    if (Array.isArray(middlewares[0])) {
      return new OdCommand({
        ...this._def,
        odCommandOptions: {
          ...this._def.odCommandOptions,
          middlewares: middlewares[0],
        },
      });
    }
    return new OdCommand({
      ...this._def,
      odCommandOptions: {
        ...this._def.odCommandOptions,
        middlewares,
      },
    });
  }

  _getCached() {
    return this._odInnerType._getCached();
  }

  get shape() {
    return this._odInnerType.shape;
  }

  strict(message?: string | {message?: string}) {
    const innerType = this._odInnerType.strict(message);
    return new OdCommand({
      innerType,
      description: this._def.description,
      odCommandOptions: {
        ...(this._def.odCommandOptions as OdCommandOptions<typeof innerType>),
      },
    });
  }
  strip() {
    const innerType = this._odInnerType.strip();
    return new OdCommand({
      innerType,
      description: this._def.description,
      odCommandOptions: {
        ...(this._def.odCommandOptions as OdCommandOptions<typeof innerType>),
      },
    });
  }
  passthrough() {
    const innerType = this._odInnerType.passthrough();
    return new OdCommand({
      innerType,
      description: this._def.description,
      odCommandOptions: {
        ...(this._def.odCommandOptions as OdCommandOptions<typeof innerType>),
      },
    });
  }

  extend<Augmentation extends z.ZodRawShape>(augmentation: Augmentation) {
    const innerType = this._odInnerType.extend(augmentation);
    return new OdCommand({
      innerType,
      description: this._def.description,
      odCommandOptions: {
        ...(this._def.odCommandOptions as OdCommandOptions<typeof innerType>),
      },
    });
  }

  augment<Augmentation extends z.ZodRawShape>(augmentation: Augmentation) {
    const innerType = this._odInnerType.augment(augmentation);
    return new OdCommand({
      innerType,
      description: this._def.description,
      odCommandOptions: {
        ...(this._def.odCommandOptions as OdCommandOptions<typeof innerType>),
      },
    });
  }
  merge<Incoming extends z.AnyZodObject>(merging: Incoming) {
    const innerType = this._odInnerType.merge(merging);
    return new OdCommand({
      innerType,
      description: this._def.description,
      odCommandOptions: {
        ...(this._def.odCommandOptions as OdCommandOptions<typeof innerType>),
      },
    });
  }

  setKey<Key extends string, Schema extends z.ZodTypeAny>(
    key: Key,
    schema: Schema,
  ) {
    const innerType = this._odInnerType.setKey(key, schema);
    return new OdCommand({
      innerType,
      description: this._def.description,
      odCommandOptions: {
        ...(this._def.odCommandOptions as OdCommandOptions<typeof innerType>),
      },
    });
  }

  catchall<Index extends z.ZodTypeAny>(index: Index) {
    const innerType = this._odInnerType.catchall(index);
    return new OdCommand({
      innerType,
      description: this._def.description,
      odCommandOptions: {
        ...(this._def.odCommandOptions as OdCommandOptions<typeof innerType>),
      },
    });
  }

  pick<
    Mask extends {
      [k in keyof T]?: true;
    },
  >(mask: Mask) {
    const innerType = this._odInnerType.pick(mask);
    return new OdCommand({
      innerType,
      description: this._def.description,
      odCommandOptions: {
        ...(this._def.odCommandOptions as OdCommandOptions<typeof innerType>),
      },
    });
  }

  omit<
    Mask extends {
      [k in keyof T]?: true;
    },
  >(mask: Mask) {
    const innerType = this._odInnerType.omit(mask);
    return new OdCommand({
      innerType,
      description: this._def.description,
      odCommandOptions: {
        ...(this._def.odCommandOptions as OdCommandOptions<typeof innerType>),
      },
    });
  }

  deepPartial() {
    const innerType =
      this._odInnerType.deepPartial() as unknown as DeepPartial<T>;
    return new OdCommand({
      innerType,
      description: this._def.description,
      odCommandOptions: {
        ...(this._def.odCommandOptions as OdCommandOptions<typeof innerType>),
      },
    });
  }
  partial(): OdCommand<
    z.ZodObject<
      {[k in keyof T['shape']]: z.ZodOptional<T['shape'][k]>},
      T['_def']['unknownKeys'],
      T['_def']['catchall']
    >,
    OdCommandOptions<
      z.ZodObject<
        {[k in keyof T['shape']]: z.ZodOptional<T['shape'][k]>},
        T['_def']['unknownKeys'],
        T['_def']['catchall']
      >
    >
  >;
  partial<Mask extends {[k in keyof T['shape']]?: true}>(
    mask: Mask,
  ): OdCommand<
    z.ZodObject<
      z.objectUtil.noNever<{
        [k in keyof T['shape']]: k extends keyof Mask
          ? z.ZodOptional<T['shape'][k]>
          : T['shape'][k];
      }>,
      T['_def']['unknownKeys'],
      T['_def']['catchall']
    >,
    OdCommandOptions<
      z.ZodObject<
        z.objectUtil.noNever<{
          [k in keyof T['shape']]: k extends keyof Mask
            ? z.ZodOptional<T['shape'][k]>
            : T['shape'][k];
        }>,
        T['_def']['unknownKeys'],
        T['_def']['catchall']
      >
    >
  >;
  partial(mask?: any) {
    const innerType = this._odInnerType.partial(mask);
    return new OdCommand({
      innerType,
      description: this._def.description,
      odCommandOptions: {...this._def.odCommandOptions} as any,
    }) as any;
  }

  required(): OdCommand<
    z.ZodObject<
      {
        [k in keyof T['shape']]: z.deoptional<T['shape'][k]>;
      },
      T['_def']['unknownKeys'],
      T['_def']['catchall']
    >,
    OdCommandOptions<
      z.ZodObject<
        {
          [k in keyof T['shape']]: z.deoptional<T['shape'][k]>;
        },
        T['_def']['unknownKeys'],
        T['_def']['catchall']
      >
    >
  >;
  required<
    Mask extends {
      [k in keyof T['shape']]?: true;
    },
  >(
    mask: Mask,
  ): OdCommand<
    z.ZodObject<
      z.objectUtil.noNever<{
        [k in keyof T['shape']]: k extends keyof Mask
          ? z.deoptional<T['shape'][k]>
          : T['shape'][k];
      }>,
      T['_def']['unknownKeys'],
      T['_def']['catchall']
    >,
    OdCommandOptions<
      z.ZodObject<
        z.objectUtil.noNever<{
          [k in keyof T['shape']]: k extends keyof Mask
            ? z.deoptional<T['shape'][k]>
            : T['shape'][k];
        }>,
        T['_def']['unknownKeys'],
        T['_def']['catchall']
      >
    >
  >;
  required(mask?: any) {
    const innerType = this._odInnerType.required(mask);
    return new OdCommand({
      innerType,
      description: this._def.description,
      odCommandOptions: {
        ...this._def.odCommandOptions,
      } as any,
    }) as any;
  }

  keyof() {
    return this._odInnerType.keyof();
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

/**
 * Adapted from Zod sources
 * @internal
 * @param params Create params
 * @returns Create params consolidated for use in a {@linkcode z.ZodTypeDef}
 */
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
