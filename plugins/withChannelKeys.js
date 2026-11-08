const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Adds a dispatchKeyEvent() override to the generated MainActivity so the
 * remote's channel keys reach the open player (see KeyRegistry.kt).
 * Independent of the tv-player plugin; safe to run after it.
 */
function withChannelKeys(config) {
  return withDangerousMod(config, [
    "android",
    async (cfg) => {
      const pkg = cfg.android?.package ?? "com.prysmplayer.app";
      const mainActivityPath = path.join(
        cfg.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "java",
        ...pkg.split("."),
        "MainActivity.kt",
      );
      if (!fs.existsSync(mainActivityPath)) return cfg;

      let src = fs.readFileSync(mainActivityPath, "utf-8");
      if (src.includes("KeyRegistry")) return cfg; // already patched

      const method = `
    override fun dispatchKeyEvent(event: android.view.KeyEvent): Boolean {
        val code = event.keyCode
        val isUp = code == android.view.KeyEvent.KEYCODE_CHANNEL_UP ||
            code == android.view.KeyEvent.KEYCODE_PAGE_UP
        val isDown = code == android.view.KeyEvent.KEYCODE_CHANNEL_DOWN ||
            code == android.view.KeyEvent.KEYCODE_PAGE_DOWN
        if ((isUp || isDown) && expo.modules.tvplayer.KeyRegistry.isActive()) {
            // CH+ = next channel, CH- = previous channel. Only the first press
            // counts; the repeats and the release are swallowed.
            if (event.action == android.view.KeyEvent.ACTION_DOWN && event.repeatCount == 0) {
                expo.modules.tvplayer.KeyRegistry.dispatchChannelKey(isUp)
            }
            return true
        }
        return super.dispatchKeyEvent(event)
    }
`;
      const lastBrace = src.lastIndexOf("}");
      src = src.slice(0, lastBrace) + method + src.slice(lastBrace);
      fs.writeFileSync(mainActivityPath, src, "utf-8");
      return cfg;
    },
  ]);
}

module.exports = withChannelKeys;
