import { Args, stringToBytes } from '@massalabs/as-types';
import { Address, changeCallStack } from '@massalabs/massa-as-sdk';
import { ownerAddress, setOwner } from '../ownership';

describe('Ownership', () => {
  test('Set/Get owner', () => {
    const ownerAddr = 'A12UBnqTHDQALpocVBnkPNy7y5CndUJQTLutaVDDFgMJcq5kQiKq';
    setOwner(new Args().add(ownerAddr).serialize());
    const owner = ownerAddress([]);
    expect(owner).toStrictEqual(stringToBytes(ownerAddr));
  });

  throws('Set owner forbidden', () => {
    const notOwnerAddr = 'B12UBnqTHDQALpocVBnkPNy7y5CndUJQTLutaVDDFgMJcq5kQiKq';
    const contractAddressERC20Basic = new Address(
      'A12BqZEQ6sByhRLyEuf0YbQmcF2PsDdkNNG1akBJu9XcjZA1eT',
    );
    changeCallStack(
      notOwnerAddr + ' , ' + contractAddressERC20Basic.toByteString(),
    );

    setOwner(new Args().add(notOwnerAddr).serialize());
  });
});
