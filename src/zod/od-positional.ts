import z from 'zod';
import {createOdCommand} from './od-command';
import {getYargsTypeForPositional} from './yargs';

export interface OdPositionalOptions {
  alias?: string | string[];
  demandOption?: boolean | string;
  describe?: string;
  normalize?: boolean;
  name: string;
}

export type PositionalZodType =
  | z.ZodString
  | z.ZodBoolean
  | z.ZodNumber
  | z.ZodEnum<any>
  | z.ZodOptional<any>
  | z.ZodDefault<any>;

export type PositionalTupleItems = [PositionalZodType, ...PositionalZodType[]];
export type AnyPositionalTupleItems = [...PositionalZodType[]];

export type PositionalTuple<Items extends AnyPositionalTupleItems> =
  Items extends PositionalTupleItems ? z.ZodTuple<Items, z.ZodString> : never;

// export interface PositionalShape<
//   Items extends z.ZodTupleItems,
//   _ extends PositionalTuple<Items>,
// > extends z.ZodRawShape {
//   _: _;
// }

// export type Positional<T extends PositionalZodType> = Omit<
//   T,
//   'global' | 'hidden' | 'deprecated' | 'group' | 'defaultDescription' | 'nargs'
// >;

// function isPositionalShape<S extends z.ZodRawShape, PT extends PositionalTuple>(
//   s: S,
// ): s is PositionalShape<S, PT> {
//   return (
//     '_' in s &&
//     s._ instanceof z.ZodTuple &&
//     s._._def.rest instanceof z.ZodString
//   );
// }

export function isPositionalTuple<Items extends PositionalTupleItems>(
  t: any,
): t is PositionalTuple<Items> {
  return t instanceof z.ZodTuple && t._def.rest instanceof z.ZodString;
}

export type ExtendPositionalTuple<
  S extends z.ZodRawShape,
  P extends PositionalZodType,
  CurItems extends AnyPositionalTupleItems,
> = CurItems extends PositionalTupleItems
  ? z.objectUtil.extendShape<S, {_: PositionalTuple<[...CurItems, P]>}>
  : z.objectUtil.extendShape<S, {_: PositionalTuple<[P]>}>;

export function createPositional<
  T extends z.ZodObject<S, any, any, any, any>,
  P extends PositionalZodType,
  CurTuple extends PositionalTuple<CurItems>,
  S extends z.ZodRawShape & {_?: CurTuple},
  CurItems extends PositionalTupleItems,
>(
  this: T,
  name: string,
  schema: P,
  opts: Partial<OdPositionalOptions> = {},
): z.ZodObject<
  ExtendPositionalTuple<S, P, CurItems>,
  'passthrough',
  T['_def']['catchall']
> {
  const type = getYargsTypeForPositional(schema);
  if (!type) {
    throw new TypeError('Unsupported positional schema');
  }

  const {shape} = this;

  if (shape._ && isPositionalTuple(shape._)) {
    const items = shape._.items;
    const newPositionals = z.tuple([...items, schema]).rest(z.string());
    newPositionals._def.odPositionalOptions = [
      ...(shape._._def.odPositionalOptions ?? []),
      {...opts, name},
    ];
    return createOdCommand(this, {
      command: this._def.odCommandOptions.command ?? '',
    })
      .extend({_: newPositionals})
      .passthrough() as any;
  }

  const newPositionals = z.tuple([schema]).rest(z.string());
  newPositionals._def.odPositionalOptions = [{...opts, name}];

  return createOdCommand(this, {
    command: this._def.odCommandOptions.command ?? '',
  })
    .extend({
      _: z.tuple([schema]).rest(z.string()),
    })
    .passthrough() as any;
}
