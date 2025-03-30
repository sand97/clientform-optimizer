
export interface Field {
  id: string;
  name: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string;
  order_position: number;
}

export interface Organization {
  id: string;
  name: string;
  created_at?: string;
}

export interface Position {
  x: number;
  y: number;
  page: number;
  fieldId: string;
}

export interface Template {
  id: string;
  form_id: string;
  pdf_url: string;
  original_pdf_name: string;
  positions: Position[] | any;
  updated_at: string;
  form_name?: string;
  form?: {
    id: string;
    name: string;
    description?: string;
    organization_id: string;
    fields: Field[];
  };
}

export interface FormData {
  id: string;
  name: string;
  description?: string;
  fields: Field[];
}

export interface TemplateData {
  id: string;
  pdf_url: string;
  original_pdf_name: string;
  positions: Record<string, any>;
}

export interface TeamMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: string;
  created_at: string;
  email: string;
  raw_user_meta_data: any; // Changed from specific structure to any to match Supabase's Json type
}
