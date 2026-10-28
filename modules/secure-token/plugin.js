const {
  withSettingsGradle,
  withAppBuildGradle,
} = require("expo/config-plugins");

/**
 * Expo config plugin for secure-token.
 *
 * Wires the Keystore-backed secure-token module into the Android
 * build (settings.gradle + app/build.gradle). No AndroidManifest changes
 * are needed.
 */
function withSecureToken(config) {
  // 1. Include the local module in settings.gradle
  config = withSettingsGradle(config, (cfg) => {
    if (!cfg.modResults.contents.includes(":secure-token")) {
      cfg.modResults.contents += `\ninclude ':secure-token'\nproject(':secure-token').projectDir = new File(rootProject.projectDir, '../modules/secure-token/android')\n`;
    }
    return cfg;
  });

  // 2. Add the module as a dependency in app/build.gradle
  config = withAppBuildGradle(config, (cfg) => {
    if (!cfg.modResults.contents.includes("secure-token")) {
      cfg.modResults.contents = cfg.modResults.contents.replace(
        /dependencies\s*\{/,
        "dependencies {\n    implementation project(':secure-token')",
      );
    }
    return cfg;
  });

  return config;
}

module.exports = withSecureToken;
