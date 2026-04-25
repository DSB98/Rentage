import { ListingStatus, RentPeriod } from './enums';

export interface ICategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  children?: ICategory[];
}

export interface IListingImage {
  id: string;
  url: string;
  publicId: string;
  sortOrder: number;
}

export interface IListingAmenity {
  id: string;
  key: string;
  value: string;
}

export interface IListing {
  id: string;
  ownerId: string;
  categoryId: string;
  title: string;
  description: string;
  price: number;
  rentPeriod: RentPeriod;
  status: ListingStatus;
  isFeatured: boolean;
  address?: string;
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  images: IListingImage[];
  amenities: IListingAmenity[];
  category?: ICategory;
  owner?: {
    id: string;
    profile: {
      fullName: string;
      avatarUrl?: string;
      city?: string;
    } | null;
  };
}

export interface IListingSearchParams {
  query?: string;
  categoryId?: string;
  city?: string;
  state?: string;
  minPrice?: number;
  maxPrice?: number;
  rentPeriod?: RentPeriod;
  sort?: 'newest' | 'price_asc' | 'price_desc';
  cursor?: string;
  limit?: number;
}
