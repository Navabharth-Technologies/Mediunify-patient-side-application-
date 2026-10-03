import React from 'react';
import ImagingScreenWeb from './ImagingScreen.web';

/**
 * ImagingScreen (Mobile, Tablet, Web)
 * Seamlessly integrates the unified Web Scan & X-Ray / Radiology flow
 * as the single source of truth across iOS, Android, and Tablet.
 */
const ImagingScreen = (props) => {
  return <ImagingScreenWeb {...props} />;
};

export default ImagingScreen;