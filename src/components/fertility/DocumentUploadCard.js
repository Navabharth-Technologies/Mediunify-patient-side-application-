import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DocumentUploadCard = ({
  title = 'Upload Document',
  subtitle = 'PDF, JPG, PNG up to 10MB',
  document = null,
  onPick,
  onRemove,
  required = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.title}>{title}</Text>
        {required && <Text style={styles.requiredStar}>*</Text>}
      </View>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {document ? (
        <View style={styles.filePreviewBox}>
          <View style={styles.fileIconWrap}>
            <Ionicons name="document-text" size={24} color="#E11D48" />
          </View>
          <View style={styles.fileInfo}>
            <Text style={styles.fileName} numberOfLines={1}>
              {document.name || 'Medical_Record.pdf'}
            </Text>
            <Text style={styles.fileSize}>
              {document.size || '1.8 MB'} • Uploaded
            </Text>
          </View>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={onRemove}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.uploadBox}
          onPress={onPick}
          activeOpacity={0.8}
        >
          <View style={styles.uploadIconCircle}>
            <Ionicons name="cloud-upload-outline" size={20} color="#E11D48" />
          </View>
          <Text style={styles.uploadPrompt}>Tap to select or take photo</Text>
          <Text style={styles.uploadSub}>Confidential HIPAA vault storage</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  requiredStar: {
    fontSize: 14,
    color: '#E11D48',
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 10,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  uploadIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  uploadPrompt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  uploadSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  filePreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECDD3',
    gap: 10,
  },
  fileIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  fileSize: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  deleteBtn: {
    padding: 4,
  },
});

export default DocumentUploadCard;
