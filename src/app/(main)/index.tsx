import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
} from 'react-native';
import MascotSvg from '@/components/MascotSvg';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1">
        {/* Decorative top bar */}
        <View className="h-1.5 bg-accent overflow-hidden">
          <View className="h-full w-[60%] bg-primary rounded-r-sm" />
        </View>

        <View className="flex-1 justify-center items-center px-8">
          <MascotSvg width={200} height={120} />
          <Text className="font-chelsea text-[28px] text-txt mt-6">
            Halo! 👋
          </Text>
          <Text className="font-chelsea text-base text-primary mt-2">
            Selamat datang di Denisa
          </Text>
          <Text className="font-chelsea text-[13px] text-txt-light text-center mt-4 leading-[22px]">
            Halaman ini masih dalam pengembangan.{'\n'}
            Nantikan fitur-fitur menarik dari Denisa!
          </Text>
        </View>

        {/* Decorative dots */}
        <View className="flex-row justify-center gap-2.5 pb-10">
          <View className="w-2.5 h-2.5 rounded-full bg-primary" />
          <View className="w-2.5 h-2.5 rounded-full bg-secondary" />
          <View className="w-2.5 h-2.5 rounded-full bg-info" />
        </View>
      </View>
    </SafeAreaView>
  );
}
