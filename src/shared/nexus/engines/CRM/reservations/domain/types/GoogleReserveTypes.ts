// Official structure from Google Reserve Webhooks (simplified for implementation)
export interface RwGUser {
  first_name: string;
  last_name: string;
  telephone: string;
  email: string;
}

export interface RwGSlot {
  merchant_id: string;
  service_id: string;
  start_time_sec: number; // Unix timestamp in seconds
  duration_sec: number;
}

export interface RwGBooking {
  booking_id: string;
  slot: RwGSlot;
  user_information: RwGUser;
  status: 'STATUS_UNSPECIFIED' | 'CONFIRMED' | 'CANCELED' | 'NO_SHOW' | 'DECLINED';
  party_size: number;
}

// Request payload for CreateBooking
export interface RwGCreateBookingRequest {
  booking: RwGBooking;
}
