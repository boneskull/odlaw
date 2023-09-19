import z from 'zod';

export type ZodObjectCont = <R>(
  cont: <
    T extends z.ZodRawShape,
    UnknownKeys extends z.UnknownKeysParam = z.UnknownKeysParam,
    Catchall extends z.ZodTypeAny = z.ZodTypeAny,
    Output = z.objectOutputType<T, Catchall, UnknownKeys>,
    Input = z.objectInputType<T, Catchall, UnknownKeys>,
  >(
    obj: z.ZodObject<T, UnknownKeys, Catchall, Output, Input>,
  ) => R,
) => R;

/**
 * Creates a continuation for Zod objects to implement existential types
 *
 * @param obj - Zod object
 * @returns Continuation function
 */
export function makeZodObjectCont<
  T extends z.ZodRawShape,
  UnknownKeys extends z.UnknownKeysParam = z.UnknownKeysParam,
  Catchall extends z.ZodTypeAny = z.ZodTypeAny,
  Output = z.objectOutputType<T, Catchall, UnknownKeys>,
  Input = z.objectInputType<T, Catchall, UnknownKeys>,
>(obj: z.ZodObject<T, UnknownKeys, Catchall, Output, Input>): ZodObjectCont {
  return <R>(
    schema: <
      T extends z.ZodRawShape,
      UnknownKeys extends z.UnknownKeysParam = z.UnknownKeysParam,
      Catchall extends z.ZodTypeAny = z.ZodTypeAny,
      Output = z.objectOutputType<T, Catchall, UnknownKeys>,
      Input = z.objectInputType<T, Catchall, UnknownKeys>,
    >(
      value: z.ZodObject<T, UnknownKeys, Catchall, Output, Input>,
    ) => R,
  ) => schema(obj);
}
