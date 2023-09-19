import {expectAssignable, expectNotAssignable, expectType} from 'tsd';
import z from 'zod';
import {
  ExtendPositionalTuple,
  PositionalTuple,
  PositionalTupleItems,
} from '../../src/zod/od-positional';
// import {OdCommand, OdMiddleware} from '../../src/zod';

type Shape = {foo: z.ZodBoolean; _: CurTuple};

type CurItems = [z.ZodString];
type CurTuple = z.ZodTuple<CurItems, z.ZodString>;
type P = z.ZodString;

type ExtendedShape = ExtendPositionalTuple<Shape, P, CurItems>;

expectAssignable<z.ZodRawShape & {_?: CurTuple}>({
  foo: z.boolean(),
  _: z.tuple([z.string()]).rest(z.string()),
});

expectNotAssignable<PositionalTuple<CurItems>>(
  z.tuple([z.string(), z.string()]).rest(z.string()),
);

expectType<Shape>({
  foo: z.boolean(),
  _: z.tuple([z.string()]).rest(z.string()),
});

expectType<z.ZodObject<Shape, 'strip', z.ZodTypeAny>>(
  z.object({
    foo: z.boolean(),
    _: z.tuple([z.string()]).rest(z.string()),
  }),
);

type ExtendedObject = z.ZodObject<ExtendedShape, 'strip', z.ZodTypeAny>;

expectType<ExtendedObject>(
  z.object({
    foo: z.boolean(),
    _: z.tuple([z.string(), z.string()]).rest(z.string()),
  }),
);

expectType<ExtendedObject>(
  z
    .object({
      foo: z.boolean(),
      _: z.tuple([z.string()]).rest(z.string()),
    })
    .extend({_: z.tuple([z.string(), z.string()]).rest(z.string())}),
);

expectType<z.ZodObject<ExtendedShape, 'passthrough', z.ZodTypeAny>>(
  z
    .object({
      foo: z.boolean(),
      _: z.tuple([z.string()]).rest(z.string()),
    })
    .extend({_: z.tuple([z.string(), z.string()]).rest(z.string())})
    .passthrough(),
);

expectAssignable<PositionalTuple<[z.ZodString]>>(
  z.tuple([z.string()]).rest(z.string()),
);

expectAssignable<PositionalTupleItems>([z.string(), z.string()]);
