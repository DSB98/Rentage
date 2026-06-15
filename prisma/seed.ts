import { PrismaClient, UserRole, ListingStatus, RentPeriod } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────
// HELPER: Random pick
// ─────────────────────────────────────────────────────
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const pickN = <T>(arr: T[], n: number): T[] => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
};
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// ─────────────────────────────────────────────────────
// CITIES DATA
// ─────────────────────────────────────────────────────
const CITIES = [
  { city: 'Mumbai', state: 'Maharashtra', lat: 19.076, lng: 72.8777 },
  { city: 'Delhi', state: 'Delhi', lat: 28.7041, lng: 77.1025 },
  { city: 'Bangalore', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { city: 'Hyderabad', state: 'Telangana', lat: 17.385, lng: 78.4867 },
  { city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { city: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  { city: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  { city: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
  { city: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  { city: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
  { city: 'Chandigarh', state: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
  { city: 'Noida', state: 'Uttar Pradesh', lat: 28.5355, lng: 77.391 },
  { city: 'Gurgaon', state: 'Haryana', lat: 28.4595, lng: 77.0266 },
  { city: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577 },
  { city: 'Kochi', state: 'Kerala', lat: 9.9312, lng: 76.2673 },
];

const ADDRESSES = [
  'Sector 14, Block A', 'MG Road, Near Metro Station', 'Whitefield Main Road',
  'Koramangala 4th Block', 'Banjara Hills, Road No. 12', 'Andheri West, SV Road',
  'HSR Layout, 27th Main', 'Indiranagar, 100 Feet Road', 'Marathahalli Bridge Road',
  'DLF Phase 3, Golf Course Road', 'Powai, Hiranandani Gardens', 'Vasant Kunj D Block',
  'Jubilee Hills, Rd No. 36', 'Salt Lake, Sector V', 'Electronic City Phase 1',
];

// ─────────────────────────────────────────────────────
// CATEGORY-SPECIFIC IMAGE URLS (Unsplash)
// ─────────────────────────────────────────────────────
const IMAGES: Record<string, string[]> = {
  homes: [
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80',
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
    'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80',
    'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80',
  ],
  flats: [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
    'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800&q=80',
    'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
    'https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=800&q=80',
  ],
  pgs: [
    'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80',
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80',
    'https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=800&q=80',
    'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&q=80',
    'https://images.unsplash.com/photo-1560185008-b033106af5c8?w=800&q=80',
  ],
  cars: [
    'https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=800&q=80',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
    'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&q=80',
    'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?w=800&q=80',
    'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80',
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80',
    'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&q=80',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80',
  ],
  bikes: [
    'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=80',
    'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&q=80',
    'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&q=80',
    'https://images.unsplash.com/photo-1622185135505-2d795003994a?w=800&q=80',
    'https://images.unsplash.com/photo-1558980394-4c7c9299fe96?w=800&q=80',
    'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&q=80',
  ],
  'washing-machines': [
    'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800&q=80',
    'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800&q=80',
    'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=800&q=80',
    'https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?w=800&q=80',
  ],
  'water-filters': [
    'https://images.unsplash.com/photo-1585687433057-6ef8e1b38d2d?w=800&q=80',
    'https://images.unsplash.com/photo-1564419320461-6262a50ef082?w=800&q=80',
    'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80',
  ],
  electronics: [
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
    'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&q=80',
    'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=800&q=80',
    'https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=800&q=80',
    'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
    'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=800&q=80',
  ],
  furniture: [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80',
    'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&q=80',
    'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=800&q=80',
    'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80',
    'https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=800&q=80',
  ],
  'tools-equipment': [
    'https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=800&q=80',
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80',
    'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&q=80',
    'https://images.unsplash.com/photo-1590479773265-7464e5d48118?w=800&q=80',
    'https://images.unsplash.com/photo-1530124566582-a45a7e3d0c58?w=800&q=80',
  ],
  others: [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
    'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&q=80',
  ],
};

// ─────────────────────────────────────────────────────
// CATEGORY-SPECIFIC LISTING DATA
// ─────────────────────────────────────────────────────
interface ListingTemplate {
  titles: string[];
  descriptions: string[];
  priceRange: [number, number];
  rentPeriod: RentPeriod;
  amenities: { key: string; values: string[] }[];
}

const LISTING_TEMPLATES: Record<string, ListingTemplate> = {
  homes: {
    titles: [
      '3BHK Independent House in {city}',
      'Luxury Villa with Garden & Parking',
      'Spacious 4BHK House, Gated Community',
      '2BHK Independent House, Family-Friendly',
      'Modern Smart Home with Home Theater',
      'Heritage Bungalow, Newly Renovated',
      'Duplex House with Rooftop Terrace',
      'Fully Furnished 3BHK Villa',
      'Cozy 2BHK House Near Metro',
      'Premium Villa with Swimming Pool',
    ],
    descriptions: [
      'Beautiful independent house in a prime location. Well-maintained with spacious rooms, modern kitchen, and ample natural light. Perfect for families looking for a peaceful living environment with all amenities nearby.',
      'This stunning villa features contemporary architecture with premium fittings throughout. The landscaped garden is perfect for evening relaxation, and the covered parking fits two vehicles comfortably.',
      'Spacious home in a well-maintained gated community with 24/7 security, power backup, and community hall. Walking distance to schools, hospitals, and shopping complexes.',
    ],
    priceRange: [15000, 85000],
    rentPeriod: RentPeriod.MONTHLY,
    amenities: [
      { key: 'Bedrooms', values: ['2', '3', '4', '5'] },
      { key: 'Bathrooms', values: ['2', '3', '4'] },
      { key: 'Area (sq.ft)', values: ['1200', '1500', '1800', '2200', '2500', '3000'] },
      { key: 'Furnishing', values: ['Fully Furnished', 'Semi Furnished', 'Unfurnished'] },
      { key: 'Parking', values: ['1 Car', '2 Cars', 'Bike + Car', 'No Parking'] },
      { key: 'Floor', values: ['Ground', 'Ground + 1', 'Ground + 2'] },
      { key: 'Facing', values: ['East', 'West', 'North', 'South', 'North-East'] },
      { key: 'Water Supply', values: ['Municipal', 'Borewell', 'Both'] },
      { key: 'Power Backup', values: ['Full', 'Partial', 'Inverter', 'None'] },
      { key: 'Pet Friendly', values: ['Yes', 'No'] },
    ],
  },
  flats: {
    titles: [
      '2BHK Apartment in {city}, Great View',
      'Luxury 3BHK Flat with Club Access',
      'Studio Apartment, Ideal for Bachelors',
      '1BHK Smart Flat Near IT Park',
      'Penthouse 4BHK with Terrace Garden',
      '2BHK Flat in Premium Society',
      'Newly Built 3BHK with Modern Amenities',
      'Compact 1BHK, Walking Distance to Metro',
      'Sea-Facing 2BHK Apartment',
      'Spacious 3BHK with Servant Quarter',
    ],
    descriptions: [
      'Well-designed apartment in one of the most sought-after residential complexes. Features modular kitchen, vitrified flooring, and branded sanitary fittings. The society offers a swimming pool, gym, and children\'s play area.',
      'Move-in ready flat with contemporary interiors. Large living room with balcony overlooking the city skyline. The complex has 24/7 security, CCTV surveillance, and power backup.',
      'Premium apartment in a gated community with world-class amenities including jogging track, tennis court, and landscaped gardens. Close to top schools and hospitals.',
    ],
    priceRange: [8000, 55000],
    rentPeriod: RentPeriod.MONTHLY,
    amenities: [
      { key: 'Bedrooms', values: ['1', '2', '3', '4'] },
      { key: 'Bathrooms', values: ['1', '2', '3'] },
      { key: 'Area (sq.ft)', values: ['450', '650', '850', '1100', '1400', '1800'] },
      { key: 'Floor', values: ['1st', '2nd', '3rd', '5th', '8th', '12th', '15th', '20th'] },
      { key: 'Total Floors', values: ['5', '10', '15', '20', '25'] },
      { key: 'Furnishing', values: ['Fully Furnished', 'Semi Furnished', 'Unfurnished'] },
      { key: 'Balcony', values: ['1', '2', '3', 'None'] },
      { key: 'Gym', values: ['Yes', 'No'] },
      { key: 'Swimming Pool', values: ['Yes', 'No'] },
      { key: 'Lift', values: ['Yes', 'No'] },
    ],
  },
  pgs: {
    titles: [
      'Boys PG in {city}, AC Room',
      'Girls PG with Meals, Near IT Hub',
      'Co-Living Space with WiFi & Laundry',
      'Premium PG, Single Occupancy',
      'Budget PG Near College Area',
      'Luxury PG with Attached Bathroom',
      'Working Women\'s PG, Safe Location',
      'Fully Furnished PG, All Inclusive',
    ],
    descriptions: [
      'Comfortable PG accommodation with home-cooked meals, high-speed WiFi, and regular housekeeping. Located in a safe residential area with easy access to public transport and nearby offices.',
      'Premium co-living space designed for young professionals. Enjoy a vibrant community with common areas, gaming zone, and rooftop terrace. All bills included in the rent.',
      'Well-maintained paying guest accommodation with attached washroom, AC, and hot water. Three meals provided daily. 24/7 security and CCTV surveillance.',
    ],
    priceRange: [5000, 18000],
    rentPeriod: RentPeriod.MONTHLY,
    amenities: [
      { key: 'Occupancy', values: ['Single', 'Double', 'Triple'] },
      { key: 'Gender', values: ['Boys', 'Girls', 'Co-ed'] },
      { key: 'Meals', values: ['3 Meals/Day', '2 Meals/Day', 'No Meals'] },
      { key: 'AC', values: ['Yes', 'No', 'Cooler'] },
      { key: 'WiFi', values: ['Yes', 'No'] },
      { key: 'Laundry', values: ['Included', 'Extra ₹500/mo', 'Not Available'] },
      { key: 'Bathroom', values: ['Attached', 'Shared'] },
      { key: 'Housekeeping', values: ['Daily', 'Weekly', 'None'] },
    ],
  },
  cars: {
    titles: [
      'Maruti Swift Dzire — Self Drive',
      'Hyundai Creta for Weekend Trips',
      'Toyota Innova Crysta, 7-Seater',
      'Tata Nexon EV, Eco-Friendly Ride',
      'Honda City — Well Maintained',
      'Mahindra Thar — Adventure Ready',
      'Kia Seltos, Premium Variant',
      'MG Hector Plus, Family SUV',
      'Maruti Baleno — Fuel Efficient',
      'BMW 3 Series — Luxury Drive',
    ],
    descriptions: [
      'Well-maintained car available for self-drive rental. Regularly serviced with genuine parts, clean interiors, and full tank handover. Insurance and basic roadside assistance included.',
      'Perfect for weekend getaways and family trips. This SUV comes with GPS navigation, Bluetooth connectivity, and rear parking camera. Unlimited kilometers within city limits.',
      'Rent this premium vehicle for business trips, weddings, or special occasions. Chauffeur available at extra cost. Pick-up and drop-off available across the city.',
    ],
    priceRange: [1500, 8000],
    rentPeriod: RentPeriod.DAILY,
    amenities: [
      { key: 'Brand', values: ['Maruti', 'Hyundai', 'Toyota', 'Tata', 'Honda', 'Mahindra', 'Kia', 'MG', 'BMW'] },
      { key: 'Fuel Type', values: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'] },
      { key: 'Transmission', values: ['Manual', 'Automatic', 'iMT'] },
      { key: 'Seats', values: ['4', '5', '7', '8'] },
      { key: 'Year', values: ['2020', '2021', '2022', '2023', '2024', '2025'] },
      { key: 'KM Limit', values: ['150 km/day', '200 km/day', '300 km/day', 'Unlimited'] },
      { key: 'Insurance', values: ['Included', 'Extra'] },
      { key: 'GPS', values: ['Yes', 'No'] },
    ],
  },
  bikes: {
    titles: [
      'Royal Enfield Classic 350 — Daily Rental',
      'Honda Activa 6G — City Commute',
      'KTM Duke 200 — Sports Bike',
      'Yamaha R15 V4 — Weekend Ride',
      'Bajaj Pulsar NS200 for Rent',
      'TVS Jupiter — Easy Scooter',
      'Royal Enfield Himalayan — Touring',
      'Suzuki Access 125 — Fuel Efficient',
    ],
    descriptions: [
      'Well-maintained bike available for daily or weekly rental. Regularly serviced, clean, and ready to ride. Helmet provided. Perfect for city commuting or short trips.',
      'Rent this powerful machine for an unforgettable riding experience. Recently serviced with new tyres. Ideal for weekend rides and highway trips.',
      'Convenient and fuel-efficient two-wheeler for daily commuting. Easy to ride, automatic transmission. Includes one helmet and basic insurance coverage.',
    ],
    priceRange: [300, 2000],
    rentPeriod: RentPeriod.DAILY,
    amenities: [
      { key: 'Brand', values: ['Royal Enfield', 'Honda', 'KTM', 'Yamaha', 'Bajaj', 'TVS', 'Suzuki'] },
      { key: 'Engine (CC)', values: ['110', '125', '150', '200', '350', '411'] },
      { key: 'Type', values: ['Scooter', 'Street', 'Sports', 'Cruiser', 'Adventure'] },
      { key: 'Year', values: ['2021', '2022', '2023', '2024', '2025'] },
      { key: 'Helmet', values: ['1 Included', '2 Included', 'Not Included'] },
      { key: 'Mileage', values: ['35 kmpl', '45 kmpl', '50 kmpl', '60 kmpl'] },
    ],
  },
  'washing-machines': {
    titles: [
      'LG 7kg Front Load Washing Machine',
      'Samsung Top Load — Semi Automatic',
      'IFB Fully Automatic — Steam Wash',
      'Whirlpool 6.5kg — Budget Friendly',
      'Bosch Front Load with Dryer',
      'LG 8kg AI Direct Drive',
    ],
    descriptions: [
      'Brand new washing machine available for monthly rental. Energy efficient with multiple wash programs. Free installation and demonstration included.',
      'High-quality washing machine on rent. Perfect for temporary apartments, PGs, or if you want to try before you buy. Maintenance and repair covered during rental period.',
      'Premium washing machine with advanced features like steam wash and allergen cycle. Ideal for families. Free relocation within city if you move.',
    ],
    priceRange: [500, 1800],
    rentPeriod: RentPeriod.MONTHLY,
    amenities: [
      { key: 'Brand', values: ['LG', 'Samsung', 'IFB', 'Whirlpool', 'Bosch', 'Haier'] },
      { key: 'Type', values: ['Front Load', 'Top Load'] },
      { key: 'Capacity', values: ['6 kg', '6.5 kg', '7 kg', '7.5 kg', '8 kg', '9 kg'] },
      { key: 'Mode', values: ['Fully Automatic', 'Semi Automatic'] },
      { key: 'Dryer', values: ['With Dryer', 'Without Dryer'] },
      { key: 'Energy Rating', values: ['3 Star', '4 Star', '5 Star'] },
      { key: 'Installation', values: ['Free', 'Extra ₹500'] },
    ],
  },
  'water-filters': {
    titles: [
      'Kent Grand RO+UV Water Purifier',
      'Aquaguard Aura — RO+UV+MTDS',
      'Pureit Classic UV Water Filter',
      'Kent Pearl Wall-Mount Purifier',
      'Livpure Glo Touch — Smart Filter',
      'Blue Star Aristo RO+UV',
    ],
    descriptions: [
      'Premium water purifier available on rent with free installation and maintenance. RO+UV purification ensures safe drinking water for your family. Filter replacements included.',
      'High-capacity water purifier ideal for homes and offices. Advanced multi-stage purification removes all impurities. Monthly maintenance visit included in rental.',
      'Smart water purifier with real-time TDS monitoring and filter life indicator. Wall-mounted design saves counter space. All servicing and part replacements covered.',
    ],
    priceRange: [300, 900],
    rentPeriod: RentPeriod.MONTHLY,
    amenities: [
      { key: 'Brand', values: ['Kent', 'Aquaguard', 'Pureit', 'Livpure', 'Blue Star', 'Havells'] },
      { key: 'Technology', values: ['RO+UV', 'RO+UV+MTDS', 'UV+UF', 'RO+UV+UF'] },
      { key: 'Capacity', values: ['7L', '8L', '9L', '10L', '12L'] },
      { key: 'Mounting', values: ['Wall Mount', 'Counter Top'] },
      { key: 'TDS Range', values: ['Up to 500', 'Up to 1000', 'Up to 2000'] },
      { key: 'Maintenance', values: ['Included', 'Extra'] },
    ],
  },
  electronics: {
    titles: [
      'MacBook Pro 14" M3 — Monthly Rental',
      'Sony 55" 4K Smart TV for Events',
      'Canon EOS R6 DSLR with Lens Kit',
      'PlayStation 5 Console + 2 Controllers',
      'Dell 27" 4K Monitor — WFH Setup',
      'iPad Pro 12.9" with Apple Pencil',
      'JBL PartyBox 310 — Party Speaker',
      'DJI Mini 3 Pro Drone — Aerial Shots',
      'HP LaserJet Printer — Office Use',
      'Gaming PC — RTX 4070 Setup',
    ],
    descriptions: [
      'Top-of-the-line electronics available for short and long-term rental. Perfect for projects, events, or trying before buying. All devices are thoroughly tested and sanitized.',
      'Premium gadget on rent with all original accessories. Ideal for freelancers, students, or professionals who need high-end equipment without the upfront investment.',
      'Rent this device for your next event, project, or personal use. Comes with carrying case, charger, and all necessary cables. Delivery available across the city.',
    ],
    priceRange: [500, 5000],
    rentPeriod: RentPeriod.DAILY,
    amenities: [
      { key: 'Brand', values: ['Apple', 'Sony', 'Canon', 'Dell', 'HP', 'JBL', 'DJI', 'Samsung'] },
      { key: 'Condition', values: ['Like New', 'Good', 'Excellent'] },
      { key: 'Warranty', values: ['Active', 'Expired', 'Extended'] },
      { key: 'Accessories', values: ['All Original', 'Basic', 'Extra Available'] },
      { key: 'Delivery', values: ['Free within City', 'Extra ₹200', 'Pickup Only'] },
      { key: 'Security Deposit', values: ['₹2000', '₹5000', '₹10000', '₹15000'] },
    ],
  },
  furniture: {
    titles: [
      'L-Shape Sofa Set — Premium Fabric',
      'Queen Size Bed with Storage',
      'Study Desk + Ergonomic Chair Combo',
      '6-Seater Dining Table Set',
      'Wardrobe with Mirror — 3 Door',
      'Bookshelf — Solid Wood',
      'Bean Bag Combo — 2 Pieces',
      'King Size Bed with Mattress',
      'TV Unit with Wall Shelf',
      'Modular Kitchen Table Set',
    ],
    descriptions: [
      'High-quality furniture available on monthly rental. Perfect for newly rented apartments or temporary stays. Free delivery and assembly included within city limits.',
      'Rent premium furniture without the hassle of buying and moving. Our pieces are well-maintained, stylish, and sturdy. Swap or return anytime with 7 days notice.',
      'Fully assembled furniture delivered to your doorstep. Made from solid wood with premium finish. Perfect for giving your space a complete makeover without buying.',
    ],
    priceRange: [500, 3000],
    rentPeriod: RentPeriod.MONTHLY,
    amenities: [
      { key: 'Material', values: ['Solid Wood', 'Engineered Wood', 'Metal', 'Fabric', 'Leather'] },
      { key: 'Color', values: ['Walnut', 'Honey', 'White', 'Grey', 'Black', 'Natural', 'Brown'] },
      { key: 'Condition', values: ['New', 'Like New', 'Good'] },
      { key: 'Assembly', values: ['Pre-Assembled', 'Requires Assembly (Free)'] },
      { key: 'Delivery', values: ['Free', 'Extra ₹300-500'] },
      { key: 'Swap', values: ['Anytime (7-day notice)', 'After 3 months', 'Not Available'] },
    ],
  },
  'tools-equipment': {
    titles: [
      'Bosch Power Drill + Bit Set',
      'Pressure Washer — Car & Home Cleaning',
      'Projector & Screen — Events/Movies',
      'Welding Machine — Industrial Grade',
      'Lawn Mower — Electric Cordless',
      'Generator 5KVA — Power Backup',
      'Concrete Mixer — Construction',
      'Floor Polishing Machine',
    ],
    descriptions: [
      'Professional-grade equipment available for daily or weekly rent. Thoroughly inspected and tested before each rental. Ideal for DIY projects, small repairs, or construction work.',
      'Heavy-duty tool on rent with safety instructions and basic accessories. Perfect for one-time use without the expense of buying. Delivery and pickup available.',
      'Rent this equipment for your next project or event. Comes with complete accessory kit and user manual. Our team can provide a quick demonstration on request.',
    ],
    priceRange: [300, 3000],
    rentPeriod: RentPeriod.DAILY,
    amenities: [
      { key: 'Brand', values: ['Bosch', 'Makita', 'DeWalt', 'Stanley', 'Black+Decker', 'Generic'] },
      { key: 'Power Source', values: ['Electric', 'Battery', 'Petrol', 'Diesel', 'Manual'] },
      { key: 'Condition', values: ['New', 'Good', 'Serviceable'] },
      { key: 'Safety Gear', values: ['Included', 'Extra ₹100', 'Not Provided'] },
      { key: 'Delivery', values: ['Free in City', 'Extra Charges', 'Pickup Only'] },
      { key: 'Demo', values: ['Available', 'Video Guide', 'Not Available'] },
    ],
  },
  others: {
    titles: [
      'Camping Tent — 4 Person Waterproof',
      'Baby Stroller — Premium Brand',
      'Treadmill — Home Workout',
      'Musical Keyboard — 88 Keys',
      'Wedding Decoration Set',
      'Portable AC — 1.5 Ton',
      'Sewing Machine — Heavy Duty',
      'Telescope — Stargazing Kit',
    ],
    descriptions: [
      'Unique rental item perfect for temporary needs. Why buy when you can rent? Well-maintained and ready for use. Affordable rates with flexible rental periods.',
      'Rent this item for your specific need without the commitment of buying. Great condition, thoroughly cleaned, and tested. Contact for special duration pricing.',
      'Available for short and long-term rental. Perfect for events, projects, or temporary requirements. Full accessory kit included with every rental.',
    ],
    priceRange: [200, 2500],
    rentPeriod: RentPeriod.DAILY,
    amenities: [
      { key: 'Condition', values: ['New', 'Like New', 'Good'] },
      { key: 'Delivery', values: ['Free in City', 'Extra Charges', 'Pickup Only'] },
      { key: 'Security Deposit', values: ['₹500', '₹1000', '₹2000', '₹5000'] },
    ],
  },
};

// ─────────────────────────────────────────────────────
// OWNER PROFILES
// ─────────────────────────────────────────────────────
const OWNER_PROFILES = [
  { name: 'Rajesh Kumar', city: 'Mumbai', state: 'Maharashtra' },
  { name: 'Priya Sharma', city: 'Delhi', state: 'Delhi' },
  { name: 'Vikram Patel', city: 'Bangalore', state: 'Karnataka' },
  { name: 'Anita Reddy', city: 'Hyderabad', state: 'Telangana' },
  { name: 'Suresh Menon', city: 'Chennai', state: 'Tamil Nadu' },
  { name: 'Kavitha Nair', city: 'Kochi', state: 'Kerala' },
  { name: 'Amit Gupta', city: 'Pune', state: 'Maharashtra' },
  { name: 'Sneha Iyer', city: 'Bangalore', state: 'Karnataka' },
  { name: 'Rohit Joshi', city: 'Jaipur', state: 'Rajasthan' },
  { name: 'Deepa Singh', city: 'Lucknow', state: 'Uttar Pradesh' },
  { name: 'Manoj Verma', city: 'Ahmedabad', state: 'Gujarat' },
  { name: 'Pooja Agarwal', city: 'Noida', state: 'Uttar Pradesh' },
  { name: 'Karthik Rao', city: 'Hyderabad', state: 'Telangana' },
  { name: 'Neha Saxena', city: 'Gurgaon', state: 'Haryana' },
  { name: 'Arjun Desai', city: 'Pune', state: 'Maharashtra' },
];

// ─────────────────────────────────────────────────────
// MAIN SEED
// ─────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Seeding database...');
  console.log('🗑️  Clearing existing data...');

  // Clear in dependency order
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.contactReveal.deleteMany();
  await prisma.savedListing.deleteMany();
  await prisma.listingAmenity.deleteMany();
  await prisma.listingImage.deleteMany();
  await prisma.report.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.userSubscription.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.oAuthAccount.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.adminLog.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
  await prisma.subscriptionPlan.deleteMany();

  // ─── ADMIN USER ──────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@rentage.in',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      isEmailVerified: true,
      profile: { create: { fullName: 'Rentage Admin', city: 'Bangalore', state: 'Karnataka' } },
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // ─── DEMO RENTER ─────────────────────────────────
  const renterPassword = await bcrypt.hash('Renter@123', 12);
  const renter = await prisma.user.create({
    data: {
      email: 'renter@demo.com',
      passwordHash: renterPassword,
      role: UserRole.RENTER,
      isEmailVerified: true,
      profile: { create: { fullName: 'Demo Renter', city: 'Bangalore', state: 'Karnataka', phone: '+919876543210' } },
    },
  });
  console.log(`✅ Renter: ${renter.email}`);

  // ─── OWNER USERS ─────────────────────────────────
  const ownerPassword = await bcrypt.hash('Owner@123', 12);
  const owners: any[] = [];
  for (const profile of OWNER_PROFILES) {
    const owner = await prisma.user.create({
      data: {
        email: `${profile.name.toLowerCase().replace(/\s/g, '.')}@rentage.in`,
        passwordHash: ownerPassword,
        role: UserRole.OWNER,
        isEmailVerified: true,
        profile: {
          create: {
            fullName: profile.name,
            city: profile.city,
            state: profile.state,
            phone: `+91${rand(70000, 99999)}${rand(10000, 99999)}`,
          },
        },
      },
    });
    owners.push(owner);
  }
  console.log(`✅ ${owners.length} owners created`);

  // ─── CATEGORIES ──────────────────────────────────
  const categoryData = [
    { name: 'Homes', slug: 'homes', icon: '🏠', description: 'Houses and villas for rent', sortOrder: 1 },
    { name: 'Flats', slug: 'flats', icon: '🏢', description: 'Apartments and flats for rent', sortOrder: 2 },
    { name: 'PGs', slug: 'pgs', icon: '🛏️', description: 'Paying guest accommodations', sortOrder: 3 },
    { name: 'Cars', slug: 'cars', icon: '🚗', description: 'Cars for rent', sortOrder: 4 },
    { name: 'Bikes', slug: 'bikes', icon: '🏍️', description: 'Motorcycles and scooters for rent', sortOrder: 5 },
    { name: 'Washing Machines', slug: 'washing-machines', icon: '🫧', description: 'Washing machines for rent', sortOrder: 6 },
    { name: 'Water Filters', slug: 'water-filters', icon: '💧', description: 'Water purifiers for rent', sortOrder: 7 },
    { name: 'Electronics', slug: 'electronics', icon: '📱', description: 'Laptops, TVs, cameras, and more', sortOrder: 8 },
    { name: 'Furniture', slug: 'furniture', icon: '🪑', description: 'Sofas, beds, tables, and more', sortOrder: 9 },
    { name: 'Tools & Equipment', slug: 'tools-equipment', icon: '🔧', description: 'Power tools, construction equipment', sortOrder: 10 },
    { name: 'Others', slug: 'others', icon: '📦', description: 'Everything else that can be rented', sortOrder: 11 },
  ];

  const categories: Record<string, any> = {};
  for (const cat of categoryData) {
    categories[cat.slug] = await prisma.category.create({ data: cat });
  }
  console.log(`✅ ${categoryData.length} categories`);

  // ─── SUBSCRIPTION PLANS ──────────────────────────
  const plans = [
    { name: 'Free', slug: 'free', description: 'Get started with basic listings', price: 0, maxListings: 3, maxContactReveals: 5, features: { featured: false, prioritySupport: false }, sortOrder: 1 },
    { name: 'Basic', slug: 'basic', description: 'Perfect for regular renters and owners', price: 199, maxListings: 15, maxContactReveals: 30, features: { featured: false, prioritySupport: false }, sortOrder: 2 },
    { name: 'Pro', slug: 'pro', description: 'Unlimited access for power users', price: 499, maxListings: -1, maxContactReveals: -1, features: { featured: true, prioritySupport: true }, sortOrder: 3 },
  ];
  let freePlan: any;
  let proPlan: any;
  for (const plan of plans) {
    const created = await prisma.subscriptionPlan.create({ data: plan });
    if (plan.slug === 'free') freePlan = created;
    if (plan.slug === 'pro') proPlan = created;
  }
  console.log(`✅ ${plans.length} subscription plans`);

  // Assign Pro plan to demo listing owners (they create many listings),
  // Free plan to admin and renter (non-listing demo accounts)
  for (const u of owners) {
    await prisma.userSubscription.create({
      data: { userId: u.id, planId: proPlan.id, currentPeriodStart: new Date(), currentPeriodEnd: new Date('2099-12-31') },
    });
  }
  for (const u of [admin, renter]) {
    await prisma.userSubscription.create({
      data: { userId: u.id, planId: freePlan.id, currentPeriodStart: new Date(), currentPeriodEnd: new Date('2099-12-31') },
    });
  }

  // ─── LISTINGS (120+) ─────────────────────────────
  console.log('📦 Creating listings...');
  const slugs = Object.keys(LISTING_TEMPLATES);
  // Distribution: more homes/flats/cars, fewer niche items
  const distribution: Record<string, number> = {
    homes: 15, flats: 18, pgs: 10, cars: 15, bikes: 12,
    'washing-machines': 8, 'water-filters': 7, electronics: 14,
    furniture: 10, 'tools-equipment': 8, others: 8,
  };

  let totalListings = 0;
  for (const slug of slugs) {
    const count = distribution[slug] || 5;
    const template = LISTING_TEMPLATES[slug];
    const cat = categories[slug];
    const imgs = IMAGES[slug];

    for (let i = 0; i < count; i++) {
      const loc = pick(CITIES);
      const owner = pick(owners);
      const titleTemplate = pick(template.titles);
      const title = titleTemplate.replace('{city}', loc.city);
      const description = pick(template.descriptions);
      const price = Math.round(rand(template.priceRange[0], template.priceRange[1]) / 100) * 100;
      const isFeatured = Math.random() < 0.15; // 15% featured

      // Create listing
      const listing = await prisma.listing.create({
        data: {
          ownerId: owner.id,
          categoryId: cat.id,
          title,
          description,
          price,
          rentPeriod: template.rentPeriod,
          status: ListingStatus.ACTIVE,
          isFeatured,
          address: pick(ADDRESSES),
          city: loc.city,
          state: loc.state,
          latitude: loc.lat + (Math.random() - 0.5) * 0.1,
          longitude: loc.lng + (Math.random() - 0.5) * 0.1,
          createdAt: new Date(Date.now() - rand(0, 60) * 24 * 60 * 60 * 1000), // random date within 60 days
        },
      });

      // Add 2-5 images per listing
      const numImages = rand(2, Math.min(5, imgs.length));
      const selectedImages = pickN(imgs, numImages);
      for (let j = 0; j < selectedImages.length; j++) {
        await prisma.listingImage.create({
          data: {
            listingId: listing.id,
            url: selectedImages[j],
            publicId: `seed_${slug}_${i}_${j}`,
            sortOrder: j,
          },
        });
      }

      // Add 4-8 amenities per listing (category-specific)
      const numAmenities = rand(4, Math.min(8, template.amenities.length));
      const selectedAmenities = pickN(template.amenities, numAmenities);
      for (const amenity of selectedAmenities) {
        await prisma.listingAmenity.create({
          data: {
            listingId: listing.id,
            key: amenity.key,
            value: pick(amenity.values),
          },
        });
      }

      totalListings++;
    }
    console.log(`  📁 ${slug}: ${count} listings`);
  }

  console.log(`✅ ${totalListings} total listings with images & category-specific amenities`);

  // ─── SAVE SOME LISTINGS FOR DEMO RENTER ──────────
  const randomListings = await prisma.listing.findMany({ take: 8, orderBy: { createdAt: 'desc' } });
  for (const listing of randomListings.slice(0, 5)) {
    await prisma.savedListing.create({
      data: { userId: renter.id, listingId: listing.id },
    });
  }
  console.log('✅ 5 saved listings for demo renter');

  console.log('\n🎉 Seeding complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Admin:  admin@rentage.in / Admin@123');
  console.log('  Renter: renter@demo.com / Renter@123');
  console.log('  Owners: {name}@rentage.in / Owner@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
