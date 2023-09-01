'use strict';

module.exports = () => {
  return {
    env: {
      type: 'node',
      params: {
        env: 'DEBUG=odlaw*',
      },
    },
    files: [
      './src/**/*.ts',
      'package.json',
      './test/**/fixture/**/.?*.json'
    ],
    testFramework: 'mocha',
    tests: ['./test/**/*.spec.ts'],
    runMode: 'onsave',
    setup(wallaby) {
      process.env.WALLABY_PROJECT_DIR = wallaby.localProjectDir;
    },
  };
};
