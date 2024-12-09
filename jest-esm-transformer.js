const { transform } = require('esbuild');

const processSource = (source) => transform(source, {
  loader: 'js',
  target: 'node14',
}).then((result) => result.code);

// module.exports = { process: processSource };
// eslint-disable-next-line
exports.process = processSource;