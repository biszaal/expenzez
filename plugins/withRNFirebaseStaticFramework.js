const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

// Without use_frameworks!, Firebase Swift pods (FirebaseCoreInternal, etc.)
// need modular headers to be importable from Obj-C modules. Injecting
// use_modular_headers! at the root of the Podfile sets DEFINES_MODULE=YES
// globally so every pod exposes a module map.
module.exports = function withRNFirebasePodfile(config) {
  return withDangerousMod(config, [
    "ios",
    async (cfg) => {
      const podfilePath = path.join(
        cfg.modRequest.platformProjectRoot,
        "Podfile"
      );
      let contents = fs.readFileSync(podfilePath, "utf8");

      if (!contents.includes("use_modular_headers!")) {
        contents = contents.replace(
          /prepare_react_native_project!/,
          "use_modular_headers!\n\nprepare_react_native_project!"
        );
      }

      fs.writeFileSync(podfilePath, contents);
      return cfg;
    },
  ]);
};
