const withRNFirebaseStaticFramework = require("./plugins/withRNFirebaseStaticFramework");

module.exports = ({ config }) => {
  const next = {
    ...config,
    ios: {
      ...config.ios,
      googleServicesFile:
        process.env.GOOGLE_SERVICES_PLIST ?? config.ios?.googleServicesFile,
    },
    android: {
      ...config.android,
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON ?? config.android?.googleServicesFile,
    },
  };
  return withRNFirebaseStaticFramework(next);
};
