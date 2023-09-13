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
import {OdCommandZodType, createOdCommand} from './od-command';
import {OdOptionZodType} from './od-option';
export const kOd: unique symbol = Symbol('kOd');

const SUPPORTED_OPTION_ZOD_TYPES = [
  z.ZodString,
  z.ZodArray,
  z.ZodBoolean,
  z.ZodNumber,
  z.ZodEnum,
  z.ZodOptional,
] as const;

function commonConstructHandler(
  target: new (def: z.ZodAnyDef) => z.ZodTypeAny,
  [def]: [z.ZodAnyDef],
): z.ZodTypeAny {
  let newDef = 'odOptions' in def ? def : Object.assign(def, {odOptions: {}});
  newDef =
    'odCommandOptions' in def
      ? def
      : Object.assign(def, {odCommandOptions: {}});
  return Reflect.construct(target, [newDef]);
}

function commonGetHandler(target: z.ZodTypeAny, prop: PropertyKey) {
  const value = Reflect.get(target, prop);
  if (prop === 'description' && !value) {
    return Reflect.get(target, '_def')?.odOptions?.describe;
  }
  return value;
}

const ZODTYPE_PROXY_HANDLERS = new Map<any, ProxyHandler<object>>([
  [
    z.ZodArray,
    {
      get(target: z.ZodArray<any>, prop: string | symbol) {
        const innerType = Reflect.get(target, '_def').type;
        if (Reflect.hasOwnProperty.call(OdOptionZodType, prop)) {
          if (
            SUPPORTED_OPTION_ZOD_TYPES.some((ctor) => innerType instanceof ctor)
          ) {
            return Reflect.get(target, prop);
          }
          throw new TypeError(
            `Unsupported array type: ${innerType._def.typeName}`,
          );
        } else if (prop === 'description') {
          return (
            Reflect.get(target, 'description') ||
            Reflect.get(target, '_def')?.odOptions?.describe
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
        if (Reflect.hasOwnProperty.call(OdOptionZodType, prop)) {
          const innerType = Reflect.get(target, '_def').innerType;
          if (
            SUPPORTED_OPTION_ZOD_TYPES.some((ctor) => innerType instanceof ctor)
          ) {
            return Reflect.get(target, prop);
          } else if (prop === 'description') {
            return (
              Reflect.get(target, 'description') ||
              Reflect.get(target, '_def')?.odOptions?.describe
            );
          }
          throw new TypeError(
            `Unsupported array type: ${innerType._def.typeName}`,
          );
        }
        return Reflect.get(target, prop);
      },
    },
  ],
  [z.ZodBoolean, {get: commonGetHandler}],
  [z.ZodNumber, {get: commonGetHandler}],
  [z.ZodString, {get: commonGetHandler}],
  [z.ZodEnum, {get: commonGetHandler}],
  [z.ZodType, {construct: commonConstructHandler}],
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
    monkeypatch(kOd, ctor.prototype, OdOptionZodType);
  }
  for (const ctor of SUPPORTED_COMMAND_ZOD_TYPES) {
    monkeypatch(kOd, ctor.prototype, OdCommandZodType);
  }

  monkeypatch(kOd, zod, {command: createOdCommand});

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
