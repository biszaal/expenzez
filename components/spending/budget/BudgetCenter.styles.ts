import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  donutCenter: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  donutCenterPercentage: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 2,
  },
  donutCenterLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  donutCenterAmount: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
  },
  donutCenterSubLabel: {
    fontSize: 10,
    fontWeight: '400',
    textAlign: 'center',
  },
});