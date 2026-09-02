import React, { useMemo, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';


const searchData = [

  {
    id: 'doctor',
    title: 'Find a Doctor',
    description: 'Search doctors and specialists',
    keywords: 'doctor doctors cardiologist dermatologist physician specialist',
    icon: 'medkit-outline',
    backgroundColor: '#E8F5E9',
    iconColor: '#2E7D32',
    route: 'DoctorList',
  },

  {
    id: 'hospital',
    title: 'Hospital Care',
    description: 'Find nearby hospitals',
    keywords: 'hospital hospitals healthcare emergency medical center',
    icon: 'business-outline',
    backgroundColor: '#F3E5F5',
    iconColor: '#7B1FA2',
    route: 'HospitalList',
  },

  {
    id: 'video',
    title: 'Video Consultation',
    description: 'Consult a doctor online',
    keywords: 'video consultation online doctor video call appointment',
    icon: 'videocam-outline',
    backgroundColor: '#E3F2FD',
    iconColor: '#1565C0',
    route: 'VideoConsultation',
  },

  {
    id: 'lab',
    title: 'Lab Tests',
    description: 'Book blood and diagnostic tests',
    keywords: 'lab labs laboratory blood test tests cbc thyroid diagnostic',
    icon: 'flask-outline',
    backgroundColor: '#FFF3E0',
    iconColor: '#EF6C00',
    route: 'LabTests',
  },

  {
    id: 'pharmacy',
    title: 'Pharmacy',
    description: 'Upload prescriptions and manage medicines',
    keywords: 'pharmacy medicine medicines prescription tablet tablets',
    icon: 'medical-outline',
    backgroundColor: '#FCE4EC',
    iconColor: '#C2185B',
    route: 'Pharmacy',
  },

  {
    id: 'radiology',
    title: 'Radiology & Scans',
    description: 'Book 3T MRI, 128-Slice CT, 4D Ultrasound & Digital X-Ray',
    keywords: 'radiology scan scans xray x-ray mri ct ultrasound sonography mammography dexa doppler pet lab diagnostic radiologist',
    icon: 'radio-outline',
    backgroundColor: '#E0F7FA',
    iconColor: '#00838F',
    route: 'RadiologyLabs',
  },

  {
    id: 'records',
    title: 'Health Records',
    description: 'View your medical records',
    keywords: 'health records medical records reports documents history',
    icon: 'document-text-outline',
    backgroundColor: '#EDE7F6',
    iconColor: '#5E35B1',
    route: 'HealthRecords',
  },

  {
    id: 'appointments',
    title: 'Appointments',
    description: 'View and manage your appointments',
    keywords: 'appointment appointments booking bookings schedule',
    icon: 'calendar-outline',
    backgroundColor: '#FFF8E1',
    iconColor: '#F9A825',
    route: 'Bookings',
  },

  {
    id: 'emergency',
    title: 'Emergency',
    description: 'Emergency assistance',
    keywords: 'emergency ambulance urgent help accident 108',
    icon: 'alert-circle-outline',
    backgroundColor: '#FFEBEE',
    iconColor: '#D32F2F',
    route: 'Emergency',
  },

  {
    id: 'chatbot',
    title: 'Health Assistant',
    description: 'Ask health-related questions',
    keywords: 'chat chatbot ai assistant health question symptoms',
    icon: 'chatbubble-ellipses-outline',
    backgroundColor: '#E8F1FF',
    iconColor: '#1976D2',
    route: 'Chatbot',
  },

];


const GlobalSearchScreen = ({
  navigation,
}) => {

  const [query, setQuery] = useState('');


  const results = useMemo(() => {

    const text =
      query.trim().toLowerCase();

    if (!text) {
      return searchData;
    }

    return searchData.filter(
      (item) => {

        const searchableText =
          `${item.title} ${item.description} ${item.keywords}`
            .toLowerCase();

        return searchableText.includes(
          text
        );
      }
    );

  }, [query]);


  const openScreen = (route) => {

    navigation.navigate(route);

  };


  const renderItem = ({
    item,
  }) => {

    return (

      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() =>
          openScreen(item.route)
        }
      >

        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor:
                item.backgroundColor,
            },
          ]}
        >

          <Ionicons
            name={item.icon}
            size={25}
            color={item.iconColor}
          />

        </View>


        <View
          style={styles.info}
        >

          <Text
            style={styles.itemTitle}
          >
            {item.title}
          </Text>

          <Text
            style={styles.itemDescription}
          >
            {item.description}
          </Text>

        </View>


        <Ionicons
          name="chevron-forward-outline"
          size={20}
          color="#90A4AE"
        />

      </TouchableOpacity>

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
            size={24}
            color="#263238"
          />

        </TouchableOpacity>


        <Text
          style={styles.headerTitle}
        >
          Search
        </Text>

      </View>


      {/* SEARCH BAR */}

      <View
        style={styles.searchContainer}
      >

        <Ionicons
          name="search-outline"
          size={21}
          color="#78909C"
        />


        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search doctors, hospitals, tests..."
          placeholderTextColor="#90A4AE"
          autoFocus
          returnKeyType="search"
        />


        {query.length > 0 && (

          <TouchableOpacity
            onPress={() =>
              setQuery('')
            }
          >

            <Ionicons
              name="close-circle"
              size={20}
              color="#90A4AE"
            />

          </TouchableOpacity>

        )}

      </View>


      {/* RESULT TITLE */}

      <View
        style={styles.resultHeader}
      >

        <Text
          style={styles.resultTitle}
        >
          {query.trim()
            ? `${results.length} results`
            : 'All Services'}
        </Text>

      </View>


      {/* RESULTS */}

      <FlatList
        data={results}
        keyExtractor={(item) =>
          item.id
        }
        renderItem={renderItem}
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.list
        }

        ListEmptyComponent={

          <View
            style={styles.emptyContainer}
          >

            <Ionicons
              name="search-outline"
              size={50}
              color="#B0BEC5"
            />

            <Text
              style={styles.emptyTitle}
            >
              No results found
            </Text>

            <Text
              style={styles.emptyText}
            >
              Try searching for doctor,
              hospital, lab, pharmacy, imaging,
              appointment, or emergency.
            </Text>

          </View>

        }
      />

    </SafeAreaView>
  );
};


const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },

  header: {
    height: 70,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#ECEFF1',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitle: {
    marginLeft: 14,
    fontSize: 21,
    fontWeight: '800',
    color: '#263238',
  },

  searchContainer: {
    height: 54,
    marginHorizontal: 18,
    marginTop: 18,
    paddingHorizontal: 15,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE4EA',
    flexDirection: 'row',
    alignItems: 'center',
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#263238',
  },

  resultHeader: {
    paddingHorizontal: 18,
    marginTop: 20,
    marginBottom: 10,
  },

  resultTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#263238',
  },

  list: {
    paddingHorizontal: 18,
    paddingBottom: 30,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },

  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },

  info: {
    flex: 1,
    marginLeft: 13,
  },

  itemTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#263238',
  },

  itemDescription: {
    marginTop: 4,
    fontSize: 11,
    color: '#78909C',
    lineHeight: 16,
  },

  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 80,
  },

  emptyTitle: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: '800',
    color: '#263238',
  },

  emptyText: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    color: '#78909C',
  },

});

export default GlobalSearchScreen;