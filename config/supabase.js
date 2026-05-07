import { createClient } from '@supabase/supabase-js';
import { config } from './env.js';

const supabase = createClient(config.supabase.url, config.supabase.key);

export const fetchFromSupabase = async (table, columns = '*') => {
  const { data, error } = await supabase.from(table).select(columns);
  if (error) {
    throw error;
  }
  return data;
};

export default supabase;
