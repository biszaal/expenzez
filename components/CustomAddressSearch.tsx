import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from './ui';
import { useTheme } from '../contexts/ThemeContext';
import { spacing } from '../constants/theme';
import { GOOGLE_MAPS_CONFIG } from '../config/googleMaps';

interface AddressSuggestion {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
}

interface CustomAddressSearchProps {
  onAddressSelect: (placeId: string, description: string) => void;
  onError: (error: string) => void;
  style?: any;
}

export default function CustomAddressSearch({ 
  onAddressSelect, 
  onError,
  style 
}: CustomAddressSearchProps) {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Test function to check API key and UK addresses specifically
  const testAPIKey = async () => {
    try {
      console.log('Testing API key with various UK addresses...');
      
      const testAddresses = [
        'London',
        '10 Downing Street, London',
        'Manchester',
        'Birmingham',
        'SW1A 1AA', // UK postcode
      ];
      
      for (const address of testAddresses) {
        const testUrl = `${GOOGLE_MAPS_CONFIG.PLACES_AUTOCOMPLETE_URL}?input=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_CONFIG.API_KEY}&types=address&components=country:gb&language=en`;
        console.log(`Testing address: ${address}`);
        console.log(`Test URL: ${testUrl}`);
        
        const response = await fetch(testUrl);
        const data = await response.json();
        console.log(`Result for "${address}":`, data);
        
        if (data.status === 'OK' && data.predictions) {
          console.log(`✓ Found ${data.predictions.length} results for "${address}"`);
        } else {
          console.log(`✗ No results for "${address}", status: ${data.status}`);
        }
      }
      
      return true;
    } catch (error) {
      console.error('API Key test failed:', error);
      return null;
    }
  };

  const searchAddresses = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      setLoading(true);
      
      // Try multiple search strategies for better coverage (fixed types parameter)
      const searchStrategies = [
        {
          name: 'UK-specific address only',
          url: `${GOOGLE_MAPS_CONFIG.PLACES_AUTOCOMPLETE_URL}?input=${encodeURIComponent(searchQuery)}&key=${GOOGLE_MAPS_CONFIG.API_KEY}&types=address&language=en&components=country:gb&region=gb`
        },
        {
          name: 'UK geocode type',
          url: `${GOOGLE_MAPS_CONFIG.PLACES_AUTOCOMPLETE_URL}?input=${encodeURIComponent(searchQuery)}&key=${GOOGLE_MAPS_CONFIG.API_KEY}&types=geocode&language=en&components=country:gb`
        },
        {
          name: 'UK establishment type',
          url: `${GOOGLE_MAPS_CONFIG.PLACES_AUTOCOMPLETE_URL}?input=${encodeURIComponent(searchQuery)}&key=${GOOGLE_MAPS_CONFIG.API_KEY}&types=establishment&language=en&components=country:gb&region=gb`
        },
        {
          name: 'Broader UK search',
          url: `${GOOGLE_MAPS_CONFIG.PLACES_AUTOCOMPLETE_URL}?input=${encodeURIComponent(searchQuery)}&key=${GOOGLE_MAPS_CONFIG.API_KEY}&language=en&components=country:gb`
        },
        {
          name: 'Global address search',
          url: `${GOOGLE_MAPS_CONFIG.PLACES_AUTOCOMPLETE_URL}?input=${encodeURIComponent(searchQuery)}&key=${GOOGLE_MAPS_CONFIG.API_KEY}&types=address&language=en`
        },
        {
          name: 'Global geocode search',
          url: `${GOOGLE_MAPS_CONFIG.PLACES_AUTOCOMPLETE_URL}?input=${encodeURIComponent(searchQuery)}&key=${GOOGLE_MAPS_CONFIG.API_KEY}&types=geocode&language=en`
        }
      ];
      
      let bestResults: any = null;
      
      for (const strategy of searchStrategies) {
        try {
          const response = await fetch(strategy.url);
          const data = await response.json();
          
          if (data.status === 'OK' && data.predictions && data.predictions.length > 0) {
            bestResults = data;
            break;
          } else if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            console.error(`Search strategy error:`, data.status, data.error_message);
          }
        } catch (strategyError) {
          console.error(`Search strategy network error:`, strategyError);
        }
      }
      
      const data = bestResults;
      if (!data) {
        setSuggestions([]);
        setShowSuggestions(false);
        onError('No addresses found. Please check your search term or try entering manually.');
        return;
      }
      
      if (data.status === 'OK' && data.predictions && data.predictions.length > 0) {
        const formattedSuggestions: AddressSuggestion[] = data.predictions.map((prediction: any) => ({
          place_id: prediction.place_id,
          description: prediction.description,
          main_text: prediction.structured_formatting?.main_text || prediction.description,
          secondary_text: prediction.structured_formatting?.secondary_text || '',
        }));
        
        setSuggestions(formattedSuggestions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        
        if (data.status === 'ZERO_RESULTS') {
          // No error message for zero results, just show empty state
        } else if (data.status === 'INVALID_REQUEST') {
          onError(`Invalid search request: ${data.error_message || 'Check API key'}`);
        } else if (data.status === 'OVER_QUERY_LIMIT') {
          onError('Search quota exceeded. Please try again later.');
        } else if (data.status === 'REQUEST_DENIED') {
          onError(`Search denied: ${data.error_message || 'Check API configuration'}`);
        } else {
          onError(`Search failed: ${data.error_message || data.status}`);
        }
      }
    } catch (error: any) {
      console.error('Address search network error:', error);
      setSuggestions([]);
      setShowSuggestions(false);
      onError('Network error: Unable to connect to address service');
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);
    
    // Debounce the search
    const timeoutId = setTimeout(() => {
      searchAddresses(text);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleSelectAddress = (suggestion: AddressSuggestion) => {
    setQuery(suggestion.main_text);
    setShowSuggestions(false);
    setSuggestions([]);
    onAddressSelect(suggestion.place_id, suggestion.description);
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <View style={[{ position: 'relative', zIndex: 1000 }, style]}>
      {/* Search Input */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.primary,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
      }}>
        <Ionicons 
          name="search" 
          size={20} 
          color={colors.text.secondary} 
          style={{ marginRight: spacing.sm }}
        />
        <TextInput
          value={query}
          onChangeText={handleQueryChange}
          placeholder="Search for your address..."
          placeholderTextColor={colors.text.tertiary}
          style={{
            flex: 1,
            fontSize: 16,
            color: colors.text.primary,
            minHeight: 20,
          }}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="words"
        />
        {loading && (
          <ActivityIndicator 
            size="small" 
            color={colors.primary[500]} 
            style={{ marginLeft: spacing.sm }}
          />
        )}
        {query.length > 0 && !loading && (
          <TouchableOpacity onPress={clearSearch} style={{ marginLeft: spacing.sm }}>
            <Ionicons name="close-circle" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Suggestions List */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: colors.background.primary,
          borderWidth: 1,
          borderColor: colors.border,
          borderTopWidth: 0,
          borderRadius: 8,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          maxHeight: 200,
          zIndex: 1001,
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }}>
          <ScrollView 
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={suggestion.place_id}
                onPress={() => handleSelectAddress(suggestion)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: spacing.md,
                  borderBottomWidth: index < suggestions.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <Ionicons 
                  name="location-outline" 
                  size={16} 
                  color={colors.text.secondary}
                  style={{ marginRight: spacing.md }}
                />
                <View style={{ flex: 1 }}>
                  <Typography 
                    variant="body" 
                    color="primary"
                    style={{ marginBottom: 2 }}
                    numberOfLines={1}
                  >
                    {suggestion.main_text}
                  </Typography>
                  {suggestion.secondary_text && (
                    <Typography 
                      variant="caption" 
                      color="secondary"
                      numberOfLines={1}
                    >
                      {suggestion.secondary_text}
                    </Typography>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* No Results Message */}
      {showSuggestions && suggestions.length === 0 && !loading && query.length >= 3 && (
        <View style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: colors.background.primary,
          borderWidth: 1,
          borderColor: colors.border,
          borderTopWidth: 0,
          borderRadius: 8,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          padding: spacing.md,
          alignItems: 'center',
        }}>
          <Typography variant="body" color="tertiary">
            No addresses found. Try a different search term.
          </Typography>
        </View>
      )}
    </View>
  );
}