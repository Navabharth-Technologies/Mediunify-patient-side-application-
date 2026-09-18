const fs = require('fs');
const path = require('path');

const targetFiles = [
  path.join(__dirname, '..', 'node_modules', 'expo-asset', 'build', 'ExpoAsset.js'),
  path.join(__dirname, '..', 'node_modules', 'expo-asset', 'src', 'ExpoAsset.ts'),
];

const safeCode = `import { requireOptionalNativeModule } from 'expo-modules-core';

const AssetModule = (() => {
  try {
    return requireOptionalNativeModule('ExpoAsset');
  } catch {
    return null;
  }
})();

export async function downloadAsync(
  url,
  md5Hash,
  type
) {
  if (AssetModule && AssetModule.downloadAsync) {
    return AssetModule.downloadAsync(url, md5Hash, type);
  }
  return url;
}
`;

targetFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    fs.writeFileSync(file, safeCode, 'utf8');
    console.log('[patchExpoAsset] Patched', file);
  }
});

// Also fix tsconfig.json in expo-asset if present
const tsconfigFile = path.join(__dirname, '..', 'node_modules', 'expo-asset', 'tsconfig.json');
if (fs.existsSync(tsconfigFile)) {
  const cleanTsConfig = JSON.stringify({
    compilerOptions: {
      rootDir: "./src",
      outDir: "./build"
    },
    include: ["./src"],
    exclude: ["**/__mocks__/*", "**/__tests__/*", "**/__rsc_tests__/*"]
  }, null, 2);
  fs.writeFileSync(tsconfigFile, cleanTsConfig, 'utf8');
  console.log('[patchExpoAsset] Cleaned', tsconfigFile);
}
