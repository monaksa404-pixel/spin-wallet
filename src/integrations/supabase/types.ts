export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      balance_deadline_settings: {
        Row: {
          deadline_hours: number
          id: number
          updated_at: string
        }
        Insert: {
          deadline_hours?: number
          id?: number
          updated_at?: string
        }
        Update: {
          deadline_hours?: number
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      deposit_settings: {
        Row: {
          key: string
          value: string
          updated_at: string | null
        }
        Insert: {
          key: string
          value?: string
          updated_at?: string | null
        }
        Update: {
          key?: string
          value?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      deposits: {
        Row: {
          admin_note: string | null
          amount: number | null
          bonus_amount: number | null
          created_at: string
          gift_card_brand: string | null
          gift_card_code: string | null
          id: string
          method: Database["public"]["Enums"]["deposit_method"]
          payer_account_name: string | null
          payer_account_number: string | null
          payer_iban: string | null
          requested_amount: number | null
          reviewed_at: string | null
          status: Database["public"]["Enums"]["request_status"]
          usdt_tx_address: string | null
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount?: number | null
          bonus_amount?: number | null
          created_at?: string
          gift_card_brand?: string | null
          gift_card_code?: string | null
          id?: string
          method: Database["public"]["Enums"]["deposit_method"]
          payer_account_name?: string | null
          payer_account_number?: string | null
          payer_iban?: string | null
          requested_amount?: number | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          usdt_tx_address?: string | null
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount?: number | null
          bonus_amount?: number | null
          created_at?: string
          gift_card_brand?: string | null
          gift_card_code?: string | null
          id?: string
          method?: Database["public"]["Enums"]["deposit_method"]
          payer_account_name?: string | null
          payer_account_number?: string | null
          payer_iban?: string | null
          requested_amount?: number | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          usdt_tx_address?: string | null
          user_id?: string
        }
        Relationships: []
      }
      deposit_popup_notices: {
        Row: {
          id: string
          user_id: string
          deposit_id: string
          outcome: string
          title: string
          body: string
          failure_reason: string | null
          dismissed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          deposit_id: string
          outcome: string
          title: string
          body: string
          failure_reason?: string | null
          dismissed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          deposit_id?: string
          outcome?: string
          title?: string
          body?: string
          failure_reason?: string | null
          dismissed_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      offer_countdowns: {
        Row: {
          id: string
          user_id: string
          offer_id: string
          expires_at: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          offer_id: string
          expires_at: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          offer_id?: string
          expires_at?: string
          created_at?: string | null
        }
        Relationships: []
      }
      offer_promotions: {
        Row: {
          bonus_label: string
          id: string
          updated_at: string
        }
        Insert: {
          bonus_label?: string
          id: string
          updated_at?: string
        }
        Update: {
          bonus_label?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      spin_rewards: {
        Row: {
          balance_at_spin: number
          bet_coins: number
          computed_amount: number
          created_at: string
          game: string
          id: string
          prize_kind: string
          prize_label: string
          prize_value: number
          reviewed_at: string | null
          status: Database["public"]["Enums"]["request_status"]
          user_id: string
        }
        Insert: {
          balance_at_spin: number
          bet_coins?: number
          computed_amount: number
          created_at?: string
          game?: string
          id?: string
          prize_kind: string
          prize_label: string
          prize_value: number
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          user_id: string
        }
        Update: {
          balance_at_spin?: number
          bet_coins?: number
          computed_amount?: number
          created_at?: string
          game?: string
          id?: string
          prize_kind?: string
          prize_label?: string
          prize_value?: number
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          failure_reason: string | null
          id: string
          kind: string
          ref_id: string | null
          user_id: string
          withdrawal_status: string | null
          deposit_status: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          failure_reason?: string | null
          id?: string
          kind: string
          ref_id?: string | null
          user_id: string
          withdrawal_status?: string | null
          deposit_status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          failure_reason?: string | null
          id?: string
          kind?: string
          ref_id?: string | null
          user_id?: string
          withdrawal_status?: string | null
          deposit_status?: string | null
        }
        Relationships: []
      }
      withdrawal_popup_notices: {
        Row: {
          id: string
          user_id: string
          withdrawal_id: string
          outcome: string
          title: string
          body: string
          failure_reason: string | null
          dismissed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          withdrawal_id: string
          outcome: string
          title: string
          body: string
          failure_reason?: string | null
          dismissed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          withdrawal_id?: string
          outcome?: string
          title?: string
          body?: string
          failure_reason?: string | null
          dismissed_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          balance_deadline_at: string | null
          balance_expired_at: string | null
          bonus_balance: number
          coins: number
          expired_balance_snapshot: number | null
          missed_deadline_at: string | null
          pending_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          balance_deadline_at?: string | null
          balance_expired_at?: string | null
          bonus_balance?: number
          coins?: number
          expired_balance_snapshot?: number | null
          missed_deadline_at?: string | null
          pending_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          balance_deadline_at?: string | null
          balance_expired_at?: string | null
          bonus_balance?: number
          coins?: number
          expired_balance_snapshot?: number | null
          missed_deadline_at?: string | null
          pending_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          account_name: string | null
          account_number: string | null
          admin_note: string | null
          amount: number
          bank_name: string | null
          created_at: string
          iban: string | null
          id: string
          method: Database["public"]["Enums"]["withdraw_method"]
          reviewed_at: string | null
          status: Database["public"]["Enums"]["request_status"]
          usdt_address: string | null
          user_id: string
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          admin_note?: string | null
          amount: number
          bank_name?: string | null
          created_at?: string
          iban?: string | null
          id?: string
          method: Database["public"]["Enums"]["withdraw_method"]
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          usdt_address?: string | null
          user_id: string
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          admin_note?: string | null
          amount?: number
          bank_name?: string | null
          created_at?: string
          iban?: string | null
          id?: string
          method?: Database["public"]["Enums"]["withdraw_method"]
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          usdt_address?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_set_balance_deadline_hours: {
        Args: { _hours: number }
        Returns: undefined
      }
      admin_set_offer_countdown: {
        Args: { _expires_at: string; _offer_id: string; _user_id: string }
        Returns: undefined
      }
      admin_set_user_deadline: {
        Args: { _deadline_at: string; _user_id: string }
        Returns: undefined
      }
      admin_update_username: {
        Args: { _new_name: string; _user_id: string }
        Returns: undefined
      }
      admin_deposit_pending_notice: {
        Args: { _deposit_id: string; _popup_message: string; _popup_title: string }
        Returns: undefined
      }
      approve_deposit: {
        Args: {
          _amount: number
          _bonus?: number
          _id: string
          _popup_message?: string | null
          _popup_title?: string | null
        }
        Returns: undefined
      }
      approve_spin: { Args: { _id: string }; Returns: undefined }
      admin_withdrawal_pending_notice: {
        Args: { _popup_message: string; _popup_title: string; _withdrawal_id: string }
        Returns: undefined
      }
      approve_withdrawal: {
        Args: { _id: string; _popup_message?: string | null; _popup_title?: string | null }
        Returns: undefined
      }
      convert_to_coins: { Args: { _usdt: number }; Returns: undefined }
      convert_to_usdt: { Args: { _coins: number }; Returns: undefined }
      get_admin_user_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          balance: number
          bonus_balance: number
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          status: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      play_game: {
        Args: {
          _bet_coins: number
          _game: string
          _prize_kind: string
          _prize_label: string
          _prize_value: number
        }
        Returns: string
      }
      reject_deposit: {
        Args: {
          _failure_reason: string
          _id: string
          _popup_message: string
          _popup_title: string
        }
        Returns: undefined
      }
      reject_spin: { Args: { _id: string }; Returns: undefined }
      dismiss_deposit_popup: { Args: { _notice_id: string }; Returns: undefined }
      dismiss_withdrawal_popup: { Args: { _notice_id: string }; Returns: undefined }
      wallet_apply_balance_expiry: {
        Args: Record<string, never>
        Returns: undefined
      }
      reject_withdrawal: {
        Args: {
          _failure_reason: string
          _id: string
          _popup_message: string
          _popup_title: string
        }
        Returns: undefined
      }
      request_withdrawal: {
        Args: {
          _account_name: string
          _account_number: string
          _amount: number
          _bank_name: string
          _iban: string
          _method: Database["public"]["Enums"]["withdraw_method"]
          _usdt_address: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user"
      deposit_method: "gift_card" | "usdt" | "bank"
      request_status: "pending" | "approved" | "rejected"
      withdraw_method: "usdt" | "bank"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      deposit_method: ["gift_card", "usdt", "bank"],
      request_status: ["pending", "approved", "rejected"],
      withdraw_method: ["usdt", "bank"],
    },
  },
} as const
