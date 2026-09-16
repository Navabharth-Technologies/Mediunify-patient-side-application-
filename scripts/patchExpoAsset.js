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
