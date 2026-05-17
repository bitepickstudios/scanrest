export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      branch_products: {
        Row: {
          available: boolean
          branch_id: string
          price_override: number | null
          product_id: string
          stock: number | null
        }
        Insert: {
          available?: boolean
          branch_id: string
          price_override?: number | null
          product_id: string
          stock?: number | null
        }
        Update: {
          available?: boolean
          branch_id?: string
          price_override?: number | null
          product_id?: string
          stock?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "branch_products_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          active: boolean
          address: string | null
          created_at: string
          id: string
          is_default: boolean
          name: string
          phone: string | null
          restaurant_id: string
          slug: string
          type: Database["public"]["Enums"]["branch_type"]
        }
        Insert: {
          active?: boolean
          address?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          phone?: string | null
          restaurant_id: string
          slug: string
          type?: Database["public"]["Enums"]["branch_type"]
        }
        Update: {
          active?: boolean
          address?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          phone?: string | null
          restaurant_id?: string
          slug?: string
          type?: Database["public"]["Enums"]["branch_type"]
        }
        Relationships: [
          {
            foreignKeyName: "branches_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          branch_id: string
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          duration_minutes: number
          id: string
          notes: string | null
          party_size: number
          reservation_at: string
          status: Database["public"]["Enums"]["reservation_status"]
          table_id: string | null
          zone_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          branch_id: string
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          party_size: number
          reservation_at: string
          status?: Database["public"]["Enums"]["reservation_status"]
          table_id?: string | null
          zone_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          branch_id?: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          party_size?: number
          reservation_at?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          table_id?: string | null
          zone_id?: string | null
        }
        Relationships: []
      }
      staff: {
        Row: {
          active: boolean
          branch_id: string | null
          created_at: string
          display_name: string | null
          id: string
          restaurant_id: string
          role: Database["public"]["Enums"]["staff_role"]
          user_id: string
        }
        Insert: {
          active?: boolean
          branch_id?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          restaurant_id: string
          role: Database["public"]["Enums"]["staff_role"]
          user_id: string
        }
        Update: {
          active?: boolean
          branch_id?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          restaurant_id?: string
          role?: Database["public"]["Enums"]["staff_role"]
          user_id?: string
        }
        Relationships: []
      }
      staff_zones: {
        Row: { staff_id: string; zone_id: string }
        Insert: { staff_id: string; zone_id: string }
        Update: { staff_id?: string; zone_id?: string }
        Relationships: []
      }
      zones: {
        Row: {
          branch_id: string
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          branch_id: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          branch_id?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      owns_branch: { Args: { b_id: string }; Returns: boolean }
      owns_restaurant: { Args: { rid: string }; Returns: boolean }
      staff_has_branch_access: {
        Args: {
          b_id: string
          min_role?: Database["public"]["Enums"]["staff_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      branch_type: "standalone" | "foodpark_stall"
      reservation_status:
        | "pending"
        | "confirmed"
        | "rejected"
        | "cancelled"
        | "seated"
        | "completed"
        | "no_show"
      staff_role: "superadmin" | "admin" | "waiter"
    }
    CompositeTypes: { [_ in never]: never }
  }
}

export type Branch = Database["public"]["Tables"]["branches"]["Row"]
export type Zone = Database["public"]["Tables"]["zones"]["Row"]
export type Staff = Database["public"]["Tables"]["staff"]["Row"]
export type Reservation = Database["public"]["Tables"]["reservations"]["Row"]
export type BranchProduct = Database["public"]["Tables"]["branch_products"]["Row"]
export type StaffRole = Database["public"]["Enums"]["staff_role"]
export type ReservationStatus = Database["public"]["Enums"]["reservation_status"]
export type BranchType = Database["public"]["Enums"]["branch_type"]
