import AsyncStorage from '@react-native-async-storage/async-storage';

import { MockRepository } from './mock/MockRepository';
import type { Repository } from './repository';
import { SupabaseRepository } from './supabase/SupabaseRepository';

export type { Repository } from './repository';

function createRepository(): Repository {
  if (process.env.EXPO_PUBLIC_DATA_SOURCE === 'supabase') {
    return new SupabaseRepository({
      url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
      anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
      storage: AsyncStorage,
    });
  }
  return new MockRepository({ storage: AsyncStorage });
}

/**
 * The app-wide data source. Import this instead of a concrete implementation.
 * Set EXPO_PUBLIC_DATA_SOURCE=supabase (see .env.example) to use the shared backend.
 */
export const repository: Repository = createRepository();
