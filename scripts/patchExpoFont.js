const fs = require('fs');
const path = require('path');

const targetFiles = [
  path.join(__dirname, '..', 'node_modules', 'expo-font', 'build', 'ExpoFontLoader.js'),
  path.join(__dirname, '..', 'node_modules', 'expo-font', 'src', 'ExpoFontLoader.ts'),
];

const safeCode = `import { requireOptionalNativeModule } from 'expo-modules-core';

const NativeFontLoader = (() => {
  try {
    return requireOptionalNativeModule('ExpoFontLoader');
  } catch (e) {
    return null;
  }
})();

const fallbackLoader = {
  getLoadedFonts() {
    return [];
  },
  loadAsync() {
    return Promise.resolve();
  },
  isLoaded() {
    return true;
  },
};

const m = NativeFontLoader || fallbackLoader;

export default m;
`;

targetFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    fs.writeFileSync(file, safeCode, 'utf8');
    console.log('[patchExpoFont] Successfully patched', file);
  }
});
