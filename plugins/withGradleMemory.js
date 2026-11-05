const { withGradleProperties } = require("expo/config-plugins");

/**
 * Gives the Gradle build enough memory.
 *
 * The generated android/gradle.properties allows only 2 GiB of heap and
 * 512 MiB of metaspace. Packaging the release APKs (four CPU types plus the
 * universal one, each with the large VLC libraries) runs out of metaspace on
 * the GitHub runner and fails the `packageRelease` task with
 * "Multiple task action failures ... IncrementalSplitterRunnable".
 */
function setProp(modResults, key, value) {
  const existing = modResults.find(
    (item) => item.type === "property" && item.key === key,
  );
  if (existing) existing.value = value;
  else modResults.push({ type: "property", key, value });
}

module.exports = function withGradleMemory(config) {
  return withGradleProperties(config, (cfg) => {
    setProp(
      cfg.modResults,
      "org.gradle.jvmargs",
      "-Xmx4g -XX:MaxMetaspaceSize=1536m -XX:+UseParallelGC",
    );
    // Fewer parallel workers = less memory spike while packaging.
    setProp(cfg.modResults, "org.gradle.workers.max", "2");
    setProp(cfg.modResults, "kotlin.daemon.jvmargs", "-Xmx2g");
    return cfg;
  });
};
