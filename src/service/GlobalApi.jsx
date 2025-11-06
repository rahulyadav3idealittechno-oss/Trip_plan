import axios from "axios";
import { chatSession } from "./AIModel";

const LOCATIONIQ_API_KEY = import.meta.env.VITE_LOCATIONIQ_API_KEY;
const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY;

export const GOOGLE_PLACES_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export const AMADEUS_API_KEY = import.meta.env.VITE_AMADEUS_API_KEY;
export const AMADEUS_SECRET_KEY = import.meta.env.VITE_AMADEUS_SECRET_KEY;

export const OPENTRIPMAP_API_KEY = import.meta.env.VITE_OPENTRIPMAP_API_KEY;

// === LocationIQ: Forward Geocoding (search place info based on text input) ===
export const getPlaceDetails = async (query) => {
  try {
    const url = `https://us1.locationiq.com/v1/search.php?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(query)}&format=json&limit=5`;
    const response = await axios.get(url);

    // Validate and filter results
    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      // Filter out results without valid coordinates
      const validResults = response.data.filter(item =>
        item.lat && item.lon &&
        !isNaN(parseFloat(item.lat)) && !isNaN(parseFloat(item.lon)) &&
        parseFloat(item.lat) >= -90 && parseFloat(item.lat) <= 90 &&
        parseFloat(item.lon) >= -180 && parseFloat(item.lon) <= 180
      );

      if (validResults.length > 0) {
        // Return the most relevant result (usually the first one)
        return { data: [validResults[0]] };
      }
    }

    throw new Error('No valid location data found');
  } catch (error) {
    console.error('LocationIQ API error:', error);
    throw error;
  }
};

// === LocationIQ: Reverse Geocoding (optional, if needed) ===
export const getPlaceByCoords = async (lat, lon) => {
  const url = `https://us1.locationiq.com/v1/reverse.php?key=${LOCATIONIQ_API_KEY}&lat=${lat}&lon=${lon}&format=json`;
  return axios.get(url);
};

// === LocationIQ: Static Map Image URL ===
export const getPlaceMapImageUrl = (lat, lon) => {
  return `https://us1.locationiq.com/v1/staticmap.php?key=${LOCATIONIQ_API_KEY}&center=${lat},${lon}&zoom=15&size=400x300&format=png`;
};

// === Pexels: Fetch images based on location or place name ===
export const getPlacePhotoFromPexels = async (query) => {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`;
  return axios.get(url, {
    headers: {
      Authorization: PEXELS_API_KEY,
    },
  });
};



// === Amadeus: Get Access Token ===
export const getAmadeusAccessToken = async () => {
  const response = await axios.post('https://test.api.amadeus.com/v1/security/oauth2/token', new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: AMADEUS_API_KEY,
    client_secret: AMADEUS_SECRET_KEY,
  }), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  return response.data.access_token;
};

// === Amadeus: Nearby Hotels Search ===
export const getNearbyHotels = async (lat, lng) => {
  const token = await getAmadeusAccessToken();
  const response = await axios.get(`https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-geocode?latitude=${lat}&longitude=${lng}&radius=5&radiusUnit=KM&hotelSource=ALL`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// === Amadeus: Hotel Offers (for pricing and booking) ===
export const getHotelOffers = async (hotelId, checkInDate = null, checkOutDate = null, adults = 1) => {
  try {
    console.log('Fetching offers for hotelId:', hotelId);

    // Validate hotelId
    if (!hotelId || hotelId === 'N/A') {
      throw new Error('Invalid hotel ID');
    }

    const token = await getAmadeusAccessToken();

    // Set default dates if not provided (tomorrow to day after tomorrow)
    if (!checkInDate || !checkOutDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);

      checkInDate = tomorrow.toISOString().split('T')[0];
      checkOutDate = dayAfter.toISOString().split('T')[0];
    }

    const url = `https://test.api.amadeus.com/v3/shopping/hotel-offers?hotelIds=${hotelId}&adults=${adults}&checkInDate=${checkInDate}&checkOutDate=${checkOutDate}`;

    console.log('Hotel offers URL:', url);
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching hotel offers for hotelId:', hotelId, error);
    throw error; // Re-throw to handle in calling function
  }
};

// === Google Places: Nearby Restaurants Search ===
export const getNearbyRestaurants = async (lat, lng) => {
  // Use a working CORS proxy
  const corsProxy = 'https://api.allorigins.win/get?url=';
  const encodedUrl = encodeURIComponent(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=restaurant&key=${GOOGLE_PLACES_API_KEY}`);
  const url = corsProxy + encodedUrl;

  const response = await axios.get(url);
  // allorigins.win wraps the response in a 'contents' field
  if (response.data && response.data.contents) {
    return { data: JSON.parse(response.data.contents) };
  }
  return response;
};

// === Google Places: Nearby Places/Attractions Search ===
export const getNearbyPlaces = async (lat, lng) => {
  // Use a working CORS proxy
  const corsProxy = 'https://api.allorigins.win/get?url=';
  const encodedUrl = encodeURIComponent(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=tourist_attraction&key=${GOOGLE_PLACES_API_KEY}`);
  const url = corsProxy + encodedUrl;

  const response = await axios.get(url);
  // allorigins.win wraps the response in a 'contents' field
  if (response.data && response.data.contents) {
    return { data: JSON.parse(response.data.contents) };
  }
  return response;
};

// === OpenTripMap: Get places by coordinates ===
export const getOpenTripMapPlaces = async (lat, lng) => {
  const url = `https://api.opentripmap.com/0.1/en/places/radius?radius=5000&lon=${lng}&lat=${lat}&rate=3&format=json&apikey=${OPENTRIPMAP_API_KEY}`;
  return axios.get(url);
};

// === OpenTripMap: Get place details ===
export const getOpenTripMapPlaceDetails = async (xid) => {
  const url = `https://api.opentripmap.com/0.1/en/places/xid/${xid}?apikey=${OPENTRIPMAP_API_KEY}`;
  return axios.get(url);
};

// === AI-Generated: Nearby Guides (using AIModel) ===
export const getNearbyGuides = async (lat, lng, locationName) => {
  // Use AIModel to generate guide recommendations based on location
  const prompt = `Generate 4-5 guide recommendations for location: ${locationName} at coordinates ${lat}, ${lng}. Each guide should include guideName, guideDescription, guideContact, guideRating, guidePrice. Return only valid JSON format with a "guides" array, no markdown or code blocks.`;

  try {
    const result = await chatSession.sendMessage(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up the response to remove markdown code blocks if present
    text = text.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();

    const jsonResponse = JSON.parse(text);
    return jsonResponse;
  } catch (error) {
    console.error("Error generating guides:", error);
    // Fallback to placeholder
    return {
      guides: [
        {
          guideName: "Local Expert Guide",
          guideDescription: "Experienced local guide for personalized tours",
          guideContact: "Contact via app",
          guideRating: "4.5",
          guidePrice: "$50/hour",
        },
      ],
    };
  }
};
