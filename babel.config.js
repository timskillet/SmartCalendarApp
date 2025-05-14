module.exports = function (api) {
  const isTest = api.env('test');
  api.cache(true);
  
  if (isTest) {
    // Simpler configuration for tests
    return {
      presets: ['@babel/preset-env']
    };
  } else {
    // Your existing configuration for the app
    return {
      presets: [
        ["babel-preset-expo", { jsxImportSource: "nativewind" }],
        "nativewind/babel",
      ],
    };
  }
};