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
      agent_actions_log: {
        Row: {
          acao_tomada: string
          created_at: string
          id: string
          job_id: string | null
          resultado: string | null
          tipo_rotina: string
          tokens_usados: number | null
        }
        Insert: {
          acao_tomada: string
          created_at?: string
          id?: string
          job_id?: string | null
          resultado?: string | null
          tipo_rotina?: string
          tokens_usados?: number | null
        }
        Update: {
          acao_tomada?: string
          created_at?: string
          id?: string
          job_id?: string | null
          resultado?: string | null
          tipo_rotina?: string
          tokens_usados?: number | null
        }
        Relationships: []
      }
      agent_conversations: {
        Row: {
          created_at: string | null
          id: string
          messages: Json
          sector: string
          titulo: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          messages?: Json
          sector: string
          titulo?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          messages?: Json
          sector?: string
          titulo?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      automation_rules: {
        Row: {
          acoes: Json
          ativo: boolean
          condicoes: Json
          created_at: string
          criado_por: string | null
          gatilho: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          acoes?: Json
          ativo?: boolean
          condicoes?: Json
          created_at?: string
          criado_por?: string | null
          gatilho: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          acoes?: Json
          ativo?: boolean
          condicoes?: Json
          created_at?: string
          criado_por?: string | null
          gatilho?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
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
          categoria_cnh: string | null
          cbo: string | null
          cbo_descricao: string | null
          cep: string | null
          cidade: string | null
          cnh: string | null
          complemento: string | null
          compliance_aceito: boolean | null
          compliance_hash: string | null
          compliance_ip: string | null
          compliance_timestamp: string | null
          compliance_user_agent: string | null
          compliance_versao: string | null
          conta: string | null
          conta_tipo: string | null
          cor_raca: string | null
          cpf: string | null
          created_at: string
          ctps: string | null
          data_admissao: string | null
          data_nascimento: string | null
          dependentes: Json | null
          documentos_extras: Json | null
          email_pessoal: string | null
          endereco: string | null
          escala: string | null
          escolaridade: string | null
          estado: string | null
          estado_civil: string | null
          horario: string | null
          id: string
          jornada: string | null
          matricula: string | null
          nacionalidade: string | null
          naturalidade_cidade: string | null
          naturalidade_uf: string | null
          nome: string
          nome_mae: string | null
          nome_pai: string | null
          numero: string | null
          passaporte: string | null
          pcd: string | null
          permissoes: Json | null
          pis_pasep: string | null
          pix: string | null
          recruitment_link_id: string | null
          reservista: string | null
          rg: string | null
          rg_orgao: string | null
          rg_uf: string | null
          salario_base: string | null
          saude: Json | null
          secoes_visiveis: string[] | null
          serie_ctps: string | null
          setor: string | null
          sexo: string | null
          sobrenome: string | null
          sst: Json | null
          status: string
          telefone_celular: string | null
          tipo_contratacao: string | null
          titulo_eleitor: string | null
          uf_ctps: string | null
          unidade: string | null
          updated_at: string
          vale_transporte: boolean | null
        }
        Insert: {
          adicionais?: string | null
          agencia?: string | null
          bairro?: string | null
          banco?: string | null
          beneficios?: Json | null
          cargo?: string | null
          categoria_cnh?: string | null
          cbo?: string | null
          cbo_descricao?: string | null
          cep?: string | null
          cidade?: string | null
          cnh?: string | null
          complemento?: string | null
          compliance_aceito?: boolean | null
          compliance_hash?: string | null
          compliance_ip?: string | null
          compliance_timestamp?: string | null
          compliance_user_agent?: string | null
          compliance_versao?: string | null
          conta?: string | null
          conta_tipo?: string | null
          cor_raca?: string | null
          cpf?: string | null
          created_at?: string
          ctps?: string | null
          data_admissao?: string | null
          data_nascimento?: string | null
          dependentes?: Json | null
          documentos_extras?: Json | null
          email_pessoal?: string | null
          endereco?: string | null
          escala?: string | null
          escolaridade?: string | null
          estado?: string | null
          estado_civil?: string | null
          horario?: string | null
          id?: string
          jornada?: string | null
          matricula?: string | null
          nacionalidade?: string | null
          naturalidade_cidade?: string | null
          naturalidade_uf?: string | null
          nome: string
          nome_mae?: string | null
          nome_pai?: string | null
          numero?: string | null
          passaporte?: string | null
          pcd?: string | null
          permissoes?: Json | null
          pis_pasep?: string | null
          pix?: string | null
          recruitment_link_id?: string | null
          reservista?: string | null
          rg?: string | null
          rg_orgao?: string | null
          rg_uf?: string | null
          salario_base?: string | null
          saude?: Json | null
          secoes_visiveis?: string[] | null
          serie_ctps?: string | null
          setor?: string | null
          sexo?: string | null
          sobrenome?: string | null
          sst?: Json | null
          status?: string
          telefone_celular?: string | null
          tipo_contratacao?: string | null
          titulo_eleitor?: string | null
          uf_ctps?: string | null
          unidade?: string | null
          updated_at?: string
          vale_transporte?: boolean | null
        }
        Update: {
          adicionais?: string | null
          agencia?: string | null
          bairro?: string | null
          banco?: string | null
          beneficios?: Json | null
          cargo?: string | null
          categoria_cnh?: string | null
          cbo?: string | null
          cbo_descricao?: string | null
          cep?: string | null
          cidade?: string | null
          cnh?: string | null
          complemento?: string | null
          compliance_aceito?: boolean | null
          compliance_hash?: string | null
          compliance_ip?: string | null
          compliance_timestamp?: string | null
          compliance_user_agent?: string | null
          compliance_versao?: string | null
          conta?: string | null
          conta_tipo?: string | null
          cor_raca?: string | null
          cpf?: string | null
          created_at?: string
          ctps?: string | null
          data_admissao?: string | null
          data_nascimento?: string | null
          dependentes?: Json | null
          documentos_extras?: Json | null
          email_pessoal?: string | null
          endereco?: string | null
          escala?: string | null
          escolaridade?: string | null
          estado?: string | null
          estado_civil?: string | null
          horario?: string | null
          id?: string
          jornada?: string | null
          matricula?: string | null
          nacionalidade?: string | null
          naturalidade_cidade?: string | null
          naturalidade_uf?: string | null
          nome?: string
          nome_mae?: string | null
          nome_pai?: string | null
          numero?: string | null
          passaporte?: string | null
          pcd?: string | null
          permissoes?: Json | null
          pis_pasep?: string | null
          pix?: string | null
          recruitment_link_id?: string | null
          reservista?: string | null
          rg?: string | null
          rg_orgao?: string | null
          rg_uf?: string | null
          salario_base?: string | null
          saude?: Json | null
          secoes_visiveis?: string[] | null
          serie_ctps?: string | null
          setor?: string | null
          sexo?: string | null
          sobrenome?: string | null
          sst?: Json | null
          status?: string
          telefone_celular?: string | null
          tipo_contratacao?: string | null
          titulo_eleitor?: string | null
          uf_ctps?: string | null
          unidade?: string | null
          updated_at?: string
          vale_transporte?: boolean | null
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
      cs_oportunidades: {
        Row: {
          context: string | null
          created_at: string
          created_by: string | null
          customer_id: number | null
          customer_name: string
          description: string
          estimated_value: number | null
          health_score: number | null
          id: string
          next_step: string | null
          related_job_code: number | null
          responsible_name: string
          status: string
          timing: string | null
          type: string
          unidade: string | null
          updated_at: string
        }
        Insert: {
          context?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: number | null
          customer_name: string
          description?: string
          estimated_value?: number | null
          health_score?: number | null
          id?: string
          next_step?: string | null
          related_job_code?: number | null
          responsible_name?: string
          status?: string
          timing?: string | null
          type?: string
          unidade?: string | null
          updated_at?: string
        }
        Update: {
          context?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: number | null
          customer_name?: string
          description?: string
          estimated_value?: number | null
          health_score?: number | null
          id?: string
          next_step?: string | null
          related_job_code?: number | null
          responsible_name?: string
          status?: string
          timing?: string | null
          type?: string
          unidade?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cs_tickets: {
        Row: {
          category: string
          code: string
          created_at: string
          created_by: string | null
          customer_id: number | null
          customer_name: string
          date: string
          description: string
          escalation_history: Json | null
          escalation_level: string | null
          id: string
          job_code: number | null
          job_title: string | null
          priority: string
          resolution: string | null
          resolved_date: string | null
          responsible_name: string
          sla_resolution_actual: string | null
          sla_resolution_breached: boolean | null
          sla_resolution_deadline: string | null
          sla_response_actual: string | null
          sla_response_breached: boolean | null
          sla_response_deadline: string | null
          status: string
          survey_completed_at: string | null
          survey_feedback: string | null
          survey_rating: number | null
          survey_token: string | null
          survey_would_recommend: boolean | null
          unidade: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          code?: string
          created_at?: string
          created_by?: string | null
          customer_id?: number | null
          customer_name: string
          date?: string
          description: string
          escalation_history?: Json | null
          escalation_level?: string | null
          id?: string
          job_code?: number | null
          job_title?: string | null
          priority?: string
          resolution?: string | null
          resolved_date?: string | null
          responsible_name?: string
          sla_resolution_actual?: string | null
          sla_resolution_breached?: boolean | null
          sla_resolution_deadline?: string | null
          sla_response_actual?: string | null
          sla_response_breached?: boolean | null
          sla_response_deadline?: string | null
          status?: string
          survey_completed_at?: string | null
          survey_feedback?: string | null
          survey_rating?: number | null
          survey_token?: string | null
          survey_would_recommend?: boolean | null
          unidade?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          created_by?: string | null
          customer_id?: number | null
          customer_name?: string
          date?: string
          description?: string
          escalation_history?: Json | null
          escalation_level?: string | null
          id?: string
          job_code?: number | null
          job_title?: string | null
          priority?: string
          resolution?: string | null
          resolved_date?: string | null
          responsible_name?: string
          sla_resolution_actual?: string | null
          sla_resolution_breached?: boolean | null
          sla_resolution_deadline?: string | null
          sla_response_actual?: string | null
          sla_response_breached?: boolean | null
          sla_response_deadline?: string | null
          status?: string
          survey_completed_at?: string | null
          survey_feedback?: string | null
          survey_rating?: number | null
          survey_token?: string | null
          survey_would_recommend?: boolean | null
          unidade?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cs_touchpoints: {
        Row: {
          channel: string
          created_at: string
          created_by: string | null
          customer_id: number | null
          customer_name: string
          date: string
          id: string
          notes: string | null
          responsible_name: string
          status: string
          trigger_reason: string | null
          type: string
          unidade: string | null
          updated_at: string
        }
        Insert: {
          channel?: string
          created_at?: string
          created_by?: string | null
          customer_id?: number | null
          customer_name: string
          date: string
          id?: string
          notes?: string | null
          responsible_name?: string
          status?: string
          trigger_reason?: string | null
          type?: string
          unidade?: string | null
          updated_at?: string
        }
        Update: {
          channel?: string
          created_at?: string
          created_by?: string | null
          customer_id?: number | null
          customer_name?: string
          date?: string
          id?: string
          notes?: string | null
          responsible_name?: string
          status?: string
          trigger_reason?: string | null
          type?: string
          unidade?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cs_visitas: {
        Row: {
          code: string
          complaint_id: string | null
          created_at: string
          created_by: string | null
          customer_address: string | null
          customer_id: number | null
          customer_name: string
          description: string
          duration_minutes: number | null
          id: string
          job_code: number | null
          report_notes: string | null
          report_status: string | null
          scheduled_date: string
          status: string
          technician_name: string
          type: string
          unidade: string | null
          updated_at: string
        }
        Insert: {
          code?: string
          complaint_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_address?: string | null
          customer_id?: number | null
          customer_name: string
          description?: string
          duration_minutes?: number | null
          id?: string
          job_code?: number | null
          report_notes?: string | null
          report_status?: string | null
          scheduled_date: string
          status?: string
          technician_name?: string
          type?: string
          unidade?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          complaint_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_address?: string | null
          customer_id?: number | null
          customer_name?: string
          description?: string
          duration_minutes?: number | null
          id?: string
          job_code?: number | null
          report_notes?: string | null
          report_status?: string | null
          scheduled_date?: string
          status?: string
          technician_name?: string
          type?: string
          unidade?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      gateway_users: {
        Row: {
          created_at: string
          department: string | null
          email: string
          id: string
          is_active: boolean
          last_login_at: string | null
          name: string
          password_hash: string
          permissions: Json
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          email: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          name: string
          password_hash: string
          permissions?: Json
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          name?: string
          password_hash?: string
          permissions?: Json
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      holdprint_cache: {
        Row: {
          content_text: string | null
          embedding: string | null
          endpoint: string
          id: string
          last_synced: string | null
          raw_data: Json
          record_id: string
        }
        Insert: {
          content_text?: string | null
          embedding?: string | null
          endpoint: string
          id?: string
          last_synced?: string | null
          raw_data: Json
          record_id: string
        }
        Update: {
          content_text?: string | null
          embedding?: string | null
          endpoint?: string
          id?: string
          last_synced?: string | null
          raw_data?: Json
          record_id?: string
        }
        Relationships: []
      }
      holdprint_sync_log: {
        Row: {
          details: Json | null
          endpoints_synced: string[] | null
          errors: string[] | null
          finished_at: string | null
          id: string
          inserted: number | null
          started_at: string
          status: string
          total_records: number | null
          trigger_type: string
          updated: number | null
        }
        Insert: {
          details?: Json | null
          endpoints_synced?: string[] | null
          errors?: string[] | null
          finished_at?: string | null
          id?: string
          inserted?: number | null
          started_at?: string
          status?: string
          total_records?: number | null
          trigger_type?: string
          updated?: number | null
        }
        Update: {
          details?: Json | null
          endpoints_synced?: string[] | null
          errors?: string[] | null
          finished_at?: string | null
          id?: string
          inserted?: number | null
          started_at?: string
          status?: string
          total_records?: number | null
          trigger_type?: string
          updated?: number | null
        }
        Relationships: []
      }
      improvement_suggestions: {
        Row: {
          acao_sugerida: string | null
          assigned_to: string | null
          contexto: string | null
          created_at: string | null
          created_by: string | null
          dados_base: string[] | null
          id: string
          kpi_meta: string | null
          prioridade: string
          setor_destino: string
          status: string
          tipo: string
          titulo: string
          updated_at: string | null
        }
        Insert: {
          acao_sugerida?: string | null
          assigned_to?: string | null
          contexto?: string | null
          created_at?: string | null
          created_by?: string | null
          dados_base?: string[] | null
          id?: string
          kpi_meta?: string | null
          prioridade?: string
          setor_destino: string
          status?: string
          tipo?: string
          titulo: string
          updated_at?: string | null
        }
        Update: {
          acao_sugerida?: string | null
          assigned_to?: string | null
          contexto?: string | null
          created_at?: string | null
          created_by?: string | null
          dados_base?: string[] | null
          id?: string
          kpi_meta?: string | null
          prioridade?: string
          setor_destino?: string
          status?: string
          tipo?: string
          titulo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      job_archives: {
        Row: {
          archived_at: string
          archived_by: string | null
          customer_name: string | null
          id: string
          job_code: number | null
          job_id: string
          job_title: string | null
          reason: string | null
        }
        Insert: {
          archived_at?: string
          archived_by?: string | null
          customer_name?: string | null
          id?: string
          job_code?: number | null
          job_id: string
          job_title?: string | null
          reason?: string | null
        }
        Update: {
          archived_at?: string
          archived_by?: string | null
          customer_name?: string | null
          id?: string
          job_code?: number | null
          job_id?: string
          job_title?: string | null
          reason?: string | null
        }
        Relationships: []
      }
      job_board_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          board_id: string
          board_name: string
          customer_name: string | null
          id: string
          is_active: boolean
          item_id: string | null
          item_name: string | null
          job_code: number | null
          job_id: string
          job_title: string | null
          stage_id: string | null
          stage_name: string | null
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          board_id: string
          board_name: string
          customer_name?: string | null
          id?: string
          is_active?: boolean
          item_id?: string | null
          item_name?: string | null
          job_code?: number | null
          job_id: string
          job_title?: string | null
          stage_id?: string | null
          stage_name?: string | null
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          board_id?: string
          board_name?: string
          customer_name?: string | null
          id?: string
          is_active?: boolean
          item_id?: string | null
          item_name?: string | null
          job_code?: number | null
          job_id?: string
          job_title?: string | null
          stage_id?: string | null
          stage_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_board_assignments_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "job_items"
            referencedColumns: ["id"]
          },
        ]
      }
      job_checklist: {
        Row: {
          checked: boolean
          created_at: string
          id: string
          job_id: string
          responsible_name: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          checked?: boolean
          created_at?: string
          id?: string
          job_id: string
          responsible_name?: string | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          checked?: boolean
          created_at?: string
          id?: string
          job_id?: string
          responsible_name?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_comments: {
        Row: {
          anexos: Json | null
          autor_nome: string
          autor_tipo: string
          created_at: string
          editado: boolean | null
          editado_em: string | null
          holdprint_job_id: string
          id: string
          mencoes: string[] | null
          mensagem: string
        }
        Insert: {
          anexos?: Json | null
          autor_nome?: string
          autor_tipo?: string
          created_at?: string
          editado?: boolean | null
          editado_em?: string | null
          holdprint_job_id: string
          id?: string
          mencoes?: string[] | null
          mensagem: string
        }
        Update: {
          anexos?: Json | null
          autor_nome?: string
          autor_tipo?: string
          created_at?: string
          editado?: boolean | null
          editado_em?: string | null
          holdprint_job_id?: string
          id?: string
          mencoes?: string[] | null
          mensagem?: string
        }
        Relationships: []
      }
      job_extensions: {
        Row: {
          arquivado_em: string | null
          arquivado_localmente: boolean | null
          arquivado_por: string | null
          created_at: string
          data_entrega: string | null
          data_inicio: string | null
          holdprint_job_id: string
          id: string
          lembrete: string | null
          notas_internas: string | null
          prioridade: string
          recorrente: string | null
          tags: string[] | null
          times_envolvidos: string[] | null
          updated_at: string
        }
        Insert: {
          arquivado_em?: string | null
          arquivado_localmente?: boolean | null
          arquivado_por?: string | null
          created_at?: string
          data_entrega?: string | null
          data_inicio?: string | null
          holdprint_job_id: string
          id?: string
          lembrete?: string | null
          notas_internas?: string | null
          prioridade?: string
          recorrente?: string | null
          tags?: string[] | null
          times_envolvidos?: string[] | null
          updated_at?: string
        }
        Update: {
          arquivado_em?: string | null
          arquivado_localmente?: boolean | null
          arquivado_por?: string | null
          created_at?: string
          data_entrega?: string | null
          data_inicio?: string | null
          holdprint_job_id?: string
          id?: string
          lembrete?: string | null
          notas_internas?: string | null
          prioridade?: string
          recorrente?: string | null
          tags?: string[] | null
          times_envolvidos?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      job_files: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          job_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          job_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          job_id?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      job_history: {
        Row: {
          content: string | null
          created_at: string
          event_type: string
          id: string
          job_id: string
          metadata: Json | null
          user_name: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          event_type?: string
          id?: string
          job_id: string
          metadata?: Json | null
          user_name?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          event_type?: string
          id?: string
          job_id?: string
          metadata?: Json | null
          user_name?: string
        }
        Relationships: []
      }
      job_item_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          collaborator_name: string
          created_at: string
          deadline: string | null
          id: string
          is_active: boolean
          item_id: string | null
          item_name: string
          job_id: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          collaborator_name: string
          created_at?: string
          deadline?: string | null
          id?: string
          is_active?: boolean
          item_id?: string | null
          item_name: string
          job_id: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          collaborator_name?: string
          created_at?: string
          deadline?: string | null
          id?: string
          is_active?: boolean
          item_id?: string | null
          item_name?: string
          job_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_item_assignments_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "job_items"
            referencedColumns: ["id"]
          },
        ]
      }
      job_items: {
        Row: {
          checked: boolean
          created_at: string
          created_by: string | null
          flexfields: Json | null
          format: string | null
          id: string
          job_id: string
          name: string
          observation: string | null
          quantity: number
          total_value: number
          unit: string
          unit_value: number
          updated_at: string
        }
        Insert: {
          checked?: boolean
          created_at?: string
          created_by?: string | null
          flexfields?: Json | null
          format?: string | null
          id?: string
          job_id: string
          name: string
          observation?: string | null
          quantity?: number
          total_value?: number
          unit?: string
          unit_value?: number
          updated_at?: string
        }
        Update: {
          checked?: boolean
          created_at?: string
          created_by?: string | null
          flexfields?: Json | null
          format?: string | null
          id?: string
          job_id?: string
          name?: string
          observation?: string | null
          quantity?: number
          total_value?: number
          unit?: string
          unit_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      job_links: {
        Row: {
          created_at: string
          display_text: string | null
          id: string
          job_id: string
          url: string
        }
        Insert: {
          created_at?: string
          display_text?: string | null
          id?: string
          job_id: string
          url: string
        }
        Update: {
          created_at?: string
          display_text?: string | null
          id?: string
          job_id?: string
          url?: string
        }
        Relationships: []
      }
      job_materials: {
        Row: {
          created_at: string
          id: string
          job_id: string
          name: string
          observation: string | null
          quantity: number
          supplier: string | null
          total_cost: number
          unit: string
          unit_cost: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          name: string
          observation?: string | null
          quantity?: number
          supplier?: string | null
          total_cost?: number
          unit?: string
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          name?: string
          observation?: string | null
          quantity?: number
          supplier?: string | null
          total_cost?: number
          unit?: string
          unit_cost?: number
          updated_at?: string
        }
        Relationships: []
      }
      job_production_flows: {
        Row: {
          created_at: string
          duration_minutes: number
          finished_at: string | null
          id: string
          job_id: string
          name: string
          responsible_name: string | null
          sort_order: number
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          finished_at?: string | null
          id?: string
          job_id: string
          name: string
          responsible_name?: string | null
          sort_order?: number
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          finished_at?: string | null
          id?: string
          job_id?: string
          name?: string
          responsible_name?: string | null
          sort_order?: number
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_stage_movements: {
        Row: {
          board_id: string
          board_name: string
          created_at: string
          customer_name: string | null
          from_stage_id: string | null
          from_stage_name: string | null
          id: string
          job_code: number | null
          job_id: string
          job_title: string | null
          metadata: Json | null
          moved_by: string | null
          movement_type: string
          to_stage_id: string
          to_stage_name: string
        }
        Insert: {
          board_id: string
          board_name: string
          created_at?: string
          customer_name?: string | null
          from_stage_id?: string | null
          from_stage_name?: string | null
          id?: string
          job_code?: number | null
          job_id: string
          job_title?: string | null
          metadata?: Json | null
          moved_by?: string | null
          movement_type?: string
          to_stage_id: string
          to_stage_name: string
        }
        Update: {
          board_id?: string
          board_name?: string
          created_at?: string
          customer_name?: string | null
          from_stage_id?: string | null
          from_stage_name?: string | null
          id?: string
          job_code?: number | null
          job_id?: string
          job_title?: string | null
          metadata?: Json | null
          moved_by?: string | null
          movement_type?: string
          to_stage_id?: string
          to_stage_name?: string
        }
        Relationships: []
      }
      job_tasks: {
        Row: {
          concluido_em: string | null
          created_at: string
          descricao: string | null
          id: string
          job_id: string
          parent_task_id: string | null
          prazo: string | null
          prioridade: string
          responsavel_id: string | null
          status: string
          template_origem: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          concluido_em?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          job_id: string
          parent_task_id?: string | null
          prazo?: string | null
          prioridade?: string
          responsavel_id?: string | null
          status?: string
          template_origem?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          concluido_em?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          job_id?: string
          parent_task_id?: string | null
          prazo?: string | null
          prioridade?: string
          responsavel_id?: string | null
          status?: string
          template_origem?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "job_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      job_time_entries: {
        Row: {
          created_at: string
          description: string | null
          entry_date: string
          id: string
          job_id: string
          minutes: number
          user_name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          entry_date?: string
          id?: string
          job_id: string
          minutes?: number
          user_name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          entry_date?: string
          id?: string
          job_id?: string
          minutes?: number
          user_name?: string
        }
        Relationships: []
      }
      jobs_cache: {
        Row: {
          created_at: string | null
          data: Json
          holdprint_id: string
          id: string
          job_number: string
          last_synced: string | null
          previous_stage: string | null
          stage: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json
          holdprint_id: string
          id?: string
          job_number: string
          last_synced?: string | null
          previous_stage?: string | null
          stage?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json
          holdprint_id?: string
          id?: string
          job_number?: string
          last_synced?: string | null
          previous_stage?: string | null
          stage?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      kanban_boards: {
        Row: {
          active: boolean
          board_type: string
          color: string
          created_at: string
          created_by: string | null
          flexfields: Json
          id: string
          linked_stage_id: string | null
          members: Json
          name: string
          parent_board_id: string | null
          stages: Json
          updated_at: string
        }
        Insert: {
          active?: boolean
          board_type?: string
          color?: string
          created_at?: string
          created_by?: string | null
          flexfields?: Json
          id: string
          linked_stage_id?: string | null
          members?: Json
          name: string
          parent_board_id?: string | null
          stages?: Json
          updated_at?: string
        }
        Update: {
          active?: boolean
          board_type?: string
          color?: string
          created_at?: string
          created_by?: string | null
          flexfields?: Json
          id?: string
          linked_stage_id?: string | null
          members?: Json
          name?: string
          parent_board_id?: string | null
          stages?: Json
          updated_at?: string
        }
        Relationships: []
      }
      micro_board_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          completed_at: string | null
          customer_name: string | null
          id: string
          job_code: number | null
          job_id: string
          job_title: string | null
          micro_board_id: string
          micro_stage_id: string | null
          micro_stage_name: string | null
          notified_at: string | null
          parent_board_id: string
          parent_stage_id: string | null
          parent_stage_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          completed_at?: string | null
          customer_name?: string | null
          id?: string
          job_code?: number | null
          job_id: string
          job_title?: string | null
          micro_board_id: string
          micro_stage_id?: string | null
          micro_stage_name?: string | null
          notified_at?: string | null
          parent_board_id: string
          parent_stage_id?: string | null
          parent_stage_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          completed_at?: string | null
          customer_name?: string | null
          id?: string
          job_code?: number | null
          job_id?: string
          job_title?: string | null
          micro_board_id?: string
          micro_stage_id?: string | null
          micro_stage_name?: string | null
          notified_at?: string | null
          parent_board_id?: string
          parent_stage_id?: string | null
          parent_stage_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          destinatario_id: string
          id: string
          job_id: string | null
          lida: boolean
          mensagem: string
          prioridade: string
          remetente_tipo: string
        }
        Insert: {
          created_at?: string
          destinatario_id: string
          id?: string
          job_id?: string | null
          lida?: boolean
          mensagem: string
          prioridade?: string
          remetente_tipo?: string
        }
        Update: {
          created_at?: string
          destinatario_id?: string
          id?: string
          job_id?: string | null
          lida?: boolean
          mensagem?: string
          prioridade?: string
          remetente_tipo?: string
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
      production_flow_templates: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          steps: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          steps?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          steps?: Json
          updated_at?: string
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
      rag_documents: {
        Row: {
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json
          original_filename: string | null
          sector: string
          source_type: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json
          original_filename?: string | null
          sector: string
          source_type: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json
          original_filename?: string | null
          sector?: string
          source_type?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      rag_files: {
        Row: {
          chunk_count: number | null
          created_at: string | null
          file_size: number | null
          file_type: string
          file_url: string
          filename: string
          id: string
          processed: boolean | null
          sector: string
          tags: string[] | null
          uploaded_by: string | null
        }
        Insert: {
          chunk_count?: number | null
          created_at?: string | null
          file_size?: number | null
          file_type: string
          file_url: string
          filename: string
          id?: string
          processed?: boolean | null
          sector: string
          tags?: string[] | null
          uploaded_by?: string | null
        }
        Update: {
          chunk_count?: number | null
          created_at?: string | null
          file_size?: number | null
          file_type?: string
          file_url?: string
          filename?: string
          id?: string
          processed?: boolean | null
          sector?: string
          tags?: string[] | null
          uploaded_by?: string | null
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
      team_pipeline_status: {
        Row: {
          concluido_em: string | null
          created_at: string
          etapa: string
          holdprint_item_id: string
          holdprint_job_id: string
          id: string
          iniciado_em: string | null
          pendencia_descricao: string | null
          responsavel_nome: string | null
          sub_status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          concluido_em?: string | null
          created_at?: string
          etapa: string
          holdprint_item_id: string
          holdprint_job_id: string
          id?: string
          iniciado_em?: string | null
          pendencia_descricao?: string | null
          responsavel_nome?: string | null
          sub_status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          concluido_em?: string | null
          created_at?: string
          etapa?: string
          holdprint_item_id?: string
          holdprint_job_id?: string
          id?: string
          iniciado_em?: string | null
          pendencia_descricao?: string | null
          responsavel_nome?: string | null
          sub_status?: string
          updated_at?: string
          updated_by?: string | null
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
      vagas_internas: {
        Row: {
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          requisitos: string | null
          setor: string
          status: string
          tipo: string
          titulo: string
          unidade: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          requisitos?: string | null
          setor: string
          status?: string
          tipo?: string
          titulo: string
          unidade?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          requisitos?: string | null
          setor?: string
          status?: string
          tipo?: string
          titulo?: string
          unidade?: string
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_logs: {
        Row: {
          created_at: string | null
          customer_id: number | null
          customer_name: string | null
          delivered_at: string | null
          direction: string
          error_message: string | null
          evolution_message_id: string | null
          id: string
          message: string
          origin: string | null
          origin_id: string | null
          phone: string
          read_at: string | null
          sent_at: string | null
          sent_by: string | null
          status: string | null
          unidade: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: number | null
          customer_name?: string | null
          delivered_at?: string | null
          direction?: string
          error_message?: string | null
          evolution_message_id?: string | null
          id?: string
          message: string
          origin?: string | null
          origin_id?: string | null
          phone: string
          read_at?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
          unidade?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: number | null
          customer_name?: string | null
          delivered_at?: string | null
          direction?: string
          error_message?: string | null
          evolution_message_id?: string | null
          id?: string
          message?: string
          origin?: string | null
          origin_id?: string | null
          phone?: string
          read_at?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
          unidade?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      gateway_users_safe: {
        Row: {
          created_at: string | null
          department: string | null
          email: string | null
          id: string | null
          is_active: boolean | null
          last_login_at: string | null
          name: string | null
          permissions: Json | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email?: string | null
          id?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          name?: string | null
          permissions?: Json | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string | null
          id?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          name?: string | null
          permissions?: Json | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      search_rag: {
        Args: {
          filter_sector?: string
          filter_source?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          sector: string
          similarity: number
        }[]
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
