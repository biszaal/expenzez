// Google Maps API Configuration
export const GOOGLE_MAPS_CONFIG = {
  API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'DEVELOPMENT_PLACEHOLDER_KEY',
  
  // Google Places API endpoints
  PLACES_AUTOCOMPLETE_URL: 'https://maps.googleapis.com/maps/api/place/autocomplete/json',
  PLACE_DETAILS_URL: 'https://maps.googleapis.com/maps/api/place/details/json',
  GEOCODING_URL: 'https://maps.googleapis.com/maps/api/geocode/json',
  
  // Default configuration for autocomplete
  DEFAULT_AUTOCOMPLETE_OPTIONS: {
    types: ['address'],
    language: 'en',
    components: 'country:gb|country:us|country:ca|country:au', // Common countries
  },

  // UK-specific search configuration
  UK_AUTOCOMPLETE_OPTIONS: {
    types: ['address'],
    language: 'en',
    components: 'country:gb',
    region: 'gb',
  },
};

// Helper function to get place details from Google Places API
export const getPlaceDetails = async (placeId: string) => {
  try {
    // Security check: ensure API key is configured
    if (!GOOGLE_MAPS_CONFIG.API_KEY || GOOGLE_MAPS_CONFIG.API_KEY === 'DEVELOPMENT_PLACEHOLDER_KEY') {
      throw new Error('Google Maps API key not configured. Please set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY environment variable.');
    }

    const response = await fetch(
      `${GOOGLE_MAPS_CONFIG.PLACE_DETAILS_URL}?place_id=${placeId}&key=${GOOGLE_MAPS_CONFIG.API_KEY}&fields=address_components,formatted_address,geometry`
    );

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Check for API key errors
    if (data.status === 'REQUEST_DENIED') {
      throw new Error('Google Maps API key is invalid or access is denied');
    }

    return data;
  } catch (error) {
    console.error('Error fetching place details:', error);
    throw error;
  }
};

// Helper function to parse Google Places address components
export const parseAddressComponents = (addressComponents: any[]) => {
  const result = {
    streetNumber: '',
    route: '',
    locality: '', // City
    administrativeAreaLevel1: '', // State/Province
    administrativeAreaLevel2: '', // County
    country: '',
    countryCode: '',
    postalCode: '',
    premise: '', // Building/house name
    subpremise: '', // Apartment/unit number
  };

  // Safety check for addressComponents
  if (!addressComponents || !Array.isArray(addressComponents)) {
    console.warn('Invalid address components provided to parseAddressComponents');
    return result;
  }

  try {
    addressComponents.forEach((component) => {
      // Safety checks for component structure
      if (!component || !component.types || !Array.isArray(component.types)) {
        console.warn('Invalid component structure:', component);
        return;
      }

      const types = component.types;
      const longName = component.long_name || '';
      const shortName = component.short_name || '';
      
      if (types.includes('street_number')) {
        result.streetNumber = longName;
      }
      if (types.includes('route')) {
        result.route = longName;
      }
      if (types.includes('premise')) {
        result.premise = longName;
      }
      if (types.includes('subpremise')) {
        result.subpremise = longName;
      }
      if (types.includes('locality')) {
        result.locality = longName;
      }
      if (types.includes('administrative_area_level_1')) {
        result.administrativeAreaLevel1 = longName;
      }
      if (types.includes('administrative_area_level_2')) {
        result.administrativeAreaLevel2 = longName;
      }
      if (types.includes('country')) {
        result.country = longName;
        result.countryCode = shortName;
      }
      if (types.includes('postal_code')) {
        result.postalCode = longName;
      }
    });
  } catch (error) {
    console.error('Error parsing address components:', error);
  }
  return result;
};

// Map country codes to our country picker values
export const mapCountryCodeToPickerValue = (countryCode: string): string => {
  const mapping: { [key: string]: string } = {
    'GB': 'GB',
    'US': 'US', 
    'CA': 'CA',
    'AU': 'AU',
    'DE': 'DE',
    'FR': 'FR',
    'ES': 'ES',
    'IT': 'IT',
    'NL': 'NL',
  };
  
  return mapping[countryCode] || 'OTHER';
};