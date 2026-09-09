import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../theme/colors';

const ImagingScreenWeb = ({ navigation }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([
    {
      id: 'DOC-1',
      name: 'Chest_XRay_Digital_Scan.pdf',
      size: '2.4 MB',
      date: '02 Sep 2026',
      type: 'Radiology Scan',
    },
    {
      id: 'DOC-2',
      name: 'Dr_Sharma_Prescription.jpg',
      size: '1.1 MB',
      date: '28 Aug 2026',
      type: 'Doctor Prescription',
    },
  ]);

  const handleFileUpload = () => {
    // In web browsers, trigger standard file input
    if (typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,.pdf';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const newDoc = {
            id: 'DOC-' + Math.floor(1000 + Math.random() * 9000),
            name: file.name,
            size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
            date: 'Today',
            type: file.type.includes('pdf') ? 'Medical Report (PDF)' : 'Medical Image',
          };
          setUploadedFiles((prev) => [newDoc, ...prev]);
          alert(`Successfully uploaded "${file.name}" to your medical imaging records.`);
        }
      };
      input.click();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation && navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Medical Imaging & Document Vault</Text>
            <Text style={styles.headerSubtitle}>
              Upload and store diagnostic scans, prescriptions & health reports
            </Text>
          </View>
        </View>

        {/* Upload Box */}
        <TouchableOpacity
          style={styles.uploadBox}
          onPress={handleFileUpload}
          activeOpacity={0.8}
        >
          <View style={styles.uploadIconCircle}>
            <Ionicons name="cloud-upload-outline" size={32} color={colors.primary} />
          </View>
          <Text style={styles.uploadBoxTitle}>Click to Browse & Upload Documents</Text>
          <Text style={styles.uploadBoxSub}>
            Supports DICOM scans, MRI/CT images, Blood Reports & Prescriptions (PDF, JPG, PNG up to 25MB)
          </Text>
          <View style={styles.uploadButton}>
            <Ionicons name="document-attach" size={16} color="#FFFFFF" />
            <Text style={styles.uploadButtonText}>Select Medical File</Text>
          </View>
        </TouchableOpacity>

        {/* Imaging Services Fast Booking */}
        <View style={styles.radiologyServicesSection}>
          <Text style={styles.sectionTitle}>Book Diagnostic Scans at Accredited Centres</Text>
          <Text style={styles.sectionSub}>3T MRI, 128-Slice CT, 4D Ultrasound, Digital Mammography</Text>

          <View style={styles.scanGrid}>
            {[
              {
                title: '3T MRI Brain / Spine',
                sub: 'Silent scan • High resolution',
                price: '₹ 4,500',
                mrp: '₹ 6,000',
                icon: 'scan',
                color: '#0284C7',
              },
              {
                title: 'Whole Abdomen CT Scan',
                sub: 'Low radiation protocol',
                price: '₹ 3,200',
                mrp: '₹ 4,500',
                icon: 'radio',
                color: '#7C3AED',
              },
              {
                title: 'Whole Body Ultrasound',
                sub: 'Full organ screening',
                price: '₹ 1,200',
                mrp: '₹ 1,800',
                icon: 'pulse',
                color: colors.primary,
              },
            ].map((scan, idx) => (
              <View key={idx} style={styles.scanCard}>
                <View style={[styles.scanIconBox, { backgroundColor: scan.color + '15' }]}>
                  <Ionicons name={scan.icon} size={22} color={scan.color} />
                </View>
                <Text style={styles.scanTitle}>{scan.title}</Text>
                <Text style={styles.scanSub}>{scan.sub}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.scanPrice}>{scan.price}</Text>
                  <Text style={styles.scanMrp}>{scan.mrp}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.bookScanBtn, { backgroundColor: scan.color }]}
                  onPress={() => {
                    navigation && navigation.navigate('RadiologyLabs');
                  }}
                >
                  <Text style={styles.bookScanText}>Book Slot</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Uploaded Documents List */}
        <View style={styles.documentsSection}>
          <Text style={styles.sectionTitle}>Uploaded Medical Records ({uploadedFiles.length})</Text>
          {uploadedFiles.map((doc) => (
            <View key={doc.id} style={styles.docItem}>
              <View style={styles.docIconBox}>
                <Ionicons
                  name={doc.name.endsWith('.pdf') ? 'document-text' : 'image'}
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.docName}>{doc.name}</Text>
                <Text style={styles.docMeta}>
                  {doc.type} • {doc.size} • {doc.date}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.viewDocBtn}
                onPress={() => alert(`Opening "${doc.name}" in secure viewer.`)}
              >
                <Ionicons name="eye-outline" size={16} color={colors.primary} />
                <Text style={styles.viewDocText}>View</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F2F4',
  },
  content: {
    padding: 24,
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  uploadBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#CCFBF1',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginBottom: 28,
  },
  uploadIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.lightTeal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadBoxTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  uploadBoxSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 500,
    lineHeight: 18,
    marginBottom: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  radiologyServicesSection: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
  },
  scanGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  scanCard: {
    flex: 1,
    minWidth: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  scanIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  scanTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  scanSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 12,
  },
  scanPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  scanMrp: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  bookScanBtn: {
    height: 38,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookScanText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  documentsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  docIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  docMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  viewDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    backgroundColor: '#F0FDFA',
  },
  viewDocText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default ImagingScreenWeb;
