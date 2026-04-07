// services/supabase.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ypggpdhhbvliwsnembpt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwZ2dwZGhoYnZsaXdzbmVtYnB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NjIzODYsImV4cCI6MjA3OTEzODM4Nn0.UVcNlpjNi5tyZyGla6vn1mac0ZkkxQtEEKkfPX3Wr2o';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
