
export interface Field {
  id: string;
  name: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: any;
  order_position: number;
}

export interface Organization {
  id: string;
  name: string;
}
