const fs = require("fs");
const path = require("path");
const {
  createRunOncePlugin,
  withDangerousMod,
} = require("expo/config-plugins");

const patchDefaultConfigMinSdk = (contents) => {
  const minSdkLine = "    minSdk = rootProject.ext.minSdkVersion";
  const minSdkVersionLine = "    minSdkVersion rootProject.ext.minSdkVersion";
  const linesToAdd = [
    contents.includes(minSdkLine.trim()) ? null : minSdkLine,
    contents.includes(minSdkVersionLine.trim()) ? null : minSdkVersionLine,
  ].filter(Boolean);

  if (linesToAdd.length === 0) {
    return contents;
  }

  return contents.replace(
    /defaultConfig\s*\{/,
    ["defaultConfig {", ...linesToAdd].join("\n")
  );
};

const patchAbiPlatformVersion = (contents) => {
  if (contents.includes("Keep expo-modules-core native ABI platform")) {
    return contents;
  }

  return `${contents.trimEnd()}

// Keep expo-modules-core native ABI platform aligned with the app minSdk.
gradle.projectsEvaluated {
  tasks.matching { task ->
    task.name.startsWith("configureCMake") && task.name.contains("[")
  }.configureEach { task ->
    task.doFirst {
      def abi = task.properties['abi$gradle_core']

      if (abi != null) {
        try {
          def field = abi.class.getDeclaredField("abiPlatformVersion")
          field.accessible = true
          field.setInt(abi, rootProject.ext.minSdkVersion as int)
        } catch (ignored) {
          // Not all Android Gradle Plugin versions expose this internal field.
        }
      }
    }
  }
}
`;
};

const patchCmakePlatform = (contents) => {
  const platformArg = '"-DANDROID_PLATFORM=android-${rootProject.ext.minSdkVersion}",';
  const systemVersionArg = '"-DCMAKE_SYSTEM_VERSION=${rootProject.ext.minSdkVersion}",';

  if (contents.includes(platformArg) && contents.includes(systemVersionArg)) {
    return contents;
  }

  return contents.replace(
    /arguments\s+"-DANDROID_STL=c\+\+_shared",/,
    [
      "arguments " + platformArg,
      "          " + systemVersionArg,
      '          "-DANDROID_STL=c++_shared",',
    ].join("\n")
  );
};

const withAndroidMinSdk = (config) => {
  return withDangerousMod(config, [
    "android",
    (config) => {
      const moduleBuildGradle = path.join(
        config.modRequest.projectRoot,
        "node_modules",
        "expo-modules-core",
        "android",
        "build.gradle"
      );

      if (fs.existsSync(moduleBuildGradle)) {
        const current = fs.readFileSync(moduleBuildGradle, "utf8");
        const patched = patchAbiPlatformVersion(
          patchCmakePlatform(patchDefaultConfigMinSdk(current))
        );

        if (patched !== current) {
          fs.writeFileSync(moduleBuildGradle, patched);
        }
      }

      return config;
    },
  ]);
};

module.exports = createRunOncePlugin(withAndroidMinSdk, "with-android-min-sdk", "1.0.0");
