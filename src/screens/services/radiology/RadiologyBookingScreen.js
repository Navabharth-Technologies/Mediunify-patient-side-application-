import React from 'react';
import ImagingScreenWeb from './ImagingScreen.web';

/**
 * RadiologyBookingScreen
 * Forwards to the unified Web Scan & X-Ray / Radiology flow.
 */
const RadiologyBookingScreen = (props) => {
  return <ImagingScreenWeb {...props} />;
};

export default RadiologyBookingScreen;
