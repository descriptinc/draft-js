import {resetUuids} from '../../src/util/uuid';
import {resetRandomKeys} from '../../src/model/keys/generateRandomKey';

jest.mock('../../src/model/keys/generateRandomKey');
jest.mock('../../src/util/uuid');
beforeEach(() => {
  resetUuids();
  resetRandomKeys();
});
