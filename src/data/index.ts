import AsyncStorage from '@react-native-async-storage/async-storage';

import { MockRepository } from './mock/MockRepository';
import type { Repository } from './repository';

export type { Repository } from './repository';

/** The app-wide data source. Import this instead of a concrete implementation. */
export const repository: Repository = new MockRepository({ storage: AsyncStorage });
