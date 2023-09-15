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

// type someZodObject = z.ZodObject<
//   {foo: z.ZodOptional<z.ZodBoolean>},
//   'strip',
//   z.ZodTypeAny,
//   {foo?: boolean},
//   {foo?: boolean}
// >;

// expectType<OdCommand<someZodObject, {command: string | readonly string[]}>>(
//   z.object({foo: z.boolean()}).command('bar', 'desc'),
// );

// expectType<someZodObject>(
//   z.object({foo: z.boolean()}).command('bar', 'desc')._odInnerType,
// );

// expectType<{command: string | readonly string[]}>(
//   z.object({foo: z.boolean()}).command('bar', 'desc')._def.odCommandOptions,
// );

// expectType<string>(
//   z.object({foo: z.boolean()}).command('bar', 'desc')._def.description,
// );

// expectAssignable<
//   OdCommand<
//     z.AnyZodObject,
//     {
//       command: string | readonly string[];
//       middlewares: OdMiddleware<{}>[];
//     }
//   >
// >(
//   z.command({command: 'foo'}, {description: 'bar'}).middlewares([
//     (argv) => {
//       argv.butts = 1;
//     },
//   ]),
// );

// expectAssignable<
//   OdCommand<
//     someZodObject,
//     {
//       command: string | readonly string[];
//       middlewares: OdMiddleware<{foo: z.ZodOptional<z.ZodBoolean>}>[];
//     }
//   >
// >(
//   z
//     .object({
//       foo: z.boolean(),
//     })
//     .command('bar', 'baz')
//     .middlewares([
//       (argv) => {
//         argv.butts = 1;
//       },
//     ]),
// );

// expectAssignable<
//   OdCommand<
//     someZodObject,
//     {
//       command: string | readonly string[];
//       middlewares: OdMiddleware<{foo: z.ZodOptional<z.ZodBoolean>}>[];
//     }
//   >
// >(
//   z
//     .object({
//       foo: z.boolean(),
//     })
//     .command('bar', 'baz')
//     .middlewares(
//       (argv) => {
//         argv.butts = 1;
//       },
//       (argv) => {
//         argv.headss = 1;
//       },
//     ),
// );
