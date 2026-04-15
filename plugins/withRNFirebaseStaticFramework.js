const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

// Required when react-native-firebase is combined with use_frameworks! :linkage => :static
// https://rnfirebase.io/#altering-cocoapods-to-use-frameworks
//
// 1. $RNFirebaseAsStaticFramework = true  — tells RN Firebase to output static libs
// 2. use_modular_headers!                 — forces all pods to expose modular headers,
//    which fixes "non-modular header inside framework module" errors from RNFBApp
//    including React-Core headers.
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
      }

      if (!contents.includes("use_modular_headers!")) {
        contents = contents.replace(
          /target 'Expenzez' do\n  use_expo_modules!/,
          "target 'Expenzez' do\n  use_modular_headers!\n  use_expo_modules!"
        );
      }

      fs.writeFileSync(podfilePath, contents);
      return cfg;
    },
  ]);
};
