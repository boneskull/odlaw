/**
 * Implementation of new methods grafted onto `zod`'s `ZodType` abstract class
 * and its `ZodObject` subclass.
 *
 * See `zodtype-augment.ts` for the module augmentation itself.
 *
 * @packageDocumentation
 */

import z from 'zod';
import {monkeypatch, unmonkeypatch} from '../monkey';
import {OdCommandZodType, command} from './od-command';
import {OdOptionZodType} from './od-option';
export const kOd: unique symbol = Symbol('kOd');

export const SUPPORTED_OPTION_ZOD_TYPES = new Set([
  z.ZodString,
  z.ZodArray,
  z.ZodBoolean,
  z.ZodNumber,
  z.ZodEnum,
  z.ZodOptional,
  z.ZodDefault,
] as const);

export const SUPPORTED_POSITIONAL_ZOD_TYPES = new Set([
  z.ZodString,
  z.ZodBoolean,
  z.ZodNumber,
  z.ZodEnum,
  z.ZodOptional,
  z.ZodDefault,
] as const);

const SUPPORTED_COMMAND_ZOD_TYPES = new Set([z.ZodObject] as const);

/**
 * Monkeypatches Zod with yargs extensions
 *
 * @param zod - It's Zod.
 * @returns The monkeypatched `zod` object
 */
export function register(zod: typeof z = z) {
  if ('kOd' in zod) {
    return zod;
  }

  for (const ctor of SUPPORTED_OPTION_ZOD_TYPES) {
    monkeypatch(kOd, ctor.prototype, OdOptionZodType);
  }
  for (const ctor of SUPPORTED_COMMAND_ZOD_TYPES) {
    monkeypatch(kOd, ctor.prototype, OdCommandZodType);
  }

  monkeypatch(kOd, zod, {command});

  // we are lucky that none of these have constructors. if they did,
  // we'd be SOL to trap it, because all properties of `z` are read-only.
  [...SUPPORTED_OPTION_ZOD_TYPES, ...SUPPORTED_COMMAND_ZOD_TYPES]
    .filter((ctor) => ctor.prototype.constructor === z.ZodType)
    .forEach((ctor) => {
      const proxy = new Proxy(ctor, {
        /**
         * This handler ensures that `odOptions`/`odCommandOptions` exist on the
         * `_def` of each `ZodType` (even if empty)
         *
         * @param target - Proxy target
         * @param root0 - Arguments
         * @param root0."0" - Always a {@link z.ZodTypeDef}
         * @param receiver - Proxy receiver
         * @returns The result of the `ZodType` constructor with some added
         *   properties stuffed into the definition
         */
        construct(
          target: any,
          [def]: [z.ZodAnyDef | z.ZodObjectDef],
          receiver: any,
        ): any {
          if (SUPPORTED_OPTION_ZOD_TYPES.has(target)) {
            def.odOptions ??= {};
          }
          if (SUPPORTED_POSITIONAL_ZOD_TYPES.has(target)) {
            def.odPositionalOptions ??= {};
          } else if (SUPPORTED_COMMAND_ZOD_TYPES.has(target)) {
            (def as z.ZodObjectDef).odPositionals ??= {};
          }
          return Reflect.construct(target, [def], receiver);
        },
      });
      ctor.prototype.constructor = proxy;
    });

  return zod;
}

/**
 * Undo the horrible things we did to `zod`.
 *
 * @param zod - It's Zod.
 * @returns The original `zod` object
 */
export function unregister(zod: typeof z = z) {
  if (!(kOd in zod)) {
    return zod;
  }

  unmonkeypatch(kOd, zod);

  for (const ctor of [
    ...SUPPORTED_COMMAND_ZOD_TYPES,
    ...SUPPORTED_OPTION_ZOD_TYPES,
  ]) {
    unmonkeypatch(kOd, ctor.prototype);
  }

  [...SUPPORTED_OPTION_ZOD_TYPES, ...SUPPORTED_COMMAND_ZOD_TYPES]
    .filter((ctor) => ctor.prototype.constructor !== z.ZodType)
    .forEach((ctor) => {
      ctor.prototype.constructor = z.ZodType;
    });

  return zod;
}
