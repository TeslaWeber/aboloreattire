/**
 * Delivery fee calculation based on Jumia Nigeria's pricing structure
 * Origin: OKI, Ibadan, Oyo State
 * 
 * Pricing tiers based on distance zones from Ibadan:
 * - Zone 1: Within Ibadan (same city delivery)
 * - Zone 2: Neighboring states (Oyo surrounding areas, Osun, Ogun, Ekiti)
 * - Zone 3: South-West extended (Lagos, Ondo, Kwara)
 * - Zone 4: South-South & South-East (Edo, Delta, Rivers, Enugu, Anambra, etc.)
 * - Zone 5: North (Abuja FCT, Kano, Kaduna, etc.)
 * - Zone 6: Far North & East (Borno, Yobe, Cross River, Akwa Ibom, etc.)
 */

export interface DeliveryZone {
  zone: number;
  name: string;
  states: string[];
  smallFee: number;   // For items under 2kg
  mediumFee: number;  // For items 2-5kg
  largeFee: number;   // For items over 5kg
  deliveryDays: string;
}

export const NIGERIA_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", 
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", 
  "FCT Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", 
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", 
  "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", 
  "Yobe", "Zamfara"
];

// Cities within Ibadan for Zone 1 pricing
export const IBADAN_LOCALITIES = [
  "Ibadan North", "Ibadan North-East", "Ibadan North-West", 
  "Ibadan South-East", "Ibadan South-West", "Akinyele", "Egbeda", 
  "Ido", "Lagelu", "Oluyole", "Ona Ara", "OKI", "Challenge", "Ring Road",
  "Mokola", "Bodija", "UCH", "UI", "Dugbe", "Agodi", "Sango", "Ojoo",
  "Iwo Road", "Moniya", "Eleyele", "Apata", "Akobo"
];

export const deliveryZones: DeliveryZone[] = [
  {
    zone: 1,
    name: "Within Ibadan",
    states: ["Oyo - Ibadan"],
    smallFee: 1000,
    mediumFee: 1500,
    largeFee: 2500,
    deliveryDays: "Same day - 1 day"
  },
  {
    zone: 2,
    name: "Oyo State (Outside Ibadan)",
    states: ["Oyo"],
    smallFee: 1400,
    mediumFee: 2500,
    largeFee: 4000,
    deliveryDays: "1-2 days"
  },
  {
    zone: 3,
    name: "Neighboring States",
    states: ["Osun", "Ogun", "Ekiti"],
    smallFee: 1600,
    mediumFee: 3500,
    largeFee: 6000,
    deliveryDays: "1-2 days"
  },
  {
    zone: 4,
    name: "South-West Extended",
    states: ["Lagos", "Ondo", "Kwara", "Kogi"],
    smallFee: 1800,
    mediumFee: 4000,
    largeFee: 8000,
    deliveryDays: "2-3 days"
  },
  {
    zone: 5,
    name: "South-South",
    states: ["Edo", "Delta", "Rivers", "Bayelsa"],
    smallFee: 2000,
    mediumFee: 5500,
    largeFee: 15000,
    deliveryDays: "2-4 days"
  },
  {
    zone: 6,
    name: "South-East",
    states: ["Anambra", "Enugu", "Imo", "Abia", "Ebonyi"],
    smallFee: 2000,
    mediumFee: 6000,
    largeFee: 18000,
    deliveryDays: "3-4 days"
  },
  {
    zone: 7,
    name: "North-Central",
    states: ["FCT Abuja", "Niger", "Nasarawa", "Plateau", "Benue"],
    smallFee: 2200,
    mediumFee: 6500,
    largeFee: 22000,
    deliveryDays: "2-4 days"
  },
  {
    zone: 8,
    name: "North-West",
    states: ["Kaduna", "Kano", "Katsina", "Sokoto", "Kebbi", "Zamfara", "Jigawa"],
    smallFee: 2500,
    mediumFee: 7500,
    largeFee: 28000,
    deliveryDays: "3-5 days"
  },
  {
    zone: 9,
    name: "North-East",
    states: ["Bauchi", "Gombe", "Adamawa", "Taraba", "Borno", "Yobe"],
    smallFee: 2800,
    mediumFee: 8500,
    largeFee: 33000,
    deliveryDays: "4-6 days"
  },
  {
    zone: 10,
    name: "Far South",
    states: ["Cross River", "Akwa Ibom"],
    smallFee: 2500,
    mediumFee: 7000,
    largeFee: 25000,
    deliveryDays: "3-5 days"
  }
];

/**
 * Get the delivery zone for a given state
 */
export function getDeliveryZone(state: string, city?: string): DeliveryZone | null {
  // Normalize input
  const normalizedState = state.trim();
  const normalizedCity = city?.trim().toLowerCase() || "";
  
  // Check for Ibadan special case
  if (normalizedState === "Oyo" || normalizedState.toLowerCase().includes("oyo")) {
    // Check if city is within Ibadan
    const isIbadan = IBADAN_LOCALITIES.some(
      loc => normalizedCity.includes(loc.toLowerCase()) || 
             normalizedCity.includes("ibadan")
    );
    
    if (isIbadan) {
      return deliveryZones.find(z => z.zone === 1) || null;
    } else {
      return deliveryZones.find(z => z.zone === 2) || null;
    }
  }
  
  // Find the zone for other states
  for (const zone of deliveryZones) {
    if (zone.states.some(s => 
      s.toLowerCase() === normalizedState.toLowerCase() ||
      normalizedState.toLowerCase().includes(s.toLowerCase())
    )) {
      return zone;
    }
  }
  
  // Default to highest zone if state not found (rare edge cases)
  return deliveryZones[deliveryZones.length - 1];
}

/**
 * Calculate delivery fee based on state, city, and cart total
 * Using small package pricing for clothing items (typically under 2kg)
 */
export function calculateDeliveryFee(
  state: string, 
  city?: string,
  cartTotal?: number,
  itemCount?: number
): { fee: number; zone: DeliveryZone | null; estimatedDays: string } {
  const zone = getDeliveryZone(state, city);
  
  if (!zone) {
    return { 
      fee: 5000, 
      zone: null, 
      estimatedDays: "3-5 days" 
    };
  }
  
  // For clothing store, most items are small packages
  // Use small fee as base, scale slightly for multiple items
  let baseFee = zone.smallFee;
  
  // If more than 3 items, consider it medium-sized shipment
  if (itemCount && itemCount > 3) {
    baseFee = zone.mediumFee;
  }
  
  // If more than 6 items, consider it large shipment
  if (itemCount && itemCount > 6) {
    baseFee = zone.largeFee;
  }
  
  // Free delivery for orders above ₦100,000
  if (cartTotal && cartTotal >= 100000) {
    return {
      fee: 0,
      zone,
      estimatedDays: zone.deliveryDays
    };
  }
  
  return {
    fee: baseFee,
    zone,
    estimatedDays: zone.deliveryDays
  };
}

/**
 * Get all unique states for dropdown
 */
export function getAllStates(): string[] {
  return NIGERIA_STATES;
}

/**
 * Check if a city is within Ibadan
 */
export function isWithinIbadan(city: string): boolean {
  const normalizedCity = city.trim().toLowerCase();
  return IBADAN_LOCALITIES.some(loc => 
    normalizedCity.includes(loc.toLowerCase()) ||
    normalizedCity.includes("ibadan")
  );
}
