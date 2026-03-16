import React, { useRef, useState } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { KujiDrawStackParamList } from '../../navigation/types';
import { KujiPeelReveal } from './KujiPeelReveal';
import { api } from '../../shared/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function KujiDrawResultScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<KujiDrawStackParamList>>();
  const route = useRoute<RouteProp<KujiDrawStackParamList, 'KujiResult'>>();
  const { kujiId, quantity, results, selectedSlots } = route.params;

  const [revealedCount, setRevealedCount] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  const handleTicketRevealed = () => {
    setRevealedCount(prev => {
      const next = prev + 1;
      if (next === quantity) {
        setTimeout(() => setShowSummary(true), 1000);
      }
      return next;
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>REVEAL YOUR LUCK</Text>
        <Text style={styles.headerSubtitle}>
          {revealedCount} / {quantity} 개 확인됨
        </Text>
      </View>

      {!showSummary ? (
        <ScrollView 
          contentContainerStyle={styles.peelList}
          showsVerticalScrollIndicator={false}
        >
          {results.map((res, idx) => (
            <KujiPeelReveal
              key={`${res.slotNumber}-${idx}`}
              grade={res.grade}
              name={res.name}
              color={res.color}
              slotNumber={res.slotNumber}
              onRevealed={handleTicketRevealed}
            />
          ))}
          <View style={{ height: 100 }} />
        </ScrollView>
      ) : (
        <View style={styles.summaryContainer}>
          <Surface style={styles.summaryCard} elevation={2}>
            <Text style={styles.summaryTitle}>최종 결과</Text>
            <View style={styles.divider} />
            <ScrollView style={styles.summaryList}>
              {results.map((res, idx) => (
                <View key={idx} style={styles.summaryItem}>
                  <View style={[styles.gradeSmall, { backgroundColor: res.color }]}>
                    <Text style={styles.gradeSmallText}>{res.grade}</Text>
                  </View>
                  <Text style={styles.summaryName} numberOfLines={1}>{res.name}</Text>
                </View>
              ))}
            </ScrollView>
          </Surface>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.doneBtn, { backgroundColor: theme.colors.primary }]}
            onPress={async () => {
              try { await api.post(`/api/kujis/${kujiId}/complete`, { slots: selectedSlots }); } catch {}
              navigation.popToTop();
            }}
          >
            <Text style={styles.doneBtnText}>확인 완료</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -1,
  },
  headerSubtitle: {
    color: '#F9D71C',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  peelList: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  summaryContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  summaryCard: {
    backgroundColor: '#0F0F0F',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  summaryTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#222222',
    marginBottom: 20,
  },
  summaryList: {
    flexGrow: 0,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  gradeSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeSmallText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 14,
  },
  summaryName: {
    color: '#E0E0E0',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  doneBtn: {
    marginTop: 32,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  doneBtnText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '900',
  },
});
