import React from 'react';
import ImagingScreenWeb from './ImagingScreen.web';

/**
 * RadiologyOrderSuccessScreen
 * Forwards to the unified Web Scan & X-Ray / Radiology flow in My Bookings view.
 */
const RadiologyOrderSuccessScreen = (props) => {
  return (
    <ImagingScreenWeb
      {...props}
      route={{
        ...props.route,
        params: {
          ...props.route?.params,
          initialView: 'my-bookings',
        },
      }}
    />
  );
};

export default RadiologyOrderSuccessScreen;
