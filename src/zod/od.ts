import z from 'zod';
import {DynamicOdOptions} from './option';
export interface OdTypeDef<
  T extends z.ZodTypeAny,
  ZO extends DynamicOdOptions = DynamicOdOptions,
> extends z.ZodTypeDef {
  innerType: T;
  odOptions: ZO;
}

/**
 * Constructed via `zod.option()`
 *
 * The only purpose of this is to store an {@linkcode OdTypeDef} with any custom options.
 *
 */
export class OdType<
  T extends z.ZodTypeAny,
  ZO extends DynamicOdOptions = DynamicOdOptions,
> extends z.ZodType<T['_output'], OdTypeDef<T, ZO>, T['_input']> {
  /**
   * @internal
   */
  _parse(input: z.ParseInput): z.ParseReturnType<T['_output']> {
    return this._odInnerType.parse(input);
  }

  /**
   * @internal
   */
  get _odInnerType(): T {
    return this._def.innerType;
  }

  /**
   * @internal
   */
  _cloneWith<ZO extends DynamicOdOptions>(odOptions?: ZO) {
    return new OdType({
      innerType: this._odInnerType,
      odOptions: {...this._def.odOptions, ...odOptions},
    });
  }

  /**
   * Returns the `description` property of the inner `ZodType` _or_ the
   * `describe` property of the `OdOptions` (if set), preferring the former.
   */
  override get description() {
    return this._odInnerType.description ?? this._def.odOptions.describe;
  }
}
