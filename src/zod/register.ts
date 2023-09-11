/**
 * Implementation of new methods grafted onto `zod`'s `ZodType` abstract class and its `ZodObject` subclass.
 *
 * See `zodtype-augment.ts` for the module augmentation itself.
 * @packageDocumentation
 */

/* eslint-disable no-prototype-builtins */
/* eslint-disable @typescript-eslint/no-unused-vars */

import z from 'zod';
import {
  createPrototypeProxy,
  monkeypatch,
  restorePrototypeProxy,
  unmonkeypatch,
} from '../monkey';
import {OdCommand, OdCommandZodType} from './od-command';
import {OdOptionZodType} from './od-option';
export const kOd: unique symbol = Symbol('kOd');

const SUPPORTED_OPTION_ZOD_TYPES = [
  z.ZodString,
  z.ZodArray,
  z.ZodBoolean,
  z.ZodNumber,
  z.ZodEnum,
] as const;

const ZODTYPE_PROXY_HANDLERS = new Map<
  new (...args: any[]) => any,
  ProxyHandler<object>
>([
  [
    z.ZodArray,
    {
      get(target: z.ZodArray<any>, prop: string | symbol) {
        target; // ?
        const innerType = Reflect.get(target, '_def').type;
        if (prop in OdOptionZodType.prototype) {
          if (
            SUPPORTED_OPTION_ZOD_TYPES.some((ctor) => innerType instanceof ctor)
          ) {
            return Reflect.get(target, prop);
          }
          throw new TypeError(
            `Unsupported array type: ${innerType._def.typeName}`,
          );
        }
        return Reflect.get(target, prop);
      },
    },
  ],
  [
    z.ZodOptional,
    {
      get(target: z.ZodOptional<any>, prop: string | symbol) {
        if (prop in OdOptionZodType.prototype) {
          const innerType = Reflect.get(target, '_def').innerType;
          if (
            SUPPORTED_OPTION_ZOD_TYPES.some((ctor) => innerType instanceof ctor)
          ) {
            return Reflect.get(target, prop);
          }
          throw new TypeError(
            `Unsupported array type: ${innerType._def.typeName}`,
          );
        }
        return Reflect.get(target, prop);
      },
    },
  ],
]);

const SUPPORTED_COMMAND_ZOD_TYPES = [z.ZodObject] as const;

/**
 * Monkeypatches Zod with yargs extensions
 */
export function register(zod: typeof z) {
  if ('kOd' in zod) {
    return zod;
  }

  for (const ctor of SUPPORTED_OPTION_ZOD_TYPES) {
    monkeypatch(kOd, ctor.prototype, OdOptionZodType.prototype);
  }
  for (const ctor of SUPPORTED_COMMAND_ZOD_TYPES) {
    monkeypatch(kOd, ctor.prototype, OdCommandZodType.prototype);
  }

  monkeypatch(kOd, zod, {command: OdCommand.create});

  for (const [ctor, handler] of ZODTYPE_PROXY_HANDLERS) {
    createPrototypeProxy(kOd, ctor, handler);
  }

  return zod;
}

/**
 * Removes the stuff this package put on `ZodType`.
 * @param zod
 * @returns
 */
export function unregister(zod: typeof z) {
  if (!(kOd in zod)) {
    return zod;
  }

  for (const ctor of ZODTYPE_PROXY_HANDLERS.keys()) {
    restorePrototypeProxy(kOd, ctor);
  }

  // 1. `_yargsType` is not enumerable, so we have to ask for it specifically
  // 2. likewise, `kOd` is not enumerable because it's a `Symbol`
  // for (const prop of [...Object.keys(OdProto), '_yargsType', kOd]) {
  //   delete proto[prop as keyof typeof OdProto];
  // }
  unmonkeypatch(kOd, zod);

  for (const ctor of [
    ...SUPPORTED_COMMAND_ZOD_TYPES,
    ...SUPPORTED_OPTION_ZOD_TYPES,
  ]) {
    unmonkeypatch(kOd, ctor.prototype);
  }

  return zod;
}
