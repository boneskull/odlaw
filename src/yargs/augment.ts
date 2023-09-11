// declare module 'yargs' {
//   interface Argv<T = {}> {
//     schema<Z extends z.AnyZodObject>(
//       schema: Z,
//     ): yargs.Argv<
//       yargs.Omit<T, keyof Z['shape']> &
//         yargs.InferredOptionTypes<ExpandDeep<ZodObjectToYargsOptionsRecord<Z>>>
//     >;
//   }
// }

// export function register<U>(yargs: yargs.Argv<U>) {
//   yargs.schema = function schema<Z extends z.AnyZodObject>(schema: Z) {
//     return this.options(schema._toYargsOptionsRecord());
//   };
// }
