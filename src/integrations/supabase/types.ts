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
      banco_horas: {
        Row: {
          b_cred: string | null
          b_deb: string | null
          b_saldo: string | null
          b_total: string | null
          carga: string | null
          cargo: string | null
          competencia: string
          created_at: string
          departamento: string | null
          email: string | null
          ex100: string | null
          ex60: string | null
          ex80: string | null
          faltas: string | null
          id: string
          imported_at: string
          imported_by: string | null
          nome: string
          normais: string | null
          pis: string
          raw_data: Json | null
          saldo_decimal: number | null
          unidade: string | null
          updated_at: string
        }
        Insert: {
          b_cred?: string | null
          b_deb?: string | null
          b_saldo?: string | null
          b_total?: string | null
          carga?: string | null
          cargo?: string | null
          competencia: string
          created_at?: string
          departamento?: string | null
          email?: string | null
          ex100?: string | null
          ex60?: string | null
          ex80?: string | null
          faltas?: string | null
          id?: string
          imported_at?: string
          imported_by?: string | null
          nome: string
          normais?: string | null
          pis: string
          raw_data?: Json | null
          saldo_decimal?: number | null
          unidade?: string | null
          updated_at?: string
        }
        Update: {
          b_cred?: string | null
          b_deb?: string | null
          b_saldo?: string | null
          b_total?: string | null
          carga?: string | null
          cargo?: string | null
          competencia?: string
          created_at?: string
          departamento?: string | null
          email?: string | null
          ex100?: string | null
          ex60?: string | null
          ex80?: string | null
          faltas?: string | null
          id?: string
          imported_at?: string
          imported_by?: string | null
          nome?: string
          normais?: string | null
          pis?: string
          raw_data?: Json | null
          saldo_decimal?: number | null
          unidade?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cartazes_endomarketing: {
        Row: {
          created_at: string
          created_by: string | null
          detalhes: string | null
          id: string
          image_url: string | null
          spec: Json
          tema: string
          titulo: string
          tom: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          detalhes?: string | null
          id?: string
          image_url?: string | null
          spec?: Json
          tema: string
          titulo: string
          tom?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          detalhes?: string | null
          id?: string
          image_url?: string | null
          spec?: Json
          tema?: string
          titulo?: string
          tom?: string
          updated_at?: string
        }
        Relationships: []
      }
      colaboradores: {
        Row: {
          adicionais: string | null
          agencia: string | null
          bairro: string | null
          banco: string | null
          beneficios: Json | null
          cargo: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          compliance_aceito: boolean | null
          compliance_hash: string | null
          compliance_ip: string | null
          compliance_timestamp: string | null
          compliance_user_agent: string | null
          compliance_versao: string | null
          conta: string | null
          conta_tipo: string | null
          cpf: string | null
          created_at: string
          data_admissao: string | null
          data_nascimento: string | null
          dependentes: Json | null
          documentos_extras: Json | null
          email_pessoal: string | null
          endereco: string | null
          escala: string | null
          estado: string | null
          estado_civil: string | null
          horario: string | null
          id: string
          jornada: string | null
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
          salario_base: string | null
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
          adicionais?: string | null
          agencia?: string | null
          bairro?: string | null
          banco?: string | null
          beneficios?: Json | null
          cargo?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          compliance_aceito?: boolean | null
          compliance_hash?: string | null
          compliance_ip?: string | null
          compliance_timestamp?: string | null
          compliance_user_agent?: string | null
          compliance_versao?: string | null
          conta?: string | null
          conta_tipo?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          data_nascimento?: string | null
          dependentes?: Json | null
          documentos_extras?: Json | null
          email_pessoal?: string | null
          endereco?: string | null
          escala?: string | null
          estado?: string | null
          estado_civil?: string | null
          horario?: string | null
          id?: string
          jornada?: string | null
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
          salario_base?: string | null
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
          adicionais?: string | null
          agencia?: string | null
          bairro?: string | null
          banco?: string | null
          beneficios?: Json | null
          cargo?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          compliance_aceito?: boolean | null
          compliance_hash?: string | null
          compliance_ip?: string | null
          compliance_timestamp?: string | null
          compliance_user_agent?: string | null
          compliance_versao?: string | null
          conta?: string | null
          conta_tipo?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          data_nascimento?: string | null
          dependentes?: Json | null
          documentos_extras?: Json | null
          email_pessoal?: string | null
          endereco?: string | null
          escala?: string | null
          estado?: string | null
          estado_civil?: string | null
          horario?: string | null
          id?: string
          jornada?: string | null
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
          salario_base?: string | null
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
      comunicado_comentarios: {
        Row: {
          autor_nome: string
          comunicado_id: string
          conteudo: string
          created_at: string
          id: string
          moderado: boolean
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          autor_nome?: string
          comunicado_id: string
          conteudo: string
          created_at?: string
          id?: string
          moderado?: boolean
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          autor_nome?: string
          comunicado_id?: string
          conteudo?: string
          created_at?: string
          id?: string
          moderado?: boolean
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comunicado_comentarios_comunicado_id_fkey"
            columns: ["comunicado_id"]
            isOneToOne: false
            referencedRelation: "comunicados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunicado_comentarios_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comunicado_comentarios"
            referencedColumns: ["id"]
          },
        ]
      }
      comunicado_likes: {
        Row: {
          comunicado_id: string
          created_at: string
          id: string
          tipo: string
          user_id: string
        }
        Insert: {
          comunicado_id: string
          created_at?: string
          id?: string
          tipo: string
          user_id: string
        }
        Update: {
          comunicado_id?: string
          created_at?: string
          id?: string
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comunicado_likes_comunicado_id_fkey"
            columns: ["comunicado_id"]
            isOneToOne: false
            referencedRelation: "comunicados"
            referencedColumns: ["id"]
          },
        ]
      }
      comunicados: {
        Row: {
          categoria: string
          comentarios_count: number
          conteudo: string | null
          created_at: string
          created_by: string | null
          dislikes_count: number
          fixado: boolean
          id: string
          image_url: string | null
          likes_count: number
          status: string
          titulo: string
          unidade: string
          updated_at: string
        }
        Insert: {
          categoria?: string
          comentarios_count?: number
          conteudo?: string | null
          created_at?: string
          created_by?: string | null
          dislikes_count?: number
          fixado?: boolean
          id?: string
          image_url?: string | null
          likes_count?: number
          status?: string
          titulo: string
          unidade?: string
          updated_at?: string
        }
        Update: {
          categoria?: string
          comentarios_count?: number
          conteudo?: string | null
          created_at?: string
          created_by?: string | null
          dislikes_count?: number
          fixado?: boolean
          id?: string
          image_url?: string | null
          likes_count?: number
          status?: string
          titulo?: string
          unidade?: string
          updated_at?: string
        }
        Relationships: []
      }
      onboarding_conversas: {
        Row: {
          cargo: string | null
          created_at: string
          id: string
          mensagens: Json
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cargo?: string | null
          created_at?: string
          id?: string
          mensagens?: Json
          titulo?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cargo?: string | null
          created_at?: string
          id?: string
          mensagens?: Json
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_etapas: {
        Row: {
          conteudo_url: string | null
          created_at: string
          descricao: string | null
          id: string
          obrigatoria: boolean
          ordem: number
          tipo: string
          titulo: string
          trilha_id: string
          updated_at: string
        }
        Insert: {
          conteudo_url?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          obrigatoria?: boolean
          ordem?: number
          tipo?: string
          titulo: string
          trilha_id: string
          updated_at?: string
        }
        Update: {
          conteudo_url?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          obrigatoria?: boolean
          ordem?: number
          tipo?: string
          titulo?: string
          trilha_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_etapas_trilha_id_fkey"
            columns: ["trilha_id"]
            isOneToOne: false
            referencedRelation: "onboarding_trilhas"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_progresso: {
        Row: {
          concluida: boolean
          concluida_em: string | null
          created_at: string
          etapa_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          concluida?: boolean
          concluida_em?: string | null
          created_at?: string
          etapa_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          concluida?: boolean
          concluida_em?: string | null
          created_at?: string
          etapa_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_progresso_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "onboarding_etapas"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_trilhas: {
        Row: {
          ativo: boolean
          cargo: string
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          nome: string
          unidade: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cargo: string
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome: string
          unidade?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cargo?: string
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          unidade?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ouvidoria_manifestacoes: {
        Row: {
          anonimo: boolean
          categoria: string
          created_at: string
          descricao: string
          email: string | null
          id: string
          nome: string | null
          protocolo: string
          setor: string
          setor_identificacao: string | null
          status: string
          unidade: string
          unidade_identificacao: string | null
          updated_at: string
          urgencia: string
          user_id: string | null
        }
        Insert: {
          anonimo?: boolean
          categoria: string
          created_at?: string
          descricao: string
          email?: string | null
          id?: string
          nome?: string | null
          protocolo: string
          setor: string
          setor_identificacao?: string | null
          status?: string
          unidade: string
          unidade_identificacao?: string | null
          updated_at?: string
          urgencia: string
          user_id?: string | null
        }
        Update: {
          anonimo?: boolean
          categoria?: string
          created_at?: string
          descricao?: string
          email?: string | null
          id?: string
          nome?: string | null
          protocolo?: string
          setor?: string
          setor_identificacao?: string | null
          status?: string
          unidade?: string
          unidade_identificacao?: string | null
          updated_at?: string
          urgencia?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recruitment_links: {
        Row: {
          adicionais: string | null
          campos_extras: Json | null
          candidato_email: string
          candidato_nome: string
          cargo: string
          created_at: string
          created_by: string | null
          data_admissao: string | null
          escala: string | null
          expira_em: string
          horario: string | null
          id: string
          jornada: string | null
          salario_base: string | null
          setor: string | null
          status: string
          tipo_contratacao: string | null
          token: string
          unidade: string
        }
        Insert: {
          adicionais?: string | null
          campos_extras?: Json | null
          candidato_email: string
          candidato_nome: string
          cargo: string
          created_at?: string
          created_by?: string | null
          data_admissao?: string | null
          escala?: string | null
          expira_em: string
          horario?: string | null
          id?: string
          jornada?: string | null
          salario_base?: string | null
          setor?: string | null
          status?: string
          tipo_contratacao?: string | null
          token: string
          unidade: string
        }
        Update: {
          adicionais?: string | null
          campos_extras?: Json | null
          candidato_email?: string
          candidato_nome?: string
          cargo?: string
          created_at?: string
          created_by?: string | null
          data_admissao?: string | null
          escala?: string | null
          expira_em?: string
          horario?: string | null
          id?: string
          jornada?: string | null
          salario_base?: string | null
          setor?: string | null
          status?: string
          tipo_contratacao?: string | null
          token?: string
          unidade?: string
        }
        Relationships: []
      }
      secullum_cache: {
        Row: {
          cache_key: string
          created_at: string
          data: Json
          expires_at: string
          id: string
        }
        Insert: {
          cache_key: string
          created_at?: string
          data: Json
          expires_at: string
          id?: string
        }
        Update: {
          cache_key?: string
          created_at?: string
          data?: Json
          expires_at?: string
          id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "rh" | "colaborador" | "gestor"
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
      app_role: ["admin", "user", "rh", "colaborador", "gestor"],
    },
  },
} as const
