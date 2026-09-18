import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

interface CardVisualProps {
  style?: object;
  height?: number;
}

/**
 * Top visual for Card 1 ("Deteksi Dini") using card1.svg
 */
export function Card1Visual({ height = 186 }: CardVisualProps) {
  return (
    <View style={[styles.container, { height, backgroundColor: '#ABE0F0' }]}>
      <Image
        source={require('@/assets/images/card1.svg')}
        style={styles.image}
        contentFit="cover"
        contentPosition="center"
      />
    </View>
  );
}

/**
 * Top visual for Card 2 ("Game Terapi") using card2.svg
 */
export function Card2Visual({ height = 186 }: CardVisualProps) {
  return (
    <View style={[styles.container, { height, backgroundColor: '#ABE0F0' }]}>
      <Image
        source={require('@/assets/images/card2.svg')}
        style={styles.image}
        contentFit="cover"
        contentPosition="top"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
