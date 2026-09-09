import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  TextInput,
  useWindowDimensions,
} from 'react-native';

import { showAlert } from '../../../utils/alert';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import {
  requestLocationPermissionWebSafe,
  getCurrentPositionWebSafe,
  reverseGeocodeWebSafe,
  geocodeWebSafe,
} from '../../../utils/locationHelper';

const HospitalListScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 768;

  const [hospitals, setHospitals] = useState([]);
  const [filteredHospitals, setFilteredHospitals] = useState([]);

  const [userLocation, setUserLocation] = useState(null);

  const [searchText, setSearchText] = useState('');

  const [loading, setLoading] = useState(true);

  const [searchingLocation, setSearchingLocation] =
    useState(false);

  const [filter, setFilter] = useState('nearest');


  // ==================================================
  // GET REAL GPS LOCATION
  // ==================================================

  const getCurrentLocation = async () => {

    try {

      setLoading(true);

      const servicesEnabled =
        await Location.hasServicesEnabledAsync();

      if (!servicesEnabled) {

        setLoading(false);

        Alert.alert(
          'Location Disabled',
          'Please enable GPS/location services on your phone.'
        );

        return;
      }


      const perm =
        await requestLocationPermissionWebSafe();

      if (!perm.granted && perm.status !== 'granted') {

        setLoading(false);

        showAlert(
          'Location Permission Required',
          'MediUnify needs your location to find nearby hospitals.'
        );

        return;
      }


      const location =
        await getCurrentPositionWebSafe({
          accuracy: Location.Accuracy.Balanced,
        });


      const latitude =
        location.coords.latitude;

      const longitude =
        location.coords.longitude;


      console.log(
        'REAL GPS LOCATION'
      );

      console.log(
        'Latitude:',
        latitude
      );

      console.log(
        'Longitude:',
        longitude
      );


      const currentLocation = {
        latitude,
        longitude,
      };


      setUserLocation(
        currentLocation
      );


      // Reverse geocode to show readable location
      try {

        const address =
          await reverseGeocodeWebSafe({
            latitude,
            longitude,
          });


        if (
          address &&
          address.length > 0
        ) {

          const place =
            address[0];

          const locationName = [
            place.name,
            place.city,
            place.region,
          ]
            .filter(Boolean)
            .join(', ');


          if (locationName) {
            setSearchText(
              locationName
            );
          }
        }

      } catch (error) {

        console.log(
          'Reverse geocode error:',
          error
        );

      }


      await findNearbyHospitals(
        latitude,
        longitude
      );

    } catch (error) {

      console.log(
        'GPS Location Error:',
        error
      );


      Alert.alert(
        'Location Error',
        'Unable to get your current location.'
      );

    } finally {

      setLoading(false);

    }
  };


  // ==================================================
  // SEARCH LOCATION
  // ==================================================

  const searchLocation = async () => {

    const query =
      searchText.trim();


    if (!query) {

      Alert.alert(
        'Enter Location',
        'Please enter a city, area or location.'
      );

      return;
    }


    try {

      setSearchingLocation(true);


      const result =
        await geocodeWebSafe(
          query
        );


      if (
        !result ||
        result.length === 0
      ) {

        Alert.alert(
          'Location Not Found',
          'We could not find that location. Try another city or area.'
        );

        return;
      }


      const latitude =
        result[0].latitude;

      const longitude =
        result[0].longitude;


      console.log(
        'SEARCHED LOCATION:',
        query
      );

      console.log(
        'Latitude:',
        latitude
      );

      console.log(
        'Longitude:',
        longitude
      );


      const selectedLocation = {
        latitude,
        longitude,
      };


      setUserLocation(
        selectedLocation
      );


      await findNearbyHospitals(
        latitude,
        longitude
      );

    } catch (error) {

      console.log(
        'Location Search Error:',
        error
      );


      Alert.alert(
        'Search Error',
        'Unable to search this location. Please try again.'
      );

    } finally {

      setSearchingLocation(
        false
      );
    }
  };


  // ==================================================
  // FIND NEARBY HOSPITALS
  // ==================================================

  const findNearbyHospitals = async (
    latitude,
    longitude
  ) => {

    try {

      setLoading(true);


      const radius = 10000;


      const query = `
        [out:json][timeout:25];

        (
          node["amenity"="hospital"]
          (around:${radius},${latitude},${longitude});

          way["amenity"="hospital"]
          (around:${radius},${latitude},${longitude});

          relation["amenity"="hospital"]
          (around:${radius},${latitude},${longitude});
        );

        out center tags;
      `;


      const response =
        await fetch(
          'https://overpass-api.de/api/interpreter',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/x-www-form-urlencoded',
            },

            body:
              'data=' +
              encodeURIComponent(query),
          }
        );


      if (!response.ok) {

        throw new Error(
          'Hospital service unavailable'
        );
      }


      const data =
        await response.json();


      const hospitalData =
        (data.elements || [])
          .map((item) => {

            let hospitalLatitude =
              item.lat;

            let hospitalLongitude =
              item.lon;


            // Ways and relations
            if (
              (!hospitalLatitude ||
                !hospitalLongitude) &&
              item.center
            ) {

              hospitalLatitude =
                item.center.lat;

              hospitalLongitude =
                item.center.lon;
            }


            if (
              hospitalLatitude ===
                undefined ||
              hospitalLongitude ===
                undefined
            ) {

              return null;
            }


            const tags =
              item.tags || {};


            return {

              id:
                `${item.type}-${item.id}`,

              name:
                tags.name ||
                'Unnamed Hospital',

              latitude:
                hospitalLatitude,

              longitude:
                hospitalLongitude,

              address:
                tags['addr:street'] ||
                tags['addr:city'] ||
                tags['addr:district'] ||
                'Address not available',

              phone:
                tags.phone ||
                tags['contact:phone'] ||
                'Phone not available',

              emergency:
                tags.emergency ||
                'Unknown',

              // Demo fee until real hospital data
              // is connected to the backend
              fee:
                tags['consultation:fee'] ||
                500,

              roadDistance: null,

              travelTime: null,
            };
          })
          .filter(Boolean);


      // ==================================================
      // REMOVE DUPLICATES
      // ==================================================

      const uniqueHospitals =
        hospitalData.filter(
          (hospital, index, array) => {

            return (
              index ===
              array.findIndex(
                (item) =>
                  item.name ===
                    hospital.name &&
                  Math.abs(
                    item.latitude -
                      hospital.latitude
                  ) < 0.0001 &&
                  Math.abs(
                    item.longitude -
                      hospital.longitude
                  ) < 0.0001
              )
            );
          }
        );


      // ==================================================
      // ROAD DISTANCE
      // ==================================================

      const hospitalsWithRoutes =
        await calculateRoadDistances(
          latitude,
          longitude,
          uniqueHospitals
        );


      hospitalsWithRoutes.sort(
        (a, b) =>
          (a.roadDistance ?? 999999) -
          (b.roadDistance ?? 999999)
      );


      setHospitals(
        hospitalsWithRoutes
      );

      setFilteredHospitals(
        hospitalsWithRoutes
      );

    } catch (error) {

      console.log(
        'Hospital Search Error:',
        error
      );


      setHospitals([]);

      setFilteredHospitals([]);


      Alert.alert(
        'Hospital Search Error',
        'Unable to find hospitals. Please check your internet connection and try again.'
      );

    } finally {

      setLoading(false);

    }
  };


  // ==================================================
  // ROAD DISTANCE USING OSRM
  // ==================================================

  const calculateRoadDistances = async (
    latitude,
    longitude,
    hospitalList
  ) => {

    const results = [];


    for (
      const hospital of hospitalList
    ) {

      try {

        const url =
          `https://router.project-osrm.org/route/v1/driving/` +
          `${longitude},${latitude};` +
          `${hospital.longitude},${hospital.latitude}` +
          `?overview=false`;


        const response =
          await fetch(url);


        if (!response.ok) {

          throw new Error(
            'Routing service unavailable'
          );
        }


        const data =
          await response.json();


        if (
          data.code === 'Ok' &&
          data.routes &&
          data.routes.length > 0
        ) {

          const route =
            data.routes[0];


          results.push({

            ...hospital,

            roadDistance:
              route.distance /
              1000,

            travelTime:
              Math.round(
                route.duration /
                  60
              ),

          });

        } else {

          results.push({

            ...hospital,

            roadDistance:
              null,

            travelTime:
              null,

          });
        }

      } catch (error) {

        console.log(
          'Route Error:',
          hospital.name
        );


        results.push({

          ...hospital,

          roadDistance:
            null,

          travelTime:
            null,

        });
      }
    }


    return results;
  };


  // ==================================================
  // APPLY FILTER
  // ==================================================

  const applyFilter = (
    selectedFilter
  ) => {

    setFilter(
      selectedFilter
    );


    const result =
      [...hospitals];


    if (
      selectedFilter ===
      'nearest'
    ) {

      result.sort(
        (a, b) =>
          (a.roadDistance ??
            999999) -
          (b.roadDistance ??
            999999)
      );
    }


    if (
      selectedFilter ===
      'farthest'
    ) {

      result.sort(
        (a, b) =>
          (b.roadDistance ??
            0) -
          (a.roadDistance ??
            0)
      );
    }


    if (
      selectedFilter ===
      'fee'
    ) {

      result.sort(
        (a, b) =>
          Number(a.fee) -
          Number(b.fee)
      );
    }


    setFilteredHospitals(
      result
    );
  };


  // ==================================================
  // OPEN MAP NAVIGATION
  // ==================================================

  const openNavigation = (
    latitude,
    longitude
  ) => {

    let url;


    if (
      Platform.OS === 'ios'
    ) {

      url =
        `http://maps.apple.com/?daddr=` +
        `${latitude},${longitude}`;

    } else {

      url =
        `https://www.google.com/maps/dir/?api=1` +
        `&destination=${latitude},${longitude}`;

    }


    Linking.openURL(
      url
    ).catch(() => {

      Alert.alert(
        'Navigation Error',
        'Unable to open the map application.'
      );

    });
  };


  // ==================================================
  // CALL HOSPITAL
  // ==================================================

  const callHospital = (
    phone
  ) => {

    if (
      !phone ||
      phone ===
        'Phone not available'
    ) {

      Alert.alert(
        'Phone Number Unavailable',
        'This hospital does not have a phone number listed.'
      );

      return;
    }


    const cleanPhone =
      phone.replace(
        /[^0-9+]/g,
        ''
      );


    Linking.openURL(
      `tel:${cleanPhone}`
    ).catch(() => {

      Alert.alert(
        'Call Error',
        'Unable to open the phone application.'
      );

    });
  };


  // ==================================================
  // INITIAL LOCATION
  // ==================================================

  useEffect(() => {

    getCurrentLocation();

  }, []);


  // ==================================================
  // HOSPITAL CARD
  // ==================================================

  const renderHospital = ({
    item,
  }) => {

    return (

      <View style={styles.card}>

        {/* HOSPITAL ICON */}

        <View
          style={
            styles.iconContainer
          }
        >

          <Ionicons
            name="business-outline"
            size={30}
            color="#7B1FA2"
          />

        </View>


        {/* INFORMATION */}

        <View
          style={styles.info}
        >

          <Text
            style={styles.name}
            numberOfLines={2}
          >
            {item.name}
          </Text>


          {/* ADDRESS */}

          <View
            style={styles.row}
          >

            <Ionicons
              name="location-outline"
              size={16}
              color="#78909C"
            />

            <Text
              style={styles.address}
              numberOfLines={2}
            >
              {item.address}
            </Text>

          </View>


          {/* DISTANCE */}

          <View
            style={
              styles.detailsRow
            }
          >

            {item.roadDistance !==
              null && (

              <View
                style={
                  styles.detailItem
                }
              >

                <Ionicons
                  name="car-outline"
                  size={16}
                  color="#1976D2"
                />

                <Text
                  style={
                    styles.distanceText
                  }
                >
                  {item.roadDistance.toFixed(
                    1
                  )}{' '}
                  km
                </Text>

              </View>

            )}


            {item.travelTime !==
              null && (

              <View
                style={
                  styles.detailItem
                }
              >

                <Ionicons
                  name="time-outline"
                  size={16}
                  color="#2E7D32"
                />

                <Text
                  style={
                    styles.travelText
                  }
                >
                  {item.travelTime}{' '}
                  min
                </Text>

              </View>

            )}

          </View>


          {/* FEE */}

          <View
            style={styles.infoRow}
          >

            <Ionicons
              name="cash-outline"
              size={17}
              color="#2E7D32"
            />

            <Text
              style={styles.feeText}
            >
              Consultation from ₹
              {item.fee}
            </Text>

          </View>


          {/* PHONE */}

          <View
            style={styles.infoRow}
          >

            <Ionicons
              name="call-outline"
              size={17}
              color="#1976D2"
            />

            <Text
              style={styles.phoneText}
              numberOfLines={1}
            >
              {item.phone}
            </Text>

          </View>


          {/* BUTTONS */}

          <View
            style={styles.buttonRow}
          >

            {/* CALL */}

            <TouchableOpacity
              style={
                styles.callButton
              }
              onPress={() =>
                callHospital(
                  item.phone
                )
              }
            >

              <Ionicons
                name="call-outline"
                size={17}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.buttonText
                }
              >
                Call
              </Text>

            </TouchableOpacity>


            {/* NAVIGATE */}

            <TouchableOpacity
              style={
                styles.navigationButton
              }
              onPress={() =>
                openNavigation(
                  item.latitude,
                  item.longitude
                )
              }
            >

              <Ionicons
                name="navigate-outline"
                size={17}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.buttonText
                }
              >
                Navigate
              </Text>

            </TouchableOpacity>

          </View>

        </View>

      </View>
    );
  };


  // ==================================================
  // LOADING
  // ==================================================

  if (
    loading ||
    searchingLocation
  ) {

    return (

      <SafeAreaView
        style={styles.container}
      >

        <View
          style={styles.header}
        >

          <TouchableOpacity
            style={
              styles.backButton
            }
            onPress={() =>
              navigation.goBack()
            }
          >

            <Ionicons
              name="arrow-back"
              size={24}
              color="#263238"
            />

          </TouchableOpacity>


          <Text
            style={styles.headerTitle}
          >
            Hospital Care
          </Text>


          <View
            style={styles.headerSpace}
          />

        </View>


        <View
          style={
            styles.loadingContainer
          }
        >

          <ActivityIndicator
            size="large"
            color="#1976D2"
          />


          <Text
            style={styles.loadingTitle}
          >
            {searchingLocation
              ? 'Searching location...'
              : 'Finding nearby hospitals...'}
          </Text>


          <Text
            style={
              styles.loadingSubtitle
            }
          >
            Please wait
          </Text>

        </View>

      </SafeAreaView>
    );
  }


  // ==================================================
  // MAIN SCREEN
  // ==================================================

  return (
    <SafeAreaView
      style={styles.container}
    >
      {/* HEADER (MOBILE ONLY) */}
      {!isDesktopWeb && (
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#263238" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hospital Care</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={getCurrentLocation}>
            <Ionicons name="locate-outline" size={23} color="#1976D2" />
          </TouchableOpacity>
        </View>
      )}



      {/* LOCATION SEARCH (MOBILE ONLY) */}
      {!isDesktopWeb && (
        <View style={styles.searchSection}>
          <Text style={styles.searchTitle}>Find hospitals near a location</Text>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={21} color="#78909C" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search city or area"
              placeholderTextColor="#90A4AE"
              value={searchText}
              onChangeText={setSearchText}
              returnKeyType="search"
              onSubmitEditing={searchLocation}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={20} color="#90A4AE" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.searchButton} onPress={searchLocation}>
              <Ionicons name="search" size={19} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.currentLocationButton} onPress={getCurrentLocation}>
            <Ionicons name="navigate-outline" size={17} color="#1976D2" />
            <Text style={styles.currentLocationText}>Use My Current Location</Text>
          </TouchableOpacity>
        </View>
      )}


      {/* CURRENT LOCATION */}

      {userLocation && (

        <View
          style={
            styles.locationCard
          }
        >

          <View
            style={
              styles.locationIcon
            }
          >

            <Ionicons
              name="location"
              size={20}
              color="#1976D2"
            />

          </View>


          <View
            style={
              styles.locationInformation
            }
          >

            <Text
              style={
                styles.locationTitle
              }
            >
              Searching around
            </Text>


            <Text
              style={
                styles.coordinates
              }
            >
              {searchText ||
                `${userLocation.latitude.toFixed(
                  5
                )}, ${userLocation.longitude.toFixed(
                  5
                )}`}
            </Text>

          </View>


          <Ionicons
            name="checkmark-circle"
            size={21}
            color="#2E7D32"
          />

        </View>

      )}


      {/* FILTER */}

      <View
        style={
          styles.filterSection
        }
      >

        <Text
          style={styles.filterTitle}
        >
          Sort hospitals
        </Text>


        <FlatList
          horizontal
          data={[
            {
              id: 'nearest',
              label: 'Nearest',
              icon: 'location-outline',
            },
            {
              id: 'rating',
              label: 'Highest Fee',
              icon: 'cash-outline',
            },
            {
              id: 'fee',
              label: 'Lowest Fee',
              icon: 'cash-outline',
            },
            {
              id: 'farthest',
              label: 'Farthest',
              icon: 'swap-vertical-outline',
            },
          ]}
          keyExtractor={
            (item) =>
              item.id
          }
          showsHorizontalScrollIndicator={
            false
          }
          renderItem={({
            item,
          }) => (

            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === item.id &&
                  styles.activeFilter,
              ]}
              onPress={() =>
                applyFilter(
                  item.id
                )
              }
            >

              <Ionicons
                name={item.icon}
                size={17}
                color={
                  filter === item.id
                    ? '#FFFFFF'
                    : '#1976D2'
                }
              />

              <Text
                style={[
                  styles.filterText,
                  filter === item.id &&
                    styles.activeFilterText,
                ]}
              >
                {item.label}
              </Text>

            </TouchableOpacity>

          )}
        />

      </View>


      {/* RESULT */}

      <View
        style={
          styles.resultHeader
        }
      >

        <Text
          style={styles.resultText}
        >
          {filteredHospitals.length}{' '}
          hospitals found
        </Text>


        <Text
          style={styles.resultSubText}
        >
          Within 10 km
        </Text>

      </View>


      {/* HOSPITAL LIST */}

      {filteredHospitals.length ===
      0 ? (

        <View
          style={
            styles.emptyContainer
          }
        >

          <Ionicons
            name="business-outline"
            size={60}
            color="#B0BEC5"
          />


          <Text
            style={
              styles.emptyTitle
            }
          >
            No hospitals found
          </Text>


          <Text
            style={
              styles.emptyText
            }
          >
            Try searching for another
            location or use your current
            location.
          </Text>


          <TouchableOpacity
            style={
              styles.retryButton
            }
            onPress={
              getCurrentLocation
            }
          >

            <Text
              style={
                styles.retryButtonText
              }
            >
              Use My Location
            </Text>

          </TouchableOpacity>

        </View>

      ) : (

        <FlatList
          data={
            filteredHospitals
          }
          keyExtractor={
            (item) =>
              item.id
          }
          renderItem={
            renderHospital
          }
          contentContainerStyle={
            styles.list
          }
          showsVerticalScrollIndicator={
            false
          }
        />

      )}

    </SafeAreaView>
  );
};


// ==================================================
// STYLES
// ==================================================

const styles =
  StyleSheet.create({

    container: {
      flex: 1,
      backgroundColor:
        '#F7F9FC',
    },


    header: {
      height: 70,
      paddingHorizontal: 18,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor:
        '#FFFFFF',
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor:
        '#F1F5F9',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    headerTitle: {
      flex: 1,
      marginLeft: 15,
      fontSize: 21,
      fontWeight: '800',
      color: '#263238',
    },

    refreshButton: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor:
        '#E8F1FF',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    headerSpace: {
      width: 42,
    },


    // SEARCH

    searchSection: {
      paddingHorizontal: 18,
      paddingTop: 15,
    },

    searchTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: '#263238',
      marginBottom: 10,
    },

    searchContainer: {
      height: 52,
      borderRadius: 15,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#DDE4EA',
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 14,
      paddingRight: 6,
    },

    searchInput: {
      flex: 1,
      marginLeft: 9,
      fontSize: 14,
      color: '#263238',
    },

    searchButton: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor:
        '#1976D2',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    currentLocationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 10,
      paddingVertical: 6,
    },

    currentLocationText: {
      marginLeft: 6,
      fontSize: 12,
      fontWeight: '700',
      color: '#1976D2',
    },


    // LOCATION

    locationCard: {
      marginHorizontal: 18,
      marginTop: 12,
      padding: 13,
      borderRadius: 15,
      backgroundColor:
        '#E8F1FF',
      flexDirection: 'row',
      alignItems: 'center',
    },

    locationIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor:
        '#FFFFFF',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    locationInformation: {
      flex: 1,
      marginLeft: 11,
    },

    locationTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: '#263238',
    },

    coordinates: {
      fontSize: 11,
      color: '#607D8B',
      marginTop: 3,
    },


    // FILTER

    filterSection: {
      marginTop: 16,
      paddingHorizontal: 18,
    },

    filterTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: '#263238',
      marginBottom: 9,
    },

    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      height: 40,
      borderRadius: 11,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#DDE4EA',
      marginRight: 8,
    },

    activeFilter: {
      backgroundColor:
        '#1976D2',
      borderColor:
        '#1976D2',
    },

    filterText: {
      marginLeft: 6,
      fontSize: 11,
      fontWeight: '700',
      color: '#1976D2',
    },

    activeFilterText: {
      color: '#FFFFFF',
    },


    // RESULTS

    resultHeader: {
      paddingHorizontal: 18,
      marginTop: 17,
      marginBottom: 8,
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems:
        'center',
    },

    resultText: {
      fontSize: 15,
      fontWeight: '800',
      color: '#263238',
    },

    resultSubText: {
      fontSize: 11,
      color: '#78909C',
    },


    // LIST

    list: {
      paddingHorizontal: 18,
      paddingBottom: 30,
    },

    card: {
      backgroundColor:
        '#FFFFFF',
      borderRadius: 18,
      padding: 15,
      marginBottom: 13,
      flexDirection: 'row',
      borderWidth: 1,
      borderColor:
        '#ECEFF1',
    },

    iconContainer: {
      width: 58,
      height: 58,
      borderRadius: 16,
      backgroundColor:
        '#F3E5F5',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    info: {
      flex: 1,
      marginLeft: 13,
    },

    name: {
      fontSize: 16,
      fontWeight: '800',
      color: '#263238',
      marginBottom: 6,
    },

    row: {
      flexDirection: 'row',
      alignItems:
        'flex-start',
    },

    address: {
      flex: 1,
      marginLeft: 5,
      fontSize: 12,
      color: '#78909C',
      lineHeight: 17,
    },


    // DISTANCE

    detailsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 9,
      gap: 14,
    },

    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    distanceText: {
      marginLeft: 5,
      fontSize: 12,
      color: '#1976D2',
      fontWeight: '700',
    },

    travelText: {
      marginLeft: 5,
      fontSize: 12,
      color: '#2E7D32',
      fontWeight: '700',
    },


    // FEE

    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },

    feeText: {
      marginLeft: 6,
      fontSize: 12,
      color: '#2E7D32',
      fontWeight: '700',
    },


    // PHONE

    phoneText: {
      flex: 1,
      marginLeft: 6,
      fontSize: 12,
      color: '#546E7A',
      fontWeight: '600',
    },


    // BUTTONS

    buttonRow: {
      flexDirection: 'row',
      marginTop: 11,
      gap: 8,
    },

    callButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      backgroundColor:
        '#2E7D32',
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },

    navigationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      backgroundColor:
        '#1976D2',
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },

    buttonText: {
      marginLeft: 5,
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },


    // LOADING

    loadingContainer: {
      flex: 1,
      justifyContent:
        'center',
      alignItems:
        'center',
      paddingHorizontal: 30,
    },

    loadingTitle: {
      marginTop: 18,
      fontSize: 18,
      fontWeight: '800',
      color: '#263238',
    },

    loadingSubtitle: {
      marginTop: 7,
      fontSize: 13,
      color: '#78909C',
      textAlign: 'center',
    },


    // EMPTY

    emptyContainer: {
      flex: 1,
      justifyContent:
        'center',
      alignItems:
        'center',
      paddingHorizontal: 35,
    },

    emptyTitle: {
      marginTop: 15,
      fontSize: 19,
      fontWeight: '800',
      color: '#263238',
    },

    emptyText: {
      marginTop: 8,
      textAlign: 'center',
      fontSize: 13,
      lineHeight: 20,
      color: '#78909C',
    },

    retryButton: {
      marginTop: 20,
      backgroundColor:
        '#1976D2',
      paddingHorizontal: 22,
      paddingVertical: 12,
      borderRadius: 12,
    },

    retryButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },

    webBreadcrumbWrap: {
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#E2E8F0',
      marginBottom: 10,
    },
    webBreadcrumbRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    webBreadcrumbLink: {
      fontSize: 12.5,
      fontWeight: '700',
      color: '#0071DC',
    },
    webBreadcrumbCurrent: {
      fontSize: 12.5,
      fontWeight: '600',
      color: '#64748B',
    },

  });

export default HospitalListScreen;