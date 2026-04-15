const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

// Required when react-native-firebase is combined with use_frameworks! :linkage => :static
// https://rnfirebase.io/#altering-cocoapods-to-use-frameworks
module.exports = function withRNFirebaseStaticFramework(config) {
  return withDangerousMod(config, [
    "ios",
    async (cfg) => {
      const podfilePath = path.join(
        cfg.modRequest.platformProjectRoot,
        "Podfile"
      );
      let contents = fs.readFileSync(podfilePath, "utf8");
      if (!contents.includes("$RNFirebaseAsStaticFramework")) {
        contents = contents.replace(
          /prepare_react_native_project!/,
          "$RNFirebaseAsStaticFramework = true\n\nprepare_react_native_project!"
        );
        fs.writeFileSync(podfilePath, contents);
      }
      return cfg;
    },
  ]);
};
