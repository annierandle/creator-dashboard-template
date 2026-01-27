export interface Assignment {
  creator_id: string;
  date_pst: string;
  product_name: string;
  video_style: string;
  script_name: string;
  script_required: boolean;
  [key: string]: string | boolean;
}
