import React from 'react';
import ImagingScreenWeb from './ImagingScreen.web';

/**
 * RadiologyPaymentScreen
 * Forwards to the unified Web Scan & X-Ray / Radiology flow.
 */
const RadiologyPaymentScreen = (props) => {
  return <ImagingScreenWeb {...props} />;
};

export default RadiologyPaymentScreen;
