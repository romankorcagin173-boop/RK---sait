export type ProductCategory = "parfum" | "3d_print";
export type OrderStatus = "new" | "processing" | "done" | "cancelled";

export interface ProfileRow {
  id: string;
  username: string;
  email: string;
  phone: string | null;
  telegram_username: string | null;
  is_admin: boolean;
  is_blocked: boolean;
  created_at: string;
}

export interface VolumeOption {
  /** null = the whole bottle, otherwise a decant size in millilitres */
  ml: number | null;
  price: number;
}

export interface ProductRow {
  id: string;
  category: ProductCategory;
  slug: string;
  name: string;
  short_description: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  is_active: boolean;
  sort_order: number;
  volume_ml: number | null;
  remaining_ml: number | null;
  aroma_notes: string | null;
  // parfum-only: purchase options with their own price (e.g. 3 мл / 5 мл /
  // 10 мл / the whole bottle) — empty means the product just sells at its
  // flat `price` above with no volume choice.
  volume_options: VolumeOption[];
  material: string | null;
  dimensions: string | null;
  print_info: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewRow {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  pros: string | null;
  cons: string | null;
  photos: string[];
  created_at: string;
}

export interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  category: ProductCategory;
  // Which volume option was purchased (e.g. "5 мл", "Весь флакон"), or
  // null when the product has no volume options and sold at its flat price.
  volume_label: string | null;
}

export type OrderSource = "site" | "telegram";

export interface OrderRow {
  id: string;
  order_number: string;
  user_id: string | null;
  items: OrderItem[];
  total: number;
  contact_name: string;
  contact_phone: string | null;
  contact_telegram: string | null;
  contact_email: string | null;
  comment: string | null;
  status: OrderStatus;
  source: OrderSource;
  telegram_chat_id: number | null;
  telegram_username: string | null;
  created_at: string;
}

export interface SiteSettingRow {
  key: string;
  value: Record<string, unknown>;
}

type TableDef<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: TableDef<
        ProfileRow,
        Omit<ProfileRow, "created_at" | "is_admin" | "is_blocked"> &
          Partial<Pick<ProfileRow, "is_admin" | "is_blocked">>,
        Partial<ProfileRow>
      >;
      products: TableDef<
        ProductRow,
        Omit<ProductRow, "id" | "created_at" | "updated_at"> &
          Partial<Pick<ProductRow, "id">>,
        Partial<ProductRow>
      >;
      reviews: TableDef<
        ReviewRow,
        Omit<ReviewRow, "id" | "created_at"> & Partial<Pick<ReviewRow, "id">>,
        Partial<ReviewRow>
      >;
      orders: TableDef<
        OrderRow,
        Omit<OrderRow, "id" | "created_at"> & Partial<Pick<OrderRow, "id">>,
        Partial<OrderRow>
      >;
      site_settings: TableDef<SiteSettingRow, SiteSettingRow, Partial<SiteSettingRow>>;
    };
    Views: Record<string, never>;
    Functions: {
      get_email_for_login: {
        Args: { identifier: string };
        Returns: string;
      };
    };
    Enums: {
      product_category: ProductCategory;
      order_status: OrderStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
