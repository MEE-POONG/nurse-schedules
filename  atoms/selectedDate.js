import { atom } from 'recoil';

import { recoilPersist } from 'recoil-persist';

const { persistAtom } = recoilPersist();

const selectedDateState = atom({
  key: 'selectedDate',
  default: { month: 1, year: 2023 },
  effects_UNSTABLE: [persistAtom]
});
export { selectedDateState };
