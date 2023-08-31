module.exports = {
  '*.{js,ts}': ['eslint --fix', 'prettier --write'],
  '*.md': ['markdownlint-cli2-fix', 'prettier --write'],
  '*.ya?ml': ['prettier --write'],
  './package.json': ['prettier --write'],
};
