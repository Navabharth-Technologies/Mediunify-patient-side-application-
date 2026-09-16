import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ProgressTracker = ({
  currentStep = 1,
  totalSteps = 5,
  stepLabels = [],
  activeColor = '#E11D48',
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1;
          const isDone = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <React.Fragment key={index}>
              <View style={styles.stepNodeWrap}>
                <View
                  style={[
                    styles.stepCircle,
                    isDone && { backgroundColor: activeColor, borderColor: activeColor },
                    isCurrent && { backgroundColor: '#FFFFFF', borderColor: activeColor, borderWidth: 3 },
                  ]}
                >
                  <Text
                    style={[
                      styles.stepNumberText,
                      isDone && { color: '#FFFFFF' },
                      isCurrent && { color: activeColor, fontWeight: '900' },
                    ]}
                  >
                    {isDone ? '✓' : stepNumber}
                  </Text>
                </View>
                {stepLabels[index] && (
                  <Text
                    style={[
                      styles.stepLabel,
                      (isDone || isCurrent) && styles.stepLabelActive,
                      isCurrent && { color: activeColor },
                    ]}
                    numberOfLines={1}
                  >
                    {stepLabels[index]}
                  </Text>
                )}
              </View>
              {index < totalSteps - 1 && (
                <View
                  style={[
                    styles.connectorLine,
                    stepNumber < currentStep && { backgroundColor: activeColor },
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepNodeWrap: {
    alignItems: 'center',
    width: 60,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  stepLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '600',
  },
  stepLabelActive: {
    color: '#1E293B',
    fontWeight: '700',
  },
  connectorLine: {
    flex: 1,
    height: 2.5,
    backgroundColor: '#E2E8F0',
    marginHorizontal: -4,
    marginBottom: 20,
  },
});

export default ProgressTracker;
