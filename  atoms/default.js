import { atom } from 'recoil';

const defaultState = atom({
  key: 'default',
  default: { month: 1, year: 2023 },
});
export { defaultState };
