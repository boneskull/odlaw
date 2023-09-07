import z from 'zod';
import {DynamicOdOptions, OdOptions} from './option';
export interface OdTypeDef<
  T extends z.ZodTypeAny,
  ZO extends DynamicOdOptions = DynamicOdOptions,
> extends z.ZodTypeDef {
  innerType: T;
  odOptions: OdOptions<T, ZO>;
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
> extends z.ZodType<T['_output'], T['_def'] & OdTypeDef<T, ZO>, T['_input']> {
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
}
