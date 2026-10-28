const {
  withAndroidManifest,
  withDangerousMod,
} = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

// The account server is HTTPS-only: cleartext is blocked for it. Everything
// else stays allowed because some channels use direct http:// streams.
const SERVER_DOMAIN = "it.web-gaming.ir";

const XML = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true" />
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">${SERVER_DOMAIN}</domain>
    </domain-config>
</network-security-config>
`;

function withNetworkSecurityConfig(config) {
  config = withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application?.[0];
    if (application) {
      application.$["android:networkSecurityConfig"] =
        "@xml/network_security_config";
      // The security config above decides per domain; the blanket flag is
      // not needed any more.
      delete application.$["android:usesCleartextTraffic"];
    }
    return config;
  });

  config = withDangerousMod(config, [
    "android",
    async (config) => {
      const dir = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/main/res/xml",
      );
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, "network_security_config.xml"), XML);
      return config;
    },
  ]);

  return config;
}

module.exports = withNetworkSecurityConfig;
