import { StyleSheet } from 'react-native';

// v1.5 redesign — flat circular center, no shadow, mono numerals (set inline).
export const styles = StyleSheet.create({
  donutCenter: {
    position: 'absolute',
    width: 144,
    height: 144,
    borderRadius: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutCenterPercentage: {
    fontSize: 38,
    marginBottom: 0,
    letterSpacing: -1.4,
  },
  donutCenterLabel: {
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 1.4,
  },
  donutCenterAmount: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
  },
  donutCenterSubLabel: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
});