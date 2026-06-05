import apiClient from './apiConfig';

export const getPointToPointPricing = async (fromLocation, toLocation) => {
  try {
    const response = await apiClient.post('/pricing/point-to-point', {
      from: fromLocation,
      to: toLocation
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('Point-to-point pricing response:', response.data);
    
    // Check if response has data and it's an array
    if (response.data && Array.isArray(response.data)) {
      return {
        success: true,
        data: response.data, // This will be the array of vehicles
        message: 'Pricing fetched successfully'
      };
    } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
      // If data is nested under 'data' key
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Pricing fetched successfully'
      };
    } else if (response.data && response.data.status === true) {
      // If status field exists and is true
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Pricing fetched successfully'
      };
    } else {
      return {
        success: false,
        message: response.data?.message || 'Failed to fetch pricing',
        errors: response.data?.errors || {}
      };
    }
  } catch (error) {
    console.error('Pricing error:', error);
    
    if (error.response) {
      console.log('Error response:', error.response.data);
      const { data } = error.response;
      return {
        success: false,
        message: data.message || data.error || 'Failed to fetch pricing',
        errors: data.errors || {}
      };
    } else if (error.request) {
      return {
        success: false,
        message: 'Network error. Please check your connection.',
        errors: {}
      };
    } else {
      return {
        success: false,
        message: 'An error occurred. Please try again.',
        errors: {}
      };
    }
  }
};

export const getHourlyPricing = async (fromLocation, duration) => {
  try {
    const response = await apiClient.post('/pricing/hourly', {
      from: fromLocation,
      duration: parseInt(duration) || 0
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('Hourly pricing response:', response.data);

    if (response.data && Array.isArray(response.data)) {
      return {
        success: true,
        data: response.data,
        message: 'Pricing fetched successfully'
      };
    } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Pricing fetched successfully'
      };
    } else if (response.data && response.data.status === true) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Pricing fetched successfully'
      };
    } else {
      return {
        success: false,
        message: response.data?.message || 'Failed to fetch pricing',
        errors: response.data?.errors || {}
      };
    }
  } catch (error) {
    console.error('Hourly pricing error:', error);
    return {
      success: false,
      message: 'Failed to fetch hourly pricing',
      errors: {}
    };
  }
};

export const getAirportPricing = async (airportDirection, location, airportName) => {
  try {
    const payload = airportDirection === 'FROM_AIRPORT' 
      ? { from_airport: airportName, to: location }
      : { from: location, to_airport: airportName };
    
    const response = await apiClient.post('/pricing/airport', payload, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('Airport pricing response:', response.data);

    if (response.data && Array.isArray(response.data)) {
      return {
        success: true,
        data: response.data,
        message: 'Pricing fetched successfully'
      };
    } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Pricing fetched successfully'
      };
    } else if (response.data && response.data.status === true) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Pricing fetched successfully'
      };
    } else {
      return {
        success: false,
        message: response.data?.message || 'Failed to fetch pricing',
        errors: response.data?.errors || {}
      };
    }
  } catch (error) {
    console.error('Airport pricing error:', error);
    return {
      success: false,
      message: 'Failed to fetch airport pricing',
      errors: {}
    };
  }
};