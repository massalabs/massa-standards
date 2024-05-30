import { u256 } from "as-bignum/assembly";
import { Exportable, ERC20 } from "..";
import { Args } from "@massalabs/as-types";
import { Address } from "@massalabs/massa-as-sdk";

const totalSupply = u256.fromU32(1000);

// @eslint-ignore @typescript-eslint/no-unused-vars
// @ts-ignore
@lazy @global const FungibleToken = new ERC20(totalSupply);

describe('ERC20 - Documentation tests', () => {
  it('should be simple to use - create smart contract', () => {
        
    const totalSupplyBinary = new Args().add(totalSupply).serialize();
    const addr1 = new Address('AU12UBnqTHDQALpocVBnkPNy7y5CndUJQTLutaVDDFgMJcq5kQiKq');
    const addr1Binary = new Args().add(addr1).serialize();
    const addr2 = new Address('AU12UBnqTHDQALpocVBnkPNy7y5CndUJQTLutaVDDFgMJcq5kQiKr');
    const allowanceArgs = new Args().add(addr1).add(addr2).serialize();
    const u256ZeroBinary = new Args().add(u256.Zero).serialize();

    expect(Exportable.totalSupply()).toStrictEqual(totalSupplyBinary);
    expect(Exportable.balanceOf(addr1Binary)).toStrictEqual(u256ZeroBinary);
    expect(Exportable.allowance(allowanceArgs)).toStrictEqual(u256ZeroBinary);
  });
});

