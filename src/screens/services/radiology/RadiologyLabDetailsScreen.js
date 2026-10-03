import React from 'react';
import ImagingScreenWeb from './ImagingScreen.web';

/**
 * RadiologyLabDetailsScreen
 * Forwards to the unified Web Scan & X-Ray / Radiology flow.
 */
const RadiologyLabDetailsScreen = (props) => {
  return <ImagingScreenWeb {...props} />;
};

export default RadiologyLabDetailsScreen;
