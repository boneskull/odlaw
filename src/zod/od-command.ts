/* eslint-disable camelcase */
/**
 * Implementation for describing Yargs commands via Zod schemas.
 * @packageDocumentation
 */

// /* eslint-disable camelcase */
// import type {SetRequired} from 'type-fest';
import {SetRequired} from 'type-fest';
import type * as y from 'yargs';
import z from 'zod';
import {ShapeToOdOptions} from './od-option';

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
export type OdCommandHandler<Shape extends z.ZodRawShape> = (
  args: y.ArgumentsCamelCase<y.InferredOptionTypes<ShapeToOdOptions<Shape>>>,
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

// /**
//  * Properties of a {@linkcode OdCommand} instance.
//  */
// export interface OdCommandTypeDef<
//   T extends z.AnyZodObject,
//   OCO extends OdCommandOptions<T['shape']> = OdCommandOptions<T['shape']>,
// > extends z.ZodTypeDef {
//   odCommandOptions: OCO;
//   innerType: T;
//   description: string;
// }

// /**
//  * Like {@linkcode z.RawCreateParams}, but
//  * {@linkcode z.RawCreateParams.description} is required (and thus the object cannot be `undefined`).
//  */
// export type OdCommandRawCreateParams = SetRequired<
//   NonNullable<z.RawCreateParams>,
//   'description'
// >;

// /**
//  * Adapted from Zod sources
//  */
// export type DeepPartial<T extends z.ZodTypeAny> =
//   T extends z.ZodObject<z.ZodRawShape>
//     ? z.ZodObject<
//         {
//           [k in keyof T['shape']]: z.ZodOptional<DeepPartial<T['shape'][k]>>;
//         },
//         T['_def']['unknownKeys'],
//         T['_def']['catchall']
//       >
//     : T extends z.ZodArray<infer Type, infer Card>
//     ? z.ZodArray<DeepPartial<Type>, Card>
//     : T extends z.ZodOptional<infer Type>
//     ? z.ZodOptional<DeepPartial<Type>>
//     : T extends z.ZodNullable<infer Type>
//     ? z.ZodNullable<DeepPartial<Type>>
//     : T extends z.ZodTuple<infer Items>
//     ? {
//         [k in keyof Items]: Items[k] extends z.ZodTypeAny
//           ? DeepPartial<Items[k]>
//           : never;
//       } extends infer PI
//       ? PI extends z.ZodTupleItems
//         ? z.ZodTuple<PI>
//         : never
//       : never
//     : never;

// /**
//  * Represents a Yargs command; mimics the {@linkcode z.ZodObject} API.
//  *
//  * Wraps a {@linkcode z.ZodObject}.
//  */
// export class OdCommand<
//   T extends z.AnyZodObject,
//   OCO extends OdCommandOptions<T['shape']> = OdCommandOptions<T['shape']>,
// > extends z.ZodType<T['_output'], OdCommandTypeDef<T, OCO>, T['_input']> {
//   /**
//    * Creates a new {@linkcode OdCommand} instance, optionally from an existing {@linkcode z.ZodObject}.
//    *
//    * This is called by the consumer; the constructor is not.
//    *
//    * Aliased to {@linkcode z.command}.
//    */

//   /**
//    * @internal
//    */
//   public get _odInnerType(): T {
//     return this._def.innerType;
//   }

//   /**
//    * Delegates to the inner type's {@linkcode z.ZodObject._parse} method.
//    * @internal
//    */
//   public override _parse(input: z.ParseInput): z.ParseReturnType<T['_output']> {
//     return this._def.innerType._parse(input);
//   }

//   /**
//    * @internal
//    */
//   public _getCached() {
//     return this._odInnerType._getCached();
//   }

//   /**
//    * @category ZodObject API
//    * @see {@linkcode ZodObject.shape}
//    */
//   public get shape() {
//     return this._odInnerType.shape;
//   }

//   /**
//    * @category ZodObject API
//    * @see {@linkcode ZodObject.strict}
//    */
//   public strict(message?: string | {message?: string}) {
//     const innerType = this._odInnerType.strict(message);
//     return new OdCommand({
//       innerType,
//       description: this._def.description,
//       odCommandOptions: {
//         ...(this._def.odCommandOptions as OdCommandOptions<
//           typeof innerType.shape
//         >),
//       },
//     });
//   }

//   /**
//    * @category ZodObject API
//    * @see {@linkcode ZodObject.strip}
//    */
//   public strip() {
//     const innerType = this._odInnerType.strip();
//     return new OdCommand({
//       innerType,
//       description: this._def.description,
//       odCommandOptions: {
//         ...(this._def.odCommandOptions as OdCommandOptions<
//           typeof innerType.shape
//         >),
//       },
//     });
//   }

//   /**
//    * @category ZodObject API
//    * @see {@linkcode ZodObject.passthrough}
//    */
//   public passthrough() {
//     const innerType = this._odInnerType.passthrough();
//     return new OdCommand({
//       innerType,
//       description: this._def.description,
//       odCommandOptions: {
//         ...(this._def.odCommandOptions as OdCommandOptions<
//           typeof innerType.shape
//         >),
//       },
//     });
//   }

//   /**
//    * @category ZodObject API
//    * @see {@linkcode ZodObject.extend}
//    */
//   public extend<Augmentation extends z.ZodRawShape>(
//     augmentation: Augmentation,
//   ) {
//     const innerType = this._odInnerType.extend(augmentation);
//     return new OdCommand({
//       innerType,
//       description: this._def.description,
//       odCommandOptions: {
//         ...(this._def.odCommandOptions as OdCommandOptions<
//           typeof innerType.shape
//         >),
//       },
//     });
//   }

//   /**
//    * @category ZodObject API
//    * @see {@linkcode ZodObject.augment}
//    */
//   public augment<Augmentation extends z.ZodRawShape>(
//     augmentation: Augmentation,
//   ) {
//     const innerType = this._odInnerType.augment(augmentation);
//     return new OdCommand({
//       innerType,
//       description: this._def.description,
//       odCommandOptions: {
//         ...(this._def.odCommandOptions as OdCommandOptions<
//           typeof innerType.shape
//         >),
//       },
//     });
//   }

//   /**
//    * @category ZodObject API
//    * @see {@linkcode ZodObject.merge}
//    */
//   public merge<Incoming extends z.AnyZodObject>(merging: Incoming) {
//     const innerType = this._odInnerType.merge(merging);
//     return new OdCommand({
//       innerType,
//       description: this._def.description,
//       odCommandOptions: {
//         ...(this._def.odCommandOptions as OdCommandOptions<
//           typeof innerType.shape
//         >),
//       },
//     });
//   }

//   /**
//    * @category ZodObject API
//    * @see {@linkcode ZodObject.setKey}
//    */
//   public setKey<Key extends string, Schema extends z.ZodTypeAny>(
//     key: Key,
//     schema: Schema,
//   ) {
//     const innerType = this._odInnerType.setKey(key, schema);
//     return new OdCommand({
//       innerType,
//       description: this._def.description,
//       odCommandOptions: {
//         ...(this._def.odCommandOptions as OdCommandOptions<
//           typeof innerType.shape
//         >),
//       },
//     });
//   }

//   /**
//    * @category ZodObject API
//    * @see {@linkcode ZodObject.catchall}
//    */
//   public catchall<Index extends z.ZodTypeAny>(index: Index) {
//     const innerType = this._odInnerType.catchall(index);
//     return new OdCommand({
//       innerType,
//       description: this._def.description,
//       odCommandOptions: {
//         ...(this._def.odCommandOptions as OdCommandOptions<
//           typeof innerType.shape
//         >),
//       },
//     });
//   }

//   /**
//    * @category ZodObject API
//    * @see {@linkcode ZodObject.pick}
//    */
//   public pick<
//     Mask extends {
//       [k in keyof T]?: true;
//     },
//   >(mask: Mask) {
//     const innerType = this._odInnerType.pick(mask);
//     return new OdCommand({
//       innerType,
//       description: this._def.description,
//       odCommandOptions: {
//         ...(this._def.odCommandOptions as OdCommandOptions<
//           typeof innerType.shape
//         >),
//       },
//     });
//   }

//   /**
//    * @category ZodObject API
//    * @see {@linkcode ZodObject.omit}
//    */
//   public omit<
//     Mask extends {
//       [k in keyof T]?: true;
//     },
//   >(mask: Mask) {
//     const innerType = this._odInnerType.omit(mask);
//     return new OdCommand({
//       innerType,
//       description: this._def.description,
//       odCommandOptions: {
//         ...(this._def.odCommandOptions as OdCommandOptions<
//           typeof innerType.shape
//         >),
//       },
//     });
//   }

//   /**
//    * @category ZodObject API
//    * @see {@linkcode ZodObject.deepPartial}
//    */
//   public deepPartial() {
//     const innerType =
//       this._odInnerType.deepPartial() as unknown as DeepPartial<T>;
//     return new OdCommand({
//       innerType,
//       description: this._def.description,
//       odCommandOptions: {
//         ...(this._def.odCommandOptions as OdCommandOptions<
//           typeof innerType.shape
//         >),
//       },
//     });
//   }

//   /**
//    * @category ZodObject API
//    * @see {@linkcode ZodObject.partial}
//    */
//   public partial(): OdCommand<
//     z.ZodObject<
//       {[k in keyof T['shape']]: z.ZodOptional<T['shape'][k]>},
//       T['_def']['unknownKeys'],
//       T['_def']['catchall']
//     >,
//     OdCommandOptions<{[k in keyof T['shape']]: z.ZodOptional<T['shape'][k]>}>
//   >;
//   public partial<Mask extends {[k in keyof T['shape']]?: true}>(
//     mask: Mask,
//   ): OdCommand<
//     z.ZodObject<
//       z.objectUtil.noNever<{
//         [k in keyof T['shape']]: k extends keyof Mask
//           ? z.ZodOptional<T['shape'][k]>
//           : T['shape'][k];
//       }>,
//       T['_def']['unknownKeys'],
//       T['_def']['catchall']
//     >,
//     OdCommandOptions<
//       z.objectUtil.noNever<{
//         [k in keyof T['shape']]: k extends keyof Mask
//           ? z.ZodOptional<T['shape'][k]>
//           : T['shape'][k];
//       }>
//     >
//   >;
//   public partial(mask?: any) {
//     const innerType = this._odInnerType.partial(mask);
//     return new OdCommand({
//       innerType,
//       description: this._def.description,
//       odCommandOptions: {...this._def.odCommandOptions} as any,
//     }) as any;
//   }

//   /**
//    * @category ZodObject API
//    * @see {@linkcode ZodObject.required}
//    */
//   public required(): OdCommand<
//     z.ZodObject<
//       {
//         [k in keyof T['shape']]: z.deoptional<T['shape'][k]>;
//       },
//       T['_def']['unknownKeys'],
//       T['_def']['catchall']
//     >,
//     OdCommandOptions<{
//       [k in keyof T['shape']]: z.deoptional<T['shape'][k]>;
//     }>
//   >;
//   public required<
//     Mask extends {
//       [k in keyof T['shape']]?: true;
//     },
//   >(
//     mask: Mask,
//   ): OdCommand<
//     z.ZodObject<
//       z.objectUtil.noNever<{
//         [k in keyof T['shape']]: k extends keyof Mask
//           ? z.deoptional<T['shape'][k]>
//           : T['shape'][k];
//       }>,
//       T['_def']['unknownKeys'],
//       T['_def']['catchall']
//     >,
//     OdCommandOptions<
//       z.objectUtil.noNever<{
//         [k in keyof T['shape']]: k extends keyof Mask
//           ? z.deoptional<T['shape'][k]>
//           : T['shape'][k];
//       }>
//     >
//   >;
//   public required(mask?: any) {
//     const innerType = this._odInnerType.required(mask);
//     return new OdCommand({
//       innerType,
//       description: this._def.description,
//       odCommandOptions: {
//         ...this._def.odCommandOptions,
//       } as any,
//     }) as any;
//   }

//   /**
//    * @category ZodObject API
//    * @see {@linkcode ZodObject.keyof}
//    */
//   public keyof() {
//     return this._odInnerType.keyof();
//   }

//   /**
//    * Creates a Yargs command on the given Yargs instance.
//    * @param argv Yargs instance
//    * @returns Yargs instance with a new command on it
//    * @internal
//    */

// }

// /**
//  * Adapted from Zod sources.
//  *
//  * This just differs in the input and return types, which expects `params` to be
//  * a) defined, and b) contain a `description` property.
//  * @internal
//  * @param params Create params
//  * @returns Create params consolidated for use in a {@linkcode z.ZodTypeDef}
//  */
// function processCreateParams(
//   params: SetRequired<NonNullable<z.RawCreateParams>, 'description'>,
// ): SetRequired<z.ProcessedCreateParams, 'description'> {
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
  command(
    this: z.AnyZodObject,
    command: string | readonly string[],
    description: string,
  ) {
    const partialThis = this.partial();

    return new z.ZodObject({
      ...partialThis._def,
      unknownKeys: 'passthrough',
      description,
      odCommandOptions: {
        command,
      },
    });
  },
  _toYargsCommand<Y>(this: z.AnyZodObject, argv: y.Argv<Y>) {
    const {command, handler, middlewares, deprecated} =
      this._def.odCommandOptions ?? {};
    const description =
      this._def.description ?? this._def.odCommandOptions?.describe ?? '';
    const options = this._toYargsOptionsRecord();
    const yargsCommand = argv.command(
      command,
      description,
      options,
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
  _toYargsOptionsRecord() {
    if (!(this instanceof z.ZodObject)) {
      throw new TypeError('Expected ZodObject');
    }
    const record: Record<string, y.Options> = {};
    for (const key of Object.keys(this._def.shape)) {
      record[key] = this.shape[key]._toYargsOptions();
    }
    return record;
  },
};

export type OdCommandCreateParams<OCO extends OdCommandOptions<any>> =
  z.RawCreateParams & {odCommandOptions: OCO};

export type PartialObjectShape<T extends z.AnyZodObject> = {
  [K in keyof T['shape']]: z.ZodOptional<T['shape'][K]>;
};

export function createOdCommand<
  OCO extends OdCommandOptions<PartialObjectShape<T>>,
  T extends z.AnyZodObject & {description: string},
>(
  zObj: T,
  params?: OdCommandCreateParams<OCO>,
): z.ZodObject<
  PartialObjectShape<T>,
  T['_def']['unknownKeys'],
  T['_def']['catchall']
>;
export function createOdCommand<
  OCO extends OdCommandOptions<PartialObjectShape<T>>,
  T extends z.AnyZodObject,
>(
  zObj: T,
  params: NonNullable<SetRequired<OdCommandCreateParams<OCO>, 'description'>>,
): z.ZodObject<
  PartialObjectShape<T>,
  T['_def']['unknownKeys'],
  T['_def']['catchall']
>;
export function createOdCommand<
  T extends z.AnyZodObject & {description: string},
>(
  zObj: T,
  name: string,
  description?: string,
): z.ZodObject<
  PartialObjectShape<T>,
  T['_def']['unknownKeys'],
  T['_def']['catchall']
>;
export function createOdCommand<T extends z.AnyZodObject>(
  zObj: T,
  name: string,
  description: string,
): z.ZodObject<
  PartialObjectShape<T>,
  T['_def']['unknownKeys'],
  T['_def']['catchall']
>;
export function createOdCommand<OCO extends OdCommandOptions<z.ZodRawShape>>(
  params: OdCommandCreateParams<OCO> | OCO,
): z.ZodObject<z.ZodRawShape>;
export function createOdCommand(
  name: string,
  description: string,
  handler?: OdCommandHandler<z.ZodRawShape>,
): z.ZodObject<z.ZodRawShape>;
export function createOdCommand<
  OCO extends OdCommandOptions<PartialObjectShape<T> | z.ZodRawShape>,
  T extends z.AnyZodObject,
>(
  zObj: T | OdCommandCreateParams<OCO> | string,
  params?: OdCommandCreateParams<OCO> | string,
  cmdHandler?: OdCommandHandler<PartialObjectShape<T> | z.ZodRawShape> | string,
):
  | z.ZodObject<
      PartialObjectShape<T>,
      T['_def']['unknownKeys'],
      T['_def']['catchall']
    >
  | z.ZodObject<{}> {
  if (zObj instanceof z.ZodObject) {
    const zPartialObj = zObj.partial();
    if (typeof params === 'object') {
      return new z.ZodObject({
        ...zPartialObj._def,
        unknownKeys: 'passthrough',
        ...processCreateParams(params),
        odCommandOptions: {
          ...zPartialObj._def.odCommandOptions,
          ...params.odCommandOptions,
        },
      });
    } else if (typeof params === 'string') {
      return new z.ZodObject({
        ...zPartialObj._def,
        description: (cmdHandler as string) ?? zPartialObj.description,
        unknownKeys: 'passthrough',
        odCommandOptions: {
          ...zPartialObj._def.odCommandOptions,
          command: params,
        },
      });
    } else {
      throw new TypeError('Expected params to be an object');
    }
  }
  if (isOdCommandOptions(zObj)) {
    return new z.ZodObject({
      unknownKeys: 'passthrough',
      catchall: z.never(),
      typeName: z.ZodFirstPartyTypeKind.ZodObject,
      shape: () => ({}),
      odCommandOptions: zObj,
      description: zObj.describe,
    });
  }
  if (typeof zObj === 'string') {
    const command = zObj;
    const description = params as string;
    const handler = cmdHandler as OdCommandHandler<{}>;
    return new z.ZodObject({
      unknownKeys: 'passthrough',
      catchall: z.never(),
      typeName: z.ZodFirstPartyTypeKind.ZodObject,
      shape: () => ({}),
      odCommandOptions: {command, handler},
      description,
    });
  }

  return z.object({});
}

function processCreateParams(): z.ProcessedCreateParams;
function processCreateParams<P extends NonNullable<z.RawCreateParams>>(
  params: P,
): z.ProcessedCreateParams & Omit<P, keyof z.RawCreateParams>;
function processCreateParams<P extends z.RawCreateParams>(params?: P) {
  if (!params) return {};
  const {errorMap, invalid_type_error, required_error, description, ...rest} =
    params;
  if (errorMap && (invalid_type_error || required_error)) {
    throw new Error(
      `Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`,
    );
  }
  if (errorMap) return {errorMap, description, ...rest};
  const customMap: z.ZodErrorMap = (iss, ctx) => {
    if (iss.code !== 'invalid_type') return {message: ctx.defaultError};
    if (typeof ctx.data === 'undefined') {
      return {message: required_error ?? ctx.defaultError};
    }
    return {message: invalid_type_error ?? ctx.defaultError};
  };
  return {errorMap: customMap, description, ...rest};
}

function isOdCommandOptions(value: any): value is OdCommandOptions<any> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'command' in value &&
    typeof value.command === 'string'
  );
}
