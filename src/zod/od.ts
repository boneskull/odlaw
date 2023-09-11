import type * as y from 'yargs';
import z from 'zod';
import {DynamicOdOptions, OdSupportedType} from './od-option';
export interface OdOptionTypeDef<
  T extends z.ZodTypeAny,
  ZO extends DynamicOdOptions = DynamicOdOptions,
> extends z.ZodTypeDef {
  innerType: T;
  odOptions: ZO;
}

/**
 * Constructed via `zod.option()`
 *
 * The only purpose of this is to store an {@linkcode OdOptionTypeDef} with any
 * custom options.
 *
 * @typeParam T - The inner {@linkcode z.ZodType}. In practice, this will be an
 * `OdSupportedType`, but must not narrow to that due to circular references.
 */
export class OdOption<
  T extends z.ZodTypeAny,
  ZO extends DynamicOdOptions = DynamicOdOptions,
> extends z.ZodType<T['_output'], OdOptionTypeDef<T, ZO>, T['_input']> {
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
    return new OdOption({
      innerType: this._odInnerType,
      odOptions: {...this._def.odOptions, ...odOptions},
    });
  }

  /**
   * Returns the `description` property of the inner `ZodType` _or_ the
   * `describe` property of the `OdOptions` (if set), preferring the former.
   */
  override get description() {
    let desc: string | undefined;
    switch (this._odInnerType._def.typeName) {
      case z.ZodFirstPartyTypeKind.ZodString:
      case z.ZodFirstPartyTypeKind.ZodBoolean:
      case z.ZodFirstPartyTypeKind.ZodNumber:
      case z.ZodFirstPartyTypeKind.ZodEnum:
      case z.ZodFirstPartyTypeKind.ZodArray:
        desc = this._odInnerType.description;
        break;
      case z.ZodFirstPartyTypeKind.ZodOptional:
        desc = this._odInnerType._def.innerType.description;
        break;
    }
    return desc ?? this._def.odOptions.describe;
  }

  alias(alias: string | string[]) {
    return this.option({alias});
  }

  global() {
    return this.option({global: true});
  }

  hidden() {
    return this.option({hidden: true});
  }

  defaultDescription(defaultDescription: string) {
    return this.option({defaultDescription});
  }

  group(group: string) {
    return this.option({group});
  }

  count() {
    return this.option({count: true});
  }

  normalize() {
    return this.option({normalize: true});
  }

  nargs(nargs: number) {
    return this.option({nargs});
  }

  demandOption() {
    return this.option({demandOption: true});
  }
  option(config?: DynamicOdOptions) {
    return this instanceof OdOption
      ? this._cloneWith(config)
      : new OdOption({odOptions: {...config}, innerType: this});
  }
  _toYargsOptions(): y.Options {
    return (this._odInnerType as unknown as OdSupportedType)._toYargsOptions();
  }
}
