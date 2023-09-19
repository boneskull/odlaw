/**
 * Some Yargs-specific utils and types
 *
 * @packageDocumentation
 */
import type * as y from 'yargs';
import z from 'zod';
import {getTerminalZodType} from '../util';

/**
 * Various flavors of string types supported by Yargs
 */
export type OdInputString =
  | string
  | [string, ...string[]]
  | string[]
  | readonly string[]
  | readonly [string, ...string[]];

export type InputToYargsType<Input> = Input extends boolean
  ? 'boolean'
  : Input extends number
  ? 'number'
  : Input extends OdInputString
  ? 'string'
  : never;

/**
 * The equivalent of Yargs' `Options` based on the `Input` of `ZodType`.
 *
 * @typeParam Input - The `Input` of a `ZodType`; could be literally anything,
 *   but only a few types are supported by Yargs
 */
export interface YargsType<Input> {
  type: InputToYargsType<NonNullable<Input>>;
}

/**
 * Translates a Yargs-options-supporting `ZodType` into the equivalent Yargs
 * type, or `undefined` if the `ZodType` is unsupported.
 *
 * @param schema - Zod schema to convert
 * @returns Object containing `type` property with the equivalent Yargs type, or
 *   `undefined` if the `ZodType` is unsupported
 */
export function getYargsType<T extends z.ZodTypeAny>(
  schema: T,
): {type: InputToYargsType<z.input<T>>} | undefined {
  const innerType = getTerminalZodType(schema);

  switch (innerType?._def?.typeName) {
    case z.ZodFirstPartyTypeKind.ZodBoolean:
      return {type: 'boolean'} as any;
    case z.ZodFirstPartyTypeKind.ZodString:
    case z.ZodFirstPartyTypeKind.ZodEnum:
      return {type: 'string'} as any;
    case z.ZodFirstPartyTypeKind.ZodNumber:
      return {type: 'number'} as any;
  }
}

export type HasYargsType<T extends z.ZodTypeAny> = T extends {_yargsType: any}
  ? true
  : false;

export interface DemandCommandOpts {
  min: number;
  minMsg?: string;
  max?: number;
  maxMsg?: string;
}

export type HelpOpts =
  | {option: string; enableExplicit: boolean}
  | {option: string; description?: string; enableExplicit?: boolean};

export interface VersionOpts {
  version: string;
  optionKey: string;
  description?: string;
}

export interface OdYargsOptions {
  demandCommand?: boolean | DemandCommandOpts;
  detectLocale?: boolean;
  env?: boolean | string;

  epilog?: string;
  exitProcess?: boolean;

  help?: boolean | HelpOpts;

  locale?: string;

  onFinishCommand?: (result: any) => void;

  recommendCommands?: boolean;

  scriptName?: string;

  // todo: showHidden

  strict?: boolean;
  strictCommands?: boolean;
  strictOptions?: boolean;

  updateStrings?: Record<string, string>;

  version?: boolean | string | VersionOpts;
}

export class OdYargs<T> {
  argv: y.Argv<T>;

  opts: OdYargsOptions;
  constructor(argv: y.Argv<T>, opts: OdYargsOptions = {}) {
    this.argv = argv;
    this.opts = opts;
  }

  get locale() {
    return this.argv.locale;
  }

  configure(extraOpts: OdYargsOptions = {}) {
    const {
      demandCommand,
      detectLocale,
      env,
      epilog,
      exitProcess,
      help,
      locale,
      onFinishCommand,
      recommendCommands,
      scriptName,
      strict,
      strictCommands,
      strictOptions,
      updateStrings,
      version,
    } = {...this.opts, ...extraOpts};
    let {argv} = this;

    if (demandCommand !== undefined) {
      if (typeof demandCommand === 'object') {
        const {min, minMsg, max, maxMsg} = demandCommand;
        argv =
          max !== undefined
            ? argv.demandCommand(min, max, minMsg, maxMsg)
            : argv.demandCommand(min, minMsg);
      } else if (demandCommand) {
        argv.demandCommand();
      }
    }

    if (detectLocale !== undefined) {
      argv = argv.detectLocale(detectLocale);
    }

    if (env !== undefined) {
      argv = argv.env(env as any);
    }

    if (epilog !== undefined) {
      argv = argv.epilog(epilog);
    }

    if (exitProcess !== undefined) {
      argv = argv.exitProcess(exitProcess);
    }

    if (help !== undefined) {
      if (typeof help === 'boolean') {
        argv = argv.help(help);
      } else {
        argv =
          !('description' in help) && help.enableExplicit !== undefined
            ? argv.help(help.option, help.enableExplicit)
            : argv.help(help.option, help.description, help.enableExplicit);
      }
    }

    if (locale !== undefined) {
      argv = argv.locale(locale);
    }

    if (onFinishCommand !== undefined) {
      argv = argv.onFinishCommand(onFinishCommand);
    }

    if (recommendCommands === true) {
      argv = argv.recommendCommands();
    }

    if (scriptName !== undefined) {
      argv = argv.scriptName(scriptName);
    }

    if (strict !== undefined) {
      argv = argv.strict(strict);
    }

    if (strictCommands !== undefined) {
      argv = argv.strictCommands(strictCommands);
    }

    if (strictOptions !== undefined) {
      argv = argv.strictOptions(strictOptions);
    }

    if (updateStrings !== undefined) {
      argv = argv.updateStrings(updateStrings);
    }

    if (version !== undefined) {
      if (typeof version === 'string' || typeof version === 'boolean') {
        argv = argv.version(version as any);
      } else {
        const {optionKey, version: versionStr, description} = version;
        argv =
          description !== undefined
            ? argv.version(optionKey, description, versionStr)
            : argv.version(optionKey, versionStr);
      }
    }

    this.argv = argv;

    return argv;
  }
}
