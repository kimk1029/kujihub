import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface LogoProps {
  size?: number;
}

export function KujiHubLogo({ size = 120 }: LogoProps) {
  const ratio = size / 120;

  return (
    <View style={[styles.container, { width: size, height: size * 1.1 }]}>
      {/* Ichiban Kuji Style Main Badge */}
      <View style={[styles.mainBadge, { padding: 4 * ratio }]}>
        <View style={styles.innerContent}>
          {/* Top Label: KUJI */}
          <View style={[styles.topLabel, { backgroundColor: '#00E5FF' }]}>
            <Text style={[styles.topText, { fontSize: 20 * ratio }]}>KUJI</Text>
          </View>
          
          {/* Middle: HUB with Accent */}
          <View style={styles.middleSection}>
            <Text style={[styles.hubText, { fontSize: 32 * ratio }]}>HUB</Text>
            <View style={[styles.accentLine, { width: 40 * ratio, height: 4 * ratio }]} />
          </View>

          {/* Bottom: Brand Statement */}
          <View style={styles.bottomSection}>
            <View style={[styles.kujiTag, { backgroundColor: '#000000' }]}>
              <Text style={[styles.kujiText, { fontSize: 12 * ratio }]}>INTELLIGENCE</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Signature Seal */}
      <View style={[styles.seal, { width: 48 * ratio, height: 48 * ratio, bottom: -12 * ratio, right: -12 * ratio }]}>
        <MaterialCommunityIcons name="star-four-points" size={14 * ratio} color="#000000" />
        <Text style={[styles.sealGrade, { fontSize: 24 * ratio }]}>H</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainBadge: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#00E5FF',
    borderRadius: 2,
    elevation: 10,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  innerContent: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#00E5FF',
    backgroundColor: '#00E5FF',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  topLabel: {
    width: '100%',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.3)',
    paddingBottom: 4,
  },
  topText: {
    color: '#FFFFFF',
    fontWeight: '950',
    letterSpacing: 6,
  },
  middleSection: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  hubText: {
    color: '#FFFFFF',
    fontWeight: '950',
    letterSpacing: 2,
    fontStyle: 'italic',
  },
  accentLine: {
    backgroundColor: '#F9D71C',
    marginTop: -2,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
  },
  kujiTag: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 0,
  },
  kujiText: {
    color: '#F9D71C',
    fontWeight: '900',
    letterSpacing: 1,
  },
  seal: {
    position: 'absolute',
    backgroundColor: '#F9D71C',
    borderWidth: 3,
    borderColor: '#000000',
    borderRadius: 0, // Boxy seal
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-10deg' }],
    zIndex: 10,
  },
  sealGrade: {
    color: '#000000',
    fontWeight: '950',
    marginTop: -4,
  },
});
