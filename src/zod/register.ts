/**
 * Implementation of new methods grafted onto `zod`'s `ZodType` abstract class and its `ZodObject` subclass.
 *
 * See `zodtype-augment.ts` for the module augmentation itself.
 * @packageDocumentation
 */

/* eslint-disable no-prototype-builtins */
/* eslint-disable @typescript-eslint/no-unused-vars */

import z from 'zod';
import {monkeypatch, unmonkeypatch} from '../monkey';
import {OdCommandZodType, createOdCommand} from './od-command';
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

const SUPPORTED_COMMAND_ZOD_TYPES = new Set([z.ZodObject] as const);

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

  // we are lucky that none of these have constructors. if they did,
  // we'd be SOL to trap it, because all properties of `z` are read-only.
  [...SUPPORTED_OPTION_ZOD_TYPES, ...SUPPORTED_COMMAND_ZOD_TYPES]
    .filter((ctor) => ctor.prototype.constructor === z.ZodType)
    .forEach((ctor) => {
      const proxy = new Proxy(ctor, {
        /**
         * This handler ensures that `odOptions`/`odCommandOptions` exist on the
         * `_def` of each `ZodType` (even if empty)
         */
        construct(target: any, [def]: [z.ZodAnyDef], receiver: any): any {
          let newDef =
            'odOptions' in def ? def : Object.assign(def, {odOptions: {}});
          newDef =
            'odCommandOptions' in def
              ? def
              : Object.assign(def, {odCommandOptions: {}});
          return Reflect.construct(target, [newDef], receiver);
        },
      });
      ctor.prototype.constructor = proxy;
    });

  return zod;
}

/**
 * Undo the horrible things we did to `zod`.
 * @param zod
 * @returns
 */
export function unregister(zod: typeof z) {
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

  [...SUPPORTED_OPTION_ZOD_TYPES]
    .filter((ctor) => ctor.prototype.constructor !== z.ZodType)
    .forEach((ctor) => {
      ctor.prototype.constructor = z.ZodType;
    });

  return zod;
}
