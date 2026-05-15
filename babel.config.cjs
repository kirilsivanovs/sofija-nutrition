module.exports = function (api) {
  const isTest = api.env('test');
  return {
    plugins: isTest ? ['babel-plugin-transform-import-meta'] : [],
  };
};
