import {
  ILeadSourceProvider,
  DiscoverySearchInput,
  DiscoveredBusinessRecord,
} from './types';
import { ProviderStatus, ProviderExecutionResult } from '@/lib/providers/provider-result';
import { globalRateLimiter } from '../rate-limiter';

interface GooglePlaceAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GooglePlaceDetailsResult {
  name?: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  address_components?: GooglePlaceAddressComponent[];
  types?: string[];
  business_status?: string;
  url?: string;
  geometry?: {
    location?: {
      lat: number;
      lng: number;
    };
  };
}

export class GooglePlacesProvider implements ILeadSourceProvider {
  id = 'google-places';
  name = 'Google Places API';
  sourceQuality = 'AUTHORIZED_API' as const;
  requestsPerMinute = 60;

  isConfigured(): boolean {
    return Boolean(process.env.GOOGLE_PLACES_API_KEY && process.env.GOOGLE_PLACES_API_KEY.trim().length > 0);
  }

  getStatus(): ProviderStatus {
    const configured = this.isConfigured();
    if (!configured) {
      return {
        name: this.name,
        configured: false,
        isMock: false,
        details:
          'NOT CONFIGURED. To search real business listings via Google Places, obtain an API key from Google Cloud Console (with Places API enabled) and set GOOGLE_PLACES_API_KEY in your .env or environment variables. GetVisible will never fabricate simulated results.',
      };
    }

    return {
      name: this.name,
      configured: true,
      isMock: false,
      details:
        'Connected to official Google Places API. Discovers business places, physical addresses, ratings, review counts, phone numbers, and official websites.',
    };
  }

  async searchBusinesses(
    input: DiscoverySearchInput
  ): Promise<ProviderExecutionResult<DiscoveredBusinessRecord[]>> {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
    if (!apiKey) {
      return {
        success: false,
        configured: false,
        isMock: false,
        error:
          'Google Places API key is missing. Please set GOOGLE_PLACES_API_KEY in your .env file to enable Google Places search.',
      };
    }

    const acquired = await globalRateLimiter.acquire(this.id, this.requestsPerMinute);
    if (!acquired) {
      return {
        success: false,
        configured: true,
        isMock: false,
        error: `Rate limit of ${this.requestsPerMinute} requests per minute reached for Google Places API. Please wait a few seconds and try again.`,
      };
    }

    const category = (input.category || input.profession || 'Business').trim();
    const location = (input.location || '').trim();
    const locality = (input.locality || '').trim();
    const targetLimit = Math.min(Math.max(1, input.limit || 10), 60);

    const queryParts = [category];
    if (locality) queryParts.push(locality);
    if (location) queryParts.push(location);
    const query = queryParts.join(' in ');

    try {
      let textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;

      if (input.radius && input.radius > 0) {
        // Radius in meters (capped at 50,000 per Google Places Text Search spec)
        const radiusMeters = Math.min(input.radius * 1000, 50000);
        textSearchUrl += `&radius=${radiusMeters}`;
      }

      const searchRes = await fetch(textSearchUrl, { signal: AbortSignal.timeout(10000) });
      if (!searchRes.ok) {
        return {
          success: false,
          configured: true,
          isMock: false,
          error: `Google Places API HTTP error: ${searchRes.status} ${searchRes.statusText}`,
        };
      }

      const searchData = await searchRes.json();

      if (searchData.status === 'REQUEST_DENIED') {
        return {
          success: false,
          configured: true,
          isMock: false,
          error: `Google Places API request denied: ${searchData.error_message || 'Check your GOOGLE_PLACES_API_KEY permissions and billing status.'}`,
        };
      }

      if (searchData.status === 'OVER_QUERY_LIMIT') {
        return {
          success: false,
          configured: true,
          isMock: false,
          error: 'Google Places API quota exceeded (OVER_QUERY_LIMIT). Please check your Google Cloud quota.',
        };
      }

      if (searchData.status === 'ZERO_RESULTS' || !Array.isArray(searchData.results) || searchData.results.length === 0) {
        return {
          success: true,
          configured: true,
          isMock: false,
          data: [],
        };
      }

      const placeItems = searchData.results.slice(0, targetLimit);
      const records: DiscoveredBusinessRecord[] = [];

      for (const place of placeItems) {
        const placeId = place.place_id;
        let details: GooglePlaceDetailsResult = {};

        // Fetch Place Details for phone, website, address components
        if (placeId) {
          try {
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,international_phone_number,website,rating,user_ratings_total,address_components,types,business_status,url,geometry&key=${apiKey}`;
            const detRes = await fetch(detailsUrl, { signal: AbortSignal.timeout(6000) });
            if (detRes.ok) {
              const detData = await detRes.json();
              if (detData.status === 'OK' && detData.result) {
                details = detData.result;
              }
            }
          } catch {
            // Fall back to basic place object if details call times out
          }
        }

        const businessName = details.name || place.name || 'Unknown Business';
        const formattedAddress = details.formatted_address || place.formatted_address || `${location}, India`;

        // Extract locality, state, country, postal code from address_components
        let detectedCity = location;
        let detectedState: string | null = null;
        let detectedCountry: string | null = null;
        let detectedPostalCode: string | null = null;

        if (Array.isArray(details.address_components)) {
          for (const comp of details.address_components) {
            if (comp.types.includes('locality')) {
              detectedCity = comp.long_name;
            } else if (!detectedCity && comp.types.includes('administrative_area_level_2')) {
              detectedCity = comp.long_name;
            } else if (comp.types.includes('administrative_area_level_1')) {
              detectedState = comp.long_name;
            } else if (comp.types.includes('country')) {
              detectedCountry = comp.long_name;
            } else if (comp.types.includes('postal_code')) {
              detectedPostalCode = comp.long_name;
            }
          }
        }

        const phone = details.international_phone_number || details.formatted_phone_number || null;
        const website = details.website || null;
        const rating = typeof details.rating === 'number' ? details.rating : (typeof place.rating === 'number' ? place.rating : null);
        const reviewCount = typeof details.user_ratings_total === 'number' ? details.user_ratings_total : (typeof place.user_ratings_total === 'number' ? place.user_ratings_total : null);
        const lat = details.geometry?.location?.lat ?? place.geometry?.location?.lat ?? null;
        const lng = details.geometry?.location?.lng ?? place.geometry?.location?.lng ?? null;

        records.push({
          sourceRecordId: `gp-${placeId || Date.now().toString(36)}`,
          businessName,
          contactName: null, // Google Places does not return personal owner names
          profession: category,
          city: detectedCity,
          state: detectedState,
          country: detectedCountry,
          postalCode: detectedPostalCode,
          address: formattedAddress,
          website,
          publicEmail: null, // Google Places API does not provide email addresses per Google policy
          publicPhone: phone,
          rating,
          reviewCount,
          latitude: lat,
          longitude: lng,
          contactStatus: phone ? 'SOURCE_CONFIRMED' : 'UNAVAILABLE',
          phoneStatus: phone ? 'SOURCE_CONFIRMED' : 'UNAVAILABLE',
          emailStatus: 'UNAVAILABLE',
          source: 'Google Places API',
          sourceUrl: details.url || (placeId ? `https://www.google.com/maps/place/?q=place_id:${placeId}` : `https://maps.google.com/?q=${encodeURIComponent(businessName)}`),
          sourceQuality: 'AUTHORIZED_API',
          isDemoData: false,
          retrievedAt: new Date().toISOString(),
          metadata: {
            placeId,
            types: details.types || place.types,
            businessStatus: details.business_status || place.business_status,
          },
        });
      }

      return {
        success: true,
        configured: true,
        isMock: false,
        data: records,
      };
    } catch (err: unknown) {
      return {
        success: false,
        configured: true,
        isMock: false,
        error: err instanceof Error ? err.message : 'Google Places search failed',
      };
    }
  }

  async getBusinessDetails(
    sourceRecordId: string
  ): Promise<ProviderExecutionResult<DiscoveredBusinessRecord | null>> {
    return {
      success: true,
      configured: this.isConfigured(),
      isMock: false,
      data: null,
    };
  }

  async getPublicBusinessContact(
    sourceRecordId: string
  ): Promise<ProviderExecutionResult<{ email?: string; phone?: string } | null>> {
    return {
      success: true,
      configured: this.isConfigured(),
      isMock: false,
      data: null,
    };
  }

  async getOfficialWebsite(
    sourceRecordId: string
  ): Promise<ProviderExecutionResult<string | null>> {
    return {
      success: true,
      configured: this.isConfigured(),
      isMock: false,
      data: null,
    };
  }
}
