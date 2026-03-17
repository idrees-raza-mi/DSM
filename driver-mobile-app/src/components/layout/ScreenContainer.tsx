import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  children: ReactNode;
};

const ScreenContainer = ({ children }: Props) => {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.container}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
});

export default ScreenContainer;

