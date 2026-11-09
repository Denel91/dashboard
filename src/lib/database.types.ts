
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "budget_categorie": {
                  Row: {
                    "categoria_id": string,"data_creazione": string,"id": string,"importo_centesimi": number | null,"nucleo_id": string,"valido_dal": string
                  }
                  ComputedFields: never
                  Insert: {
                    "categoria_id": string,"data_creazione"?: string,"id"?: string,"importo_centesimi"?: number | null,"nucleo_id": string,"valido_dal": string
                  }
                  Update: {
                    "categoria_id"?: string,"data_creazione"?: string,"id"?: string,"importo_centesimi"?: number | null,"nucleo_id"?: string,"valido_dal"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "budget_categorie_nucleo_id_categoria_id_fkey"
      columns: ["nucleo_id","categoria_id"]
isOneToOne: false
      referencedRelation: "categorie"
      referencedColumns: ["nucleo_id","id"]
    }
                  ]
                },"categorie": {
                  Row: {
                    "colore": string,"data_archiviazione": string | null,"icona": string,"id": string,"nome": string,"nucleo_id": string,"ordine": number
                  }
                  ComputedFields: never
                  Insert: {
                    "colore"?: string,"data_archiviazione"?: string | null,"icona"?: string,"id"?: string,"nome": string,"nucleo_id": string,"ordine"?: number
                  }
                  Update: {
                    "colore"?: string,"data_archiviazione"?: string | null,"icona"?: string,"id"?: string,"nome"?: string,"nucleo_id"?: string,"ordine"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "categorie_nucleo_id_fkey"
      columns: ["nucleo_id"]
isOneToOne: false
      referencedRelation: "nuclei"
      referencedColumns: ["id"]
    }
                  ]
                },"cronologia": {
                  Row: {
                    "autore": string | null,"azione": string,"data_azione": string,"id": number,"nucleo_id": string,"riga_id": string,"tabella": string,"valori_dopo": Json | null,"valori_prima": Json | null
                  }
                  ComputedFields: never
                  Insert: {
                    "autore"?: string | null,"azione": string,"data_azione"?: string,"id"?: never,"nucleo_id": string,"riga_id": string,"tabella": string,"valori_dopo"?: Json | null,"valori_prima"?: Json | null
                  }
                  Update: {
                    "autore"?: string | null,"azione"?: string,"data_azione"?: string,"id"?: never,"nucleo_id"?: string,"riga_id"?: string,"tabella"?: string,"valori_dopo"?: Json | null,"valori_prima"?: Json | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "cronologia_autore_fkey"
      columns: ["autore"]
isOneToOne: false
      referencedRelation: "membri"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cronologia_autore_fkey"
      columns: ["autore"]
isOneToOne: false
      referencedRelation: "saldi"
      referencedColumns: ["membro_id"]
    },{
      foreignKeyName: "cronologia_nucleo_id_fkey"
      columns: ["nucleo_id"]
isOneToOne: false
      referencedRelation: "nuclei"
      referencedColumns: ["id"]
    }
                  ]
                },"membri": {
                  Row: {
                    "data_ingresso": string,"data_uscita": string | null,"id": string,"link_pagamento": string | null,"nome_visualizzato": string,"nucleo_id": string,"utente_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "data_ingresso"?: string,"data_uscita"?: string | null,"id"?: string,"link_pagamento"?: string | null,"nome_visualizzato": string,"nucleo_id": string,"utente_id"?: string | null
                  }
                  Update: {
                    "data_ingresso"?: string,"data_uscita"?: string | null,"id"?: string,"link_pagamento"?: string | null,"nome_visualizzato"?: string,"nucleo_id"?: string,"utente_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "membri_nucleo_id_fkey"
      columns: ["nucleo_id"]
isOneToOne: false
      referencedRelation: "nuclei"
      referencedColumns: ["id"]
    }
                  ]
                },"nuclei": {
                  Row: {
                    "codice_invito": string,"data_creazione": string,"id": string,"nome": string
                  }
                  ComputedFields: never
                  Insert: {
                    "codice_invito"?: string,"data_creazione"?: string,"id"?: string,"nome"?: string
                  }
                  Update: {
                    "codice_invito"?: string,"data_creazione"?: string,"id"?: string,"nome"?: string
                  }
                  Relationships: [
                    
                  ]
                },"rimborsi": {
                  Row: {
                    "a_membro": string,"autore": string | null,"da_membro": string,"data_creazione": string,"data_eliminazione": string | null,"data_modifica": string,"data_rimborso": string,"id": string,"importo_centesimi": number,"nota": string | null,"nucleo_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "a_membro": string,"autore"?: string | null,"da_membro": string,"data_creazione"?: string,"data_eliminazione"?: string | null,"data_modifica"?: string,"data_rimborso"?: string,"id"?: string,"importo_centesimi": number,"nota"?: string | null,"nucleo_id": string
                  }
                  Update: {
                    "a_membro"?: string,"autore"?: string | null,"da_membro"?: string,"data_creazione"?: string,"data_eliminazione"?: string | null,"data_modifica"?: string,"data_rimborso"?: string,"id"?: string,"importo_centesimi"?: number,"nota"?: string | null,"nucleo_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "rimborsi_nucleo_id_a_membro_fkey"
      columns: ["nucleo_id","a_membro"]
isOneToOne: false
      referencedRelation: "membri"
      referencedColumns: ["nucleo_id","id"]
    },{
      foreignKeyName: "rimborsi_nucleo_id_a_membro_fkey"
      columns: ["nucleo_id","a_membro"]
isOneToOne: false
      referencedRelation: "saldi"
      referencedColumns: ["nucleo_id","membro_id"]
    },{
      foreignKeyName: "rimborsi_nucleo_id_autore_fkey"
      columns: ["nucleo_id","autore"]
isOneToOne: false
      referencedRelation: "membri"
      referencedColumns: ["nucleo_id","id"]
    },{
      foreignKeyName: "rimborsi_nucleo_id_autore_fkey"
      columns: ["nucleo_id","autore"]
isOneToOne: false
      referencedRelation: "saldi"
      referencedColumns: ["nucleo_id","membro_id"]
    },{
      foreignKeyName: "rimborsi_nucleo_id_da_membro_fkey"
      columns: ["nucleo_id","da_membro"]
isOneToOne: false
      referencedRelation: "membri"
      referencedColumns: ["nucleo_id","id"]
    },{
      foreignKeyName: "rimborsi_nucleo_id_da_membro_fkey"
      columns: ["nucleo_id","da_membro"]
isOneToOne: false
      referencedRelation: "saldi"
      referencedColumns: ["nucleo_id","membro_id"]
    },{
      foreignKeyName: "rimborsi_nucleo_id_fkey"
      columns: ["nucleo_id"]
isOneToOne: false
      referencedRelation: "nuclei"
      referencedColumns: ["id"]
    }
                  ]
                },"spese": {
                  Row: {
                    "autore": string | null,"categoria_id": string | null,"data_creazione": string,"data_eliminazione": string | null,"data_modifica": string,"data_restituzione": string | null,"data_spesa": string,"descrizione": string | null,"divisione": string,"id": string,"importo_centesimi": number,"importo_originale": number | null,"metodo_pagamento": string,"note": string | null,"nucleo_id": string,"pagata_da": string,"tasso_cambio": number | null,"terza_persona": string | null,"valuta": string
                  }
                  ComputedFields: never
                  Insert: {
                    "autore"?: string | null,"categoria_id"?: string | null,"data_creazione"?: string,"data_eliminazione"?: string | null,"data_modifica"?: string,"data_restituzione"?: string | null,"data_spesa"?: string,"descrizione"?: string | null,"divisione"?: string,"id"?: string,"importo_centesimi": number,"importo_originale"?: number | null,"metodo_pagamento"?: string,"note"?: string | null,"nucleo_id": string,"pagata_da": string,"tasso_cambio"?: number | null,"terza_persona"?: string | null,"valuta"?: string
                  }
                  Update: {
                    "autore"?: string | null,"categoria_id"?: string | null,"data_creazione"?: string,"data_eliminazione"?: string | null,"data_modifica"?: string,"data_restituzione"?: string | null,"data_spesa"?: string,"descrizione"?: string | null,"divisione"?: string,"id"?: string,"importo_centesimi"?: number,"importo_originale"?: number | null,"metodo_pagamento"?: string,"note"?: string | null,"nucleo_id"?: string,"pagata_da"?: string,"tasso_cambio"?: number | null,"terza_persona"?: string | null,"valuta"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "spese_nucleo_id_autore_fkey"
      columns: ["nucleo_id","autore"]
isOneToOne: false
      referencedRelation: "membri"
      referencedColumns: ["nucleo_id","id"]
    },{
      foreignKeyName: "spese_nucleo_id_autore_fkey"
      columns: ["nucleo_id","autore"]
isOneToOne: false
      referencedRelation: "saldi"
      referencedColumns: ["nucleo_id","membro_id"]
    },{
      foreignKeyName: "spese_nucleo_id_categoria_id_fkey"
      columns: ["nucleo_id","categoria_id"]
isOneToOne: false
      referencedRelation: "categorie"
      referencedColumns: ["nucleo_id","id"]
    },{
      foreignKeyName: "spese_nucleo_id_fkey"
      columns: ["nucleo_id"]
isOneToOne: false
      referencedRelation: "nuclei"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "spese_nucleo_id_pagata_da_fkey"
      columns: ["nucleo_id","pagata_da"]
isOneToOne: false
      referencedRelation: "membri"
      referencedColumns: ["nucleo_id","id"]
    },{
      foreignKeyName: "spese_nucleo_id_pagata_da_fkey"
      columns: ["nucleo_id","pagata_da"]
isOneToOne: false
      referencedRelation: "saldi"
      referencedColumns: ["nucleo_id","membro_id"]
    }
                  ]
                }
          }
          Views: {
            "quote_spese": {
                  Row: {
                    "id": string,"importo_centesimi": number,"nucleo_id": string,"pagata_da": string,"quota_altra_persona_centesimi": number | null
                  }
                  ComputedFields: never
                  Insert: {
                           "id"?: string | null,"importo_centesimi"?: number | null,"nucleo_id"?: string | null,"pagata_da"?: string | null,"quota_altra_persona_centesimi"?: never
                         }
                        Update: {
                           "id"?: string | null,"importo_centesimi"?: number | null,"nucleo_id"?: string | null,"pagata_da"?: string | null,"quota_altra_persona_centesimi"?: never
                         }
                        Relationships: [
                    {
      foreignKeyName: "spese_nucleo_id_fkey"
      columns: ["nucleo_id"]
isOneToOne: false
      referencedRelation: "nuclei"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "spese_nucleo_id_pagata_da_fkey"
      columns: ["nucleo_id","pagata_da"]
isOneToOne: false
      referencedRelation: "membri"
      referencedColumns: ["nucleo_id","id"]
    },{
      foreignKeyName: "spese_nucleo_id_pagata_da_fkey"
      columns: ["nucleo_id","pagata_da"]
isOneToOne: false
      referencedRelation: "saldi"
      referencedColumns: ["nucleo_id","membro_id"]
    }
                  ]
                },"saldi": {
                  Row: {
                    "membro_id": string,"nome_visualizzato": string,"nucleo_id": string,"saldo_centesimi": number | null
                  }
                  ComputedFields: never
                  Insert: {
                           "membro_id"?: string | null,"nome_visualizzato"?: string | null,"nucleo_id"?: string | null,"saldo_centesimi"?: never
                         }
                        Update: {
                           "membro_id"?: string | null,"nome_visualizzato"?: string | null,"nucleo_id"?: string | null,"saldo_centesimi"?: never
                         }
                        Relationships: [
                    {
      foreignKeyName: "membri_nucleo_id_fkey"
      columns: ["nucleo_id"]
isOneToOne: false
      referencedRelation: "nuclei"
      referencedColumns: ["id"]
    }
                  ]
                },"spesa_mensile_per_categoria": {
                  Row: {
                    "budget_centesimi": number | null,"categoria_id": string | null,"mese": string | null,"nucleo_id": string,"speso_centesimi": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "spese_nucleo_id_categoria_id_fkey"
      columns: ["nucleo_id","categoria_id"]
isOneToOne: false
      referencedRelation: "categorie"
      referencedColumns: ["nucleo_id","id"]
    },{
      foreignKeyName: "spese_nucleo_id_fkey"
      columns: ["nucleo_id"]
isOneToOne: false
      referencedRelation: "nuclei"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "anteprima_invito":
{ Args: { "p_codice_invito": string }; Returns: {
              "completo": boolean,"nome_invitante": string,"nome_nucleo": string
            }[]
                           },
"appartiene_al_nucleo":
{ Args: { "p_nucleo_id": string }; Returns: boolean
                           },
"crea_nucleo":
{ Args: { "p_nome_nucleo"?: string,"p_nome_visualizzato": string }; Returns: string
                           },
"entra_nel_nucleo":
{ Args: { "p_codice_invito": string,"p_nome_visualizzato": string }; Returns: string
                           },
"membro_corrente":
{ Args: { "p_nucleo_id": string }; Returns: string
                           },
"ping":
{ Args: never; Returns: boolean
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
