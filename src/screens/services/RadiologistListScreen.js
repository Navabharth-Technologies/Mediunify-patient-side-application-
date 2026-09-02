import React, { useMemo, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';


// ==================================================
// DEMO RADIOLOGISTS
// ==================================================

const radiologists = [
  {
    id: '1',
    name: 'Dr. Ananya Sharma',
    specialty: 'Diagnostic Radiologist',
    experience: '12 years experience',
    qualification: 'MD Radiology',
    fee: 800,
    rating: 4.8,
    hospital: 'MediCare Diagnostic Centre',
    slots: [
      '09:00 AM',
      '10:30 AM',
      '12:00 PM',
      '03:00 PM',
      '05:00 PM',
    ],
  },

  {
    id: '2',
    name: 'Dr. Rahul Menon',
    specialty: 'Interventional Radiologist',
    experience: '10 years experience',
    qualification: 'MD, DNB Radiology',
    fee: 1000,
    rating: 4.7,
    hospital: 'City Diagnostic Hospital',
    slots: [
      '09:30 AM',
      '11:00 AM',
      '01:00 PM',
      '04:00 PM',
      '06:00 PM',
    ],
  },

  {
    id: '3',
    name: 'Dr. Priya Nair',
    specialty: 'Diagnostic Radiologist',
    experience: '9 years experience',
    qualification: 'MD Radiology',
    fee: 750,
    rating: 4.6,
    hospital: 'HealthPlus Imaging Centre',
    slots: [
      '10:00 AM',
      '11:30 AM',
      '02:00 PM',
      '04:30 PM',
      '06:30 PM',
    ],
  },

  {
    id: '4',
    name: 'Dr. Vikram Patel',
    specialty: 'Neuro Radiologist',
    experience: '15 years experience',
    qualification: 'MD, DM Radiology',
    fee: 1200,
    rating: 4.9,
    hospital: 'Advanced Scan Centre',
    slots: [
      '09:00 AM',
      '11:00 AM',
      '01:30 PM',
      '03:30 PM',
      '05:30 PM',
    ],
  },

  {
    id: '5',
    name: 'Dr. Meera Iyer',
    specialty: 'Diagnostic Radiologist',
    experience: '8 years experience',
    qualification: 'MD Radiology',
    fee: 700,
    rating: 4.5,
    hospital: 'Mysore Imaging Centre',
    slots: [
      '09:30 AM',
      '10:30 AM',
      '02:30 PM',
      '04:00 PM',
      '05:00 PM',
    ],
  },
];


// ==================================================
// SCREEN
// ==================================================

const RadiologistListScreen = ({
  navigation,
}) => {

  const [search, setSearch] =
    useState('');

  const [selectedSpecialty, setSelectedSpecialty] =
    useState('All');


  const specialties = [
    'All',
    'Diagnostic Radiologist',
    'Interventional Radiologist',
    'Neuro Radiologist',
  ];


  // ==================================================
  // FILTER
  // ==================================================

  const filteredRadiologists =
    useMemo(() => {

      const query =
        search.trim().toLowerCase();

      return radiologists.filter(
        (doctor) => {

          const matchesSearch =
            !query ||
            doctor.name
              .toLowerCase()
              .includes(query) ||
            doctor.specialty
              .toLowerCase()
              .includes(query) ||
            doctor.hospital
              .toLowerCase()
              .includes(query);


          const matchesSpecialty =
            selectedSpecialty ===
              'All' ||
            doctor.specialty ===
              selectedSpecialty;


          return (
            matchesSearch &&
            matchesSpecialty
          );
        }
      );

    }, [
      search,
      selectedSpecialty,
    ]);


  // ==================================================
  // DOCTOR CARD
  // ==================================================

  const renderRadiologist = ({
    item,
  }) => {

    return (
      <View
        style={styles.card}
      >

        {/* ICON */}

        <View
          style={styles.doctorIcon}
        >

          <Ionicons
            name="person-outline"
            size={32}
            color="#00838F"
          />

        </View>


        {/* INFORMATION */}

        <View
          style={styles.doctorInfo}
        >

          <Text
            style={styles.doctorName}
            numberOfLines={2}
          >
            {item.name}
          </Text>


          <Text
            style={styles.specialty}
          >
            {item.specialty}
          </Text>


          <Text
            style={styles.experience}
          >
            {item.experience}
          </Text>


          <Text
            style={styles.qualification}
          >
            {item.qualification}
          </Text>


          <View
            style={styles.hospitalRow}
          >

            <Ionicons
              name="business-outline"
              size={15}
              color="#78909C"
            />

            <Text
              style={styles.hospital}
              numberOfLines={1}
            >
              {item.hospital}
            </Text>

          </View>


          {/* RATING + FEE */}

          <View
            style={styles.metaRow}
          >

            <View
              style={styles.ratingRow}
            >

              <Ionicons
                name="star"
                size={15}
                color="#F9A825"
              />

              <Text
                style={styles.rating}
              >
                {item.rating}
              </Text>

            </View>


            <Text
              style={styles.fee}
            >
              ₹{item.fee}
            </Text>

          </View>


          {/* AVAILABLE SLOTS */}

          <View
            style={styles.availableBadge}
          >

            <Ionicons
              name="videocam-outline"
              size={14}
              color="#2E7D32"
            />

            <Text
              style={styles.availableText}
            >
              Online consultation available
            </Text>

          </View>


          {/* BOOK */}

          <TouchableOpacity
            style={styles.bookButton}
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate(
                'RadiologistBooking',
                {
                  radiologist: item,
                }
              )
            }
          >

            <Ionicons
              name="calendar-outline"
              size={17}
              color="#FFFFFF"
            />

            <Text
              style={styles.bookButtonText}
            >
              View Slots
            </Text>

          </TouchableOpacity>

        </View>

      </View>
    );
  };


  return (
    <SafeAreaView
      style={styles.container}
    >

      {/* HEADER */}

      <View
        style={styles.header}
      >

        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            navigation.goBack()
          }
        >

          <Ionicons
            name="arrow-back"
            size={25}
            color="#263238"
          />

        </TouchableOpacity>


        <Text
          style={styles.headerTitle}
        >
          Radiologists
        </Text>


        <View
          style={styles.headerSpace}
        />

      </View>


      <FlatList
        data={filteredRadiologists}
        keyExtractor={(item) =>
          item.id
        }
        renderItem={
          renderRadiologist
        }
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.listContent
        }

        ListHeaderComponent={

          <View>

            {/* INTRO */}

            <View
              style={styles.introCard}
            >

              <View
                style={styles.introIcon}
              >

                <Ionicons
                  name="scan-outline"
                  size={30}
                  color="#00838F"
                />

              </View>


              <View
                style={styles.introInfo}
              >

                <Text
                  style={styles.introTitle}
                >
                  Radiology Consultation
                </Text>

                <Text
                  style={styles.introText}
                >
                  Consult a radiologist for X-ray, CT, MRI and ultrasound reports.
                </Text>

              </View>

            </View>


            {/* SEARCH */}

            <View
              style={styles.searchContainer}
            >

              <Ionicons
                name="search-outline"
                size={20}
                color="#78909C"
              />


              <TextInput
                style={styles.searchInput}
                placeholder="Search radiologist or hospital"
                placeholderTextColor="#90A4AE"
                value={search}
                onChangeText={
                  setSearch
                }
              />


              {search.length > 0 && (

                <TouchableOpacity
                  onPress={() =>
                    setSearch('')
                  }
                >

                  <Ionicons
                    name="close-circle"
                    size={19}
                    color="#90A4AE"
                  />

                </TouchableOpacity>

              )}

            </View>


            {/* SPECIALTY */}

            <Text
              style={styles.filterTitle}
            >
              Specialty
            </Text>


            <FlatList
              horizontal
              data={specialties}
              keyExtractor={(item) =>
                item
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
                    selectedSpecialty ===
                      item &&
                      styles.activeFilter,
                  ]}
                  onPress={() =>
                    setSelectedSpecialty(
                      item
                    )
                  }
                >

                  <Text
                    style={[
                      styles.filterText,
                      selectedSpecialty ===
                        item &&
                        styles.activeFilterText,
                    ]}
                  >
                    {item}
                  </Text>

                </TouchableOpacity>

              )}
            />


            <View
              style={styles.resultHeader}
            >

              <Text
                style={styles.resultTitle}
              >
                Available Radiologists
              </Text>


              <Text
                style={styles.resultCount}
              >
                {filteredRadiologists.length}
              </Text>

            </View>

          </View>
        }


        ListEmptyComponent={

          <View
            style={
              styles.emptyContainer
            }
          >

            <Ionicons
              name="person-outline"
              size={50}
              color="#B0BEC5"
            />

            <Text
              style={
                styles.emptyTitle
              }
            >
              No radiologists found
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Try another name, hospital or specialty.
            </Text>

          </View>

        }
      />

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


    // HEADER

    header: {
      height: 70,
      paddingHorizontal: 18,
      backgroundColor:
        '#FFFFFF',
      flexDirection:
        'row',
      alignItems:
        'center',
      borderBottomWidth: 1,
      borderBottomColor:
        '#ECEFF1',
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
      marginLeft: 14,
      fontSize: 21,
      fontWeight: '800',
      color: '#263238',
    },

    headerSpace: {
      width: 42,
    },


    // LIST

    listContent: {
      padding: 18,
      paddingBottom: 35,
    },


    // INTRO

    introCard: {
      backgroundColor:
        '#E0F7FA',
      borderRadius: 18,
      padding: 17,
      flexDirection:
        'row',
      alignItems:
        'center',
      marginBottom: 18,
    },

    introIcon: {
      width: 56,
      height: 56,
      borderRadius: 16,
      backgroundColor:
        '#FFFFFF',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    introInfo: {
      flex: 1,
      marginLeft: 13,
    },

    introTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: '#263238',
    },

    introText: {
      marginTop: 5,
      fontSize: 11,
      lineHeight: 17,
      color: '#607D8B',
    },


    // SEARCH

    searchContainer: {
      height: 52,
      borderRadius: 15,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#DDE4EA',
      paddingHorizontal: 14,
      flexDirection:
        'row',
      alignItems:
        'center',
      marginBottom: 16,
    },

    searchInput: {
      flex: 1,
      marginLeft: 9,
      fontSize: 13,
      color: '#263238',
    },


    // FILTER

    filterTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: '#263238',
      marginBottom: 9,
    },

    filterButton: {
      height: 38,
      paddingHorizontal: 13,
      borderRadius: 11,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#DDE4EA',
      justifyContent:
        'center',
      alignItems:
        'center',
      marginRight: 8,
    },

    activeFilter: {
      backgroundColor:
        '#00838F',
      borderColor:
        '#00838F',
    },

    filterText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#00838F',
    },

    activeFilterText: {
      color: '#FFFFFF',
    },


    // RESULT

    resultHeader: {
      marginTop: 20,
      marginBottom: 11,
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    resultTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: '#263238',
    },

    resultCount: {
      marginLeft: 8,
      paddingHorizontal: 7,
      paddingVertical: 3,
      backgroundColor:
        '#ECEFF1',
      borderRadius: 8,
      color: '#78909C',
      fontSize: 11,
      fontWeight: '700',
    },


    // CARD

    card: {
      backgroundColor:
        '#FFFFFF',
      borderRadius: 18,
      padding: 16,
      marginBottom: 14,
      flexDirection:
        'row',
      borderWidth: 1,
      borderColor:
        '#ECEFF1',
    },

    doctorIcon: {
      width: 62,
      height: 62,
      borderRadius: 17,
      backgroundColor:
        '#E0F7FA',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    doctorInfo: {
      flex: 1,
      marginLeft: 13,
    },

    doctorName: {
      fontSize: 16,
      fontWeight: '800',
      color: '#263238',
    },

    specialty: {
      marginTop: 4,
      fontSize: 12,
      fontWeight: '700',
      color: '#00838F',
    },

    experience: {
      marginTop: 3,
      fontSize: 11,
      color: '#78909C',
    },

    qualification: {
      marginTop: 3,
      fontSize: 10,
      color: '#607D8B',
    },

    hospitalRow: {
      marginTop: 6,
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    hospital: {
      flex: 1,
      marginLeft: 5,
      fontSize: 10,
      color: '#607D8B',
    },

    metaRow: {
      marginTop: 8,
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    ratingRow: {
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    rating: {
      marginLeft: 5,
      color: '#F57F17',
      fontSize: 12,
      fontWeight: '800',
    },

    fee: {
      marginLeft: 15,
      color: '#2E7D32',
      fontSize: 13,
      fontWeight: '900',
    },

    availableBadge: {
      alignSelf: 'flex-start',
      marginTop: 8,
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor:
        '#E8F5E9',
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    availableText: {
      marginLeft: 4,
      fontSize: 9,
      fontWeight: '700',
      color: '#2E7D32',
    },

    bookButton: {
      alignSelf: 'flex-start',
      marginTop: 10,
      backgroundColor:
        '#00838F',
      borderRadius: 10,
      paddingHorizontal: 13,
      paddingVertical: 9,
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    bookButtonText: {
      marginLeft: 5,
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '800',
    },


    // EMPTY

    emptyContainer: {
      alignItems:
        'center',
      paddingTop: 70,
      paddingHorizontal: 30,
    },

    emptyTitle: {
      marginTop: 15,
      fontSize: 18,
      fontWeight: '800',
      color: '#263238',
    },

    emptyText: {
      marginTop: 7,
      textAlign: 'center',
      fontSize: 12,
      lineHeight: 18,
      color: '#78909C',
    },

  });


export default RadiologistListScreen;