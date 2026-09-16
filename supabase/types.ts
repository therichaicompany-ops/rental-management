export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          email: string | null
          phone: string | null
          role: Database['public']['Enums']['user_role']
          department: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          email?: string | null
          phone?: string | null
          role?: Database['public']['Enums']['user_role']
          department?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          email?: string | null
          phone?: string | null
          role?: Database['public']['Enums']['user_role']
          department?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          id: string
          customer_code: string | null
          customer_type: Database['public']['Enums']['customer_type']
          name: string | null
          company_name: string | null
          tax_id: string | null
          contact_name: string | null
          phone: string | null
          email: string | null
          line_name: string | null
          address: string | null
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_code?: string | null
          customer_type?: Database['public']['Enums']['customer_type']
          name?: string | null
          company_name?: string | null
          tax_id?: string | null
          contact_name?: string | null
          phone?: string | null
          email?: string | null
          line_name?: string | null
          address?: string | null
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_code?: string | null
          customer_type?: Database['public']['Enums']['customer_type']
          name?: string | null
          company_name?: string | null
          tax_id?: string | null
          contact_name?: string | null
          phone?: string | null
          email?: string | null
          line_name?: string | null
          address?: string | null
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      landlords: {
        Row: {
          id: string
          landlord_code: string | null
          name: string | null
          company_name: string | null
          tax_id: string | null
          contact_name: string | null
          phone: string | null
          email: string | null
          address: string | null
          bank_name: string | null
          bank_account_name: string | null
          bank_account_number: string | null
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          landlord_code?: string | null
          name?: string | null
          company_name?: string | null
          tax_id?: string | null
          contact_name?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          bank_name?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          landlord_code?: string | null
          name?: string | null
          company_name?: string | null
          tax_id?: string | null
          contact_name?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          bank_name?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          id: string
          location_code: string | null
          house_no: string | null
          room_no: string | null
          location_name: string | null
          village_name: string | null
          address: string | null
          subdistrict: string | null
          district: string | null
          province: string | null
          postal_code: string | null
          google_maps_url: string | null
          latitude: number | null
          longitude: number | null
          landlord_id: string | null
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          location_code?: string | null
          house_no?: string | null
          room_no?: string | null
          location_name?: string | null
          village_name?: string | null
          address?: string | null
          subdistrict?: string | null
          district?: string | null
          province?: string | null
          postal_code?: string | null
          google_maps_url?: string | null
          latitude?: number | null
          longitude?: number | null
          landlord_id?: string | null
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          location_code?: string | null
          house_no?: string | null
          room_no?: string | null
          location_name?: string | null
          village_name?: string | null
          address?: string | null
          subdistrict?: string | null
          district?: string | null
          province?: string | null
          postal_code?: string | null
          google_maps_url?: string | null
          latitude?: number | null
          longitude?: number | null
          landlord_id?: string | null
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'locations_landlord_id_fkey'
            columns: ['landlord_id']
            isOneToOne: false
            referencedRelation: 'landlords'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      v_active_users: {
        Row: {
          id: string
          full_name: string | null
          email: string | null
          phone: string | null
          role: Database['public']['Enums']['user_role']
          department: string | null
          is_active: boolean
          created_at: string
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'owner' | 'admin' | 'accounting' | 'hr' | 'operation' | 'staff' | 'viewer'
      customer_type: 'individual' | 'company'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
