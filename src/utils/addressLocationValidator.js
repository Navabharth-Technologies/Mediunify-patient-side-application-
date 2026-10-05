/**
 * Address & City Location Validator for MediUnify
 * Validates that an entered service/delivery address belongs to the currently active Home Screen city.
 */

// City definitions with canonical keys, display names, aliases, localities, and PIN prefixes
export const CITY_DEFINITIONS = {
  bangalore: {
    key: 'bangalore',
    displayName: 'Bangalore',
    fullLabel: 'Bangalore (Bengaluru)',
    aliases: ['bangalore', 'bengaluru', 'blr', 'bengalooru'],
    pinPrefixes: ['560', '561', '562'],
    localities: [
      'indiranagar', 'koramangala', 'hsr', 'hsr layout', 'whitefield', 'jayanagar',
      'jp nagar', 'electronic city', 'malleshwaram', 'malleswaram', 'hebbal',
      'banashankari', 'marathahalli', 'marathalli', 'btm', 'btm layout', 'yelahanka',
      'rajajinagar', 'bellandur', 'mg road', 'm.g. road', 'kengeri', 'basavanagudi',
      'domlur', 'ulsoor', 'halasuru', 'majestic', 'shivajinagar', 'cunningham',
      'richmond', 'commercial street', 'frazer town', 'rt nagar', 'peenya',
      'yeshwanthpur', 'yeshwantpur', 'banaswadi', 'kalyan nagar', 'sarjapur',
      'sarjapura', 'kanakapura road', 'bannerghatta', 'kadugodi', 'mahadevapura',
      'cv raman nagar', 'kammanahalli', 'vijayanagar bangalore', 'nagarbhavi',
      'vijayanagar, bangalore', 'vijayanagar, blr', 'sadashivanagar', 'sanjay nagar',
      'sahakar nagar', 'chamarajpet', 'basaveshwaranagar', 'kr puram', 'k.r. puram'
    ],
  },
  mysore: {
    key: 'mysore',
    displayName: 'Mysuru',
    fullLabel: 'Mysore (Mysuru)',
    aliases: ['mysuru', 'mysore', 'mys', 'mysooru'],
    pinPrefixes: ['570', '571'],
    localities: [
      'kuvempunagar', 'kuvempu nagar', 'jayalakshmipuram', 'saraswathipuram',
      'saraswathi puram', 'vijayanagar mysore', 'vijayanagar mysuru', 'vijayanagar, mysuru',
      'vijayanagar, mysore', 'vijayanagar 1st stage', 'vijayanagar 2nd stage',
      'vijayanagar 3rd stage', 'vijayanagar 4th stage', 'gokulam', 'gokulam 1st stage',
      'gokulam 2nd stage', 'gokulam 3rd stage', 'v.v. mohalla', 'vv mohalla',
      'vani vilas mohalla', 'bannimantap', 'banni mantap', 'nazarbad', 'hebbal mysore',
      'hebbal, mysore', 'mysore central', 'tk layout', 't.k. layout', 'siddhartha layout',
      'siddhartha nagar', 'dattagalli', 'bogadi', 'bogadi 2nd stage', 'yadavagiri',
      'vidyaranyapuram', 'chamundi', 'chamundipuram', 'chamundi hill', 'alanahalli',
      'metagalli', 'krs road', 'k.r.s road', 'hunsur road', 'nanjangud road',
      'ramakrishnanagar', 'ramakrishna nagar', 'sharadadevi nagar', 'roopa nagar',
      'lalitha mahal', 'agrahara', 'itkalpura', 'srirampura', 'jp nagar mysore'
    ],
  },
  hassan: {
    key: 'hassan',
    displayName: 'Hassan',
    fullLabel: 'Hassan',
    aliases: ['hassan', 'hasana'],
    pinPrefixes: ['573'],
    localities: [
      'channarayapatna', 'cr patna', 'c.r. patna', 'arsikere', 'belur',
      'sakleshpur', 'sakleshpura', 'holenarasipura', 'holenarasipur', 'alur',
      'arkalgud', 'hassan city', 'salagame road', 'shankarmutt', 'vidyanagar hassan',
      'kalyan nagar hassan', 'gorur road', 'b.m. road hassan', 'bm road hassan',
      'kattaya', 'shantigrama', 'dudda', 'javagal', 'banavara', 'halebeedu', 'halebid'
    ],
  },
  mangaluru: {
    key: 'mangaluru',
    displayName: 'Mangaluru',
    fullLabel: 'Mangalore (Mangaluru)',
    aliases: ['mangalore', 'mangaluru', 'kudla'],
    pinPrefixes: ['574', '575'],
    localities: [
      'kadri', 'bejai', 'hampankatta', 'surathkal', 'suratkal', 'ullal',
      'kankanady', 'pandeshwar', 'derebail', 'lalbagh mangalore', 'mannagudda',
      'kavoor', 'panambur', 'baikampady', 'attavar', 'falnir', 'car street',
      'bendoorwell', 'pumpwell', 'padil', 'urwa', 'ashoknagar mangalore', 'kottara'
    ],
  },
  hubli: {
    key: 'hubli',
    displayName: 'Hubballi',
    fullLabel: 'Hubli - Dharwad (Hubballi)',
    aliases: ['hubli', 'hubballi', 'dharwad', 'dharwad-hubli'],
    pinPrefixes: ['580'],
    localities: [
      'vidyanagar hubli', 'gokul road', 'keshwapur', 'deshpande nagar',
      'navanagar', 'unakal', 'old hubli', 'dharwad city', 'sattur', 'kelgeri',
      'line bazaar', 'cbt hubli', 'toll naka'
    ],
  },
  belgaum: {
    key: 'belgaum',
    displayName: 'Belagavi',
    fullLabel: 'Belgaum (Belagavi)',
    aliases: ['belgaum', 'belagavi'],
    pinPrefixes: ['590', '591'],
    localities: [
      'tilakwadi', 'shahapur belgaum', 'udyambag', 'vadgaon', 'khade bazaar',
      'camp belgaum', 'channamma circle', 'hindwadi', 'angol', 'bhagyanagar belgaum'
    ],
  },
  shimoga: {
    key: 'shimoga',
    displayName: 'Shimoga',
    fullLabel: 'Shimoga (Shivamogga)',
    aliases: ['shimoga', 'shivamogga'],
    pinPrefixes: ['577'],
    localities: ['gopala', 'vinoba nagar', 'durgigudi', 'savalanga road', 'kote road'],
  },
  davanagere: {
    key: 'davanagere',
    displayName: 'Davanagere',
    fullLabel: 'Davanagere',
    aliases: ['davanagere', 'davangere'],
    pinPrefixes: ['577'],
    localities: ['mcc a block', 'mcc b block', 'vidyanagar davanagere', 'hadadi road'],
  },
  udupi: {
    key: 'udupi',
    displayName: 'Udupi',
    fullLabel: 'Udupi - Manipal',
    aliases: ['udupi', 'manipal'],
    pinPrefixes: ['576'],
    localities: ['manipal', 'kunjibettu', 'kalsanka', 'malpe', 'santhekatte', 'amlabadi'],
  },
  tumkur: {
    key: 'tumkur',
    displayName: 'Tumkur',
    fullLabel: 'Tumkur (Tumakuru)',
    aliases: ['tumkur', 'tumakuru'],
    pinPrefixes: ['572'],
    localities: ['siddaganga', 'ss puram', 'batwadi', 'kyathsandra', 'gubbi gate'],
  },
};

/**
 * Resolves a city string (e.g. 'Mysuru', 'Bangalore', 'Bengaluru') to its canonical definition
 */
export const resolveCityDefinition = (cityName) => {
  if (!cityName || typeof cityName !== 'string') {
    return CITY_DEFINITIONS.bangalore;
  }
  const clean = cityName.trim().toLowerCase();

  for (const def of Object.values(CITY_DEFINITIONS)) {
    if (def.key === clean) return def;
    if (def.aliases.some((a) => clean.includes(a) || a.includes(clean))) return def;
  }

  // Default fallback
  return {
    key: clean.replace(/\s+/g, '-'),
    displayName: cityName.trim().charAt(0).toUpperCase() + cityName.trim().slice(1),
    fullLabel: cityName.trim(),
    aliases: [clean],
    pinPrefixes: [],
    localities: [],
  };
};

/**
 * Validates that an entered address belongs to the selected Home Screen city.
 *
 * @param {string} enteredAddress Complete user entered address text
 * @param {string} homeScreenCity Currently selected Home Screen city name
 * @param {string} [optionalPincode] Optional pincode from form input
 * @returns {object} { isValid: boolean, errorMessage: string | null, detectedCity: string | null, expectedCity: string }
 */
export const validateAddressMatchesCity = (enteredAddress, homeScreenCity, optionalPincode = '') => {
  const currentCityDef = resolveCityDefinition(homeScreenCity);
  const expectedCityDisplay = currentCityDef.displayName;

  if (!enteredAddress || typeof enteredAddress !== 'string' || !enteredAddress.trim()) {
    return {
      isValid: false,
      reason: 'EMPTY',
      expectedCity: expectedCityDisplay,
      errorMessage: 'Please enter complete service address (House/Flat No, Street, City, State, Pincode).',
    };
  }

  const cleanAddr = enteredAddress.trim().toLowerCase();
  const cleanPincode = (optionalPincode || '').trim();

  // Extract any 6-digit pincode in address text or optionalPincode
  const pinMatch = cleanAddr.match(/\b([1-9][0-9]{5})\b/) || cleanPincode.match(/\b([1-9][0-9]{5})\b/);
  const foundPin = pinMatch ? pinMatch[1] : '';

  // 1. Check for CONFLICTS with other cities by PINCODE
  if (foundPin) {
    for (const [otherKey, otherDef] of Object.entries(CITY_DEFINITIONS)) {
      if (otherKey !== currentCityDef.key) {
        const isOtherPin = otherDef.pinPrefixes.some((prefix) => foundPin.startsWith(prefix));
        const isCurrentPin = currentCityDef.pinPrefixes.some((prefix) => foundPin.startsWith(prefix));
        
        // If pincode belongs to another city and NOT to current city
        if (isOtherPin && !isCurrentPin) {
          return {
            isValid: false,
            reason: 'PINCODE_MISMATCH',
            detectedCity: otherDef.displayName,
            expectedCity: expectedCityDisplay,
            errorMessage: `Home Nursing is currently unavailable for this address. Please change your location or enter an address within ${expectedCityDisplay}.`,
          };
        }
      }
    }
  }

  // 2. Check for CONFLICTS with other cities by CITY NAME or LOCALITY
  for (const [otherKey, otherDef] of Object.entries(CITY_DEFINITIONS)) {
    if (otherKey !== currentCityDef.key) {
      // Check other city aliases (e.g. "mysuru", "mysore" in a Bangalore session)
      const hasOtherAlias = otherDef.aliases.some((alias) => {
        const regex = new RegExp(`\\b${alias}\\b`, 'i');
        return regex.test(cleanAddr);
      });

      if (hasOtherAlias) {
        return {
          isValid: false,
          reason: 'CITY_MISMATCH',
          detectedCity: otherDef.displayName,
          expectedCity: expectedCityDisplay,
          errorMessage: `Home Nursing is currently unavailable for this address. Please change your location or enter an address within ${expectedCityDisplay}.`,
        };
      }

      // Check specific localities of other cities (e.g. "kuvempunagar" in a Bangalore session)
      const hasOtherLocality = otherDef.localities.some((loc) => {
        // Only test if not also a substring of an expected locality
        const regex = new RegExp(`\\b${loc}\\b`, 'i');
        return regex.test(cleanAddr);
      });

      if (hasOtherLocality) {
        return {
          isValid: false,
          reason: 'LOCALITY_MISMATCH',
          detectedCity: otherDef.displayName,
          expectedCity: expectedCityDisplay,
          errorMessage: `Home Nursing is currently unavailable for this address. Please change your location or enter an address within ${expectedCityDisplay}.`,
        };
      }
    }
  }

  // 3. Positive match checks:
  // Does it explicitly mention current city alias, locality, or matching pin prefix?
  const hasCurrentAlias = currentCityDef.aliases.some((alias) => {
    const regex = new RegExp(`\\b${alias}\\b`, 'i');
    return regex.test(cleanAddr);
  });

  const hasCurrentLocality = currentCityDef.localities.some((loc) => {
    const regex = new RegExp(`\\b${loc}\\b`, 'i');
    return regex.test(cleanAddr);
  });

  const hasCurrentPin = foundPin && currentCityDef.pinPrefixes.some((p) => foundPin.startsWith(p));

  // If positive match is confirmed -> ALLOW
  if (hasCurrentAlias || hasCurrentLocality || hasCurrentPin) {
    return {
      isValid: true,
      reason: 'MATCH',
      detectedCity: expectedCityDisplay,
      expectedCity: expectedCityDisplay,
      errorMessage: null,
    };
  }

  // If user entered address without any city/locality/pin cues and it's long enough,
  // we check if it is explicitly ambiguous. If it doesn't mention the city or locality,
  // we prompt to include the city or locality name:
  return {
    isValid: false,
    reason: 'CITY_NOT_SPECIFIED',
    detectedCity: null,
    expectedCity: expectedCityDisplay,
    errorMessage: `Service is not available for this address. Please enter a ${expectedCityDisplay} address or change your Home Screen location and try again.`,
  };
};

export default {
  CITY_DEFINITIONS,
  resolveCityDefinition,
  validateAddressMatchesCity,
};
