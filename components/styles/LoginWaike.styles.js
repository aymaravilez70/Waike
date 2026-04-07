import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '90%',
    maxWidth: 380,
    backgroundColor: '#161B22cc',
    borderRadius: 23,
    padding: 28,
    shadowColor: '#111',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    color: '#b3b3b3',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#222d34',
    color: '#fff',
    borderRadius: 12,
    padding: 13,
    marginVertical: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#232763',
  },
  button: {
    backgroundColor: '#2167c9',
    padding: 15,
    borderRadius: 12,
    marginTop: 18,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 0.5,
    fontSize: 18,
  },
  secondaryButton: {
    marginTop: 22,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#52a4ff',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
});
