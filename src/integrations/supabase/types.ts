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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      colaboradores: {
        Row: {
          agencia: string | null
          bairro: string | null
          banco: string | null
          cargo: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          compliance_aceito: boolean | null
          compliance_ip: string | null
          compliance_timestamp: string | null
          compliance_user_agent: string | null
          conta: string | null
          conta_tipo: string | null
          cpf: string | null
          created_at: string
          data_admissao: string | null
          data_nascimento: string | null
          dependentes: Json | null
          email_pessoal: string | null
          endereco: string | null
          estado: string | null
          estado_civil: string | null
          id: string
          nacionalidade: string | null
          naturalidade_cidade: string | null
          naturalidade_uf: string | null
          nome: string
          nome_mae: string | null
          nome_pai: string | null
          numero: string | null
          pis_pasep: string | null
          pix: string | null
          recruitment_link_id: string | null
          rg: string | null
          rg_orgao: string | null
          rg_uf: string | null
          saude: Json | null
          setor: string | null
          sexo: string | null
          sobrenome: string | null
          status: string
          telefone_celular: string | null
          tipo_contratacao: string | null
          unidade: string | null
          updated_at: string
        }
        Insert: {
          agencia?: string | null
          bairro?: string | null
          banco?: string | null
          cargo?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          compliance_aceito?: boolean | null
          compliance_ip?: string | null
          compliance_timestamp?: string | null
          compliance_user_agent?: string | null
          conta?: string | null
          conta_tipo?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          data_nascimento?: string | null
          dependentes?: Json | null
          email_pessoal?: string | null
          endereco?: string | null
          estado?: string | null
          estado_civil?: string | null
          id?: string
          nacionalidade?: string | null
          naturalidade_cidade?: string | null
          naturalidade_uf?: string | null
          nome: string
          nome_mae?: string | null
          nome_pai?: string | null
          numero?: string | null
          pis_pasep?: string | null
          pix?: string | null
          recruitment_link_id?: string | null
          rg?: string | null
          rg_orgao?: string | null
          rg_uf?: string | null
          saude?: Json | null
          setor?: string | null
          sexo?: string | null
          sobrenome?: string | null
          status?: string
          telefone_celular?: string | null
          tipo_contratacao?: string | null
          unidade?: string | null
          updated_at?: string
        }
        Update: {
          agencia?: string | null
          bairro?: string | null
          banco?: string | null
          cargo?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          compliance_aceito?: boolean | null
          compliance_ip?: string | null
          compliance_timestamp?: string | null
          compliance_user_agent?: string | null
          conta?: string | null
          conta_tipo?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          data_nascimento?: string | null
          dependentes?: Json | null
          email_pessoal?: string | null
          endereco?: string | null
          estado?: string | null
          estado_civil?: string | null
          id?: string
          nacionalidade?: string | null
          naturalidade_cidade?: string | null
          naturalidade_uf?: string | null
          nome?: string
          nome_mae?: string | null
          nome_pai?: string | null
          numero?: string | null
          pis_pasep?: string | null
          pix?: string | null
          recruitment_link_id?: string | null
          rg?: string | null
          rg_orgao?: string | null
          rg_uf?: string | null
          saude?: Json | null
          setor?: string | null
          sexo?: string | null
          sobrenome?: string | null
          status?: string
          telefone_celular?: string | null
          tipo_contratacao?: string | null
          unidade?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "colaboradores_recruitment_link_id_fkey"
            columns: ["recruitment_link_id"]
            isOneToOne: false
            referencedRelation: "recruitment_links"
            referencedColumns: ["id"]
          },
        ]
      }
      recruitment_links: {
        Row: {
          campos_extras: Json | null
          candidato_email: string
          candidato_nome: string
          cargo: string
          created_at: string
          created_by: string | null
          expira_em: string
          id: string
          status: string
          token: string
          unidade: string
        }
        Insert: {
          campos_extras?: Json | null
          candidato_email: string
          candidato_nome: string
          cargo: string
          created_at?: string
          created_by?: string | null
          expira_em: string
          id?: string
          status?: string
          token: string
          unidade: string
        }
        Update: {
          campos_extras?: Json | null
          candidato_email?: string
          candidato_nome?: string
          cargo?: string
          created_at?: string
          created_by?: string | null
          expira_em?: string
          id?: string
          status?: string
          token?: string
          unidade?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
