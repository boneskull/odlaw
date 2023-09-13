/**
 * Monkeypatching utilities
 *
 * @packageDocumentation
 */

/**
 * Tracks what we've monkeypatched so we can more easily un-monkeypatch it
 * later.
 * @internal
 */
const propIndex = new WeakMap<object, object>();

/**
 * Wrapper around {@linkcode Object.defineProperty} which forces `configurable`
 * to `true`.
 *
 * @internal
 * @remarks Create a type which adds the property to `obj` `T`; figure out how
 * to derive the type of `prop` `K` from {@linkcode PropertyDescriptor} `D`.
 * @param obj Object to define property on
 * @param prop Property name
 * @param descriptor Property descriptor
 */
export function defineProperty(
  obj: object,
  prop: PropertyKey,
  descriptor: PropertyDescriptor,
): object {
  return Object.defineProperty(obj, prop, {...descriptor, configurable: true});
}

/**
 * Given `obj`, monkeypatch it with `props` and return the result.
 *
 * Checks `flag` to see if we've already monkeypatched `obj`.
 *
 * @param flag - Symbol to use to track whether we've monkeypatched `obj`
 * @param obj - Object to monkeypatch
 * @param props - Stuff to monkeypatch `obj` with
 * @returns `obj`, freshly monkeypatched
 * @internal
 */
export function monkeypatch<T extends object, U extends object>(
  flag: symbol,
  obj: T,
  props: U,
): T & U {
  if (Reflect.hasOwnProperty.call(obj, flag)) {
    return obj as any;
  }
  const descriptorEntries: [
    name: PropertyKey,
    descriptor: PropertyDescriptor,
  ][] = [];
  for (const prop of [...Object.getOwnPropertyNames(props)]) {
    descriptorEntries.push([
      prop,
      {...Object.getOwnPropertyDescriptor(props, prop), configurable: true},
    ]);
  }
  const descriptors = Object.fromEntries(descriptorEntries);
  Object.defineProperties(obj, {
    ...descriptors,
    [flag]: {value: true, enumerable: false, configurable: true},
  });
  propIndex.set(obj, descriptors);
  return obj as any;
}

export function unmonkeypatch<T extends object>(
  flag: symbol,
  obj: T,
): Exclude<T, keyof unknown> | T {
  if (!Reflect.hasOwnProperty.call(obj, flag)) {
    return obj as any;
  }
  const descriptors = propIndex.get(obj);
  if (!descriptors) {
    return obj;
  }
  for (const prop of Object.keys(descriptors)) {
    delete obj[prop as keyof T];
  }
  delete obj[flag as keyof T];
  propIndex.delete(obj);

  return obj as any;
}
