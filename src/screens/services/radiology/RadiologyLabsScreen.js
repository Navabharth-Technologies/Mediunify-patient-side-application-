import React from 'react';
import ImagingScreenWeb from './ImagingScreen.web';

/**
 * RadiologyLabsScreen (Mobile, Tablet, Web)
 * Seamlessly integrates the unified Web Scan & X-Ray / Radiology flow
 * as the single source of truth across iOS, Android, and Tablet.
 * 
 * Complies with:
 * - Web Application Flow as Single Source of Truth
 * - Home Screen Location as Only Location Source (Mysuru, Hassan, Bengaluru, etc.)
 * - Full Categories & Tests from radiologyCatalogData
 * - Exact Centre Location with Google Maps Directions
 * - 3-Step Booking Wizard, Patient/Family Selection, and Payment Gateway
 * - Stored in My Appointments with persistent Google Maps directions
 */
const RadiologyLabsScreen = (props) => {
  return <ImagingScreenWeb {...props} />;
};

export default RadiologyLabsScreen;
