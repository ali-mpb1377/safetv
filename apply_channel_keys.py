#!/usr/bin/env python3
"""Patches TvPlayerView.kt and AdvancedVideoPlayer.tsx in place (1.8.5).

Usage:  python3 apply_channel_keys.py /path/to/project
Safe to run twice. Exits with an error if a place to patch cannot be found,
without touching that file.
"""
import sys, os

root = sys.argv[1] if len(sys.argv) > 1 else "."
failed = False

def patch(rel, steps, marker):
    global failed
    path = os.path.join(root, rel)
    if not os.path.isfile(path):
        print(f"MISSING  {rel}")
        failed = True
        return
    s = open(path, encoding="utf-8").read()
    if marker in s:
        print(f"already  {rel}")
        return
    for old, new, label in steps:
        if s.count(old) != 1:
            print(f"ERROR    {rel}: cannot find the place for: {label}")
            failed = True
            return
        s = s.replace(old, new, 1)
    open(path, "w", encoding="utf-8").write(s)
    print(f"patched  {rel}")

patch(
    "modules/tv-player/android/src/main/java/expo/modules/tvplayer/TvPlayerView.kt",
    [
        (
            "    val onEngineChange by EventDispatcher()\n",
            "    val onEngineChange by EventDispatcher()\n"
            "    val onChannelKey by EventDispatcher()\n",
            "event declaration",
        ),
        (
            "    override fun onDetachedFromWindow() {\n",
            "    /** Remote CH+ (up) / CH- (down), forwarded by MainActivity via KeyRegistry. */\n"
            "    fun dispatchChannelKey(up: Boolean) {\n"
            "        onChannelKey(mapOf(\"direction\" to if (up) \"up\" else \"down\"))\n"
            "    }\n\n"
            "    override fun onDetachedFromWindow() {\n",
            "onDetachedFromWindow",
        ),
        (
            "        super.onDetachedFromWindow()\n",
            "        KeyRegistry.clearListener(this)\n"
            "        super.onDetachedFromWindow()\n",
            "super.onDetachedFromWindow()",
        ),
        (
            "        super.onAttachedToWindow()\n",
            "        super.onAttachedToWindow()\n"
            "        KeyRegistry.setListener(this)\n",
            "super.onAttachedToWindow()",
        ),
    ],
    "KeyRegistry",
)

patch(
    "client/components/AdvancedVideoPlayer.tsx",
    [
        (
            "            onPipModeChange={(e) => {\n",
            "            onChannelKey={(e) => {\n"
            "              // Remote CH+ = next channel, CH- = previous channel (same as\n"
            "              // the buttons on screen).\n"
            "              const nav = e.nativeEvent.direction === \"up\" ? onNext : onPrevious;\n"
            "              if (!nav) return;\n"
            "              if (isBackgroundPlayingRef.current) {\n"
            "                TvPlayerCommands.disableBackgroundAudio(tvPlayerRef);\n"
            "              }\n"
            "              nav();\n"
            "            }}\n"
            "            onPipModeChange={(e) => {\n",
            "onPipModeChange prop",
        ),
    ],
    "onChannelKey",
)

sys.exit(1 if failed else 0)
