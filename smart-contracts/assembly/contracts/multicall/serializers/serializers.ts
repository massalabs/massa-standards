import { Args, Result, Serializable } from '@massalabs/as-types';

export class Call implements Serializable {
  constructor(
    public contract: string = '',
    public targetFunc: string = '',
    public coins: u64 = 0,
    public params: StaticArray<u8> = [],
  ) {}

  serialize(): StaticArray<u8> {
    return new Args()
      .add(this.contract)
      .add(this.targetFunc)
      .add(this.coins)
      .add(this.params)
      .serialize();
  }

  deserialize(data: StaticArray<u8>, offset: i32 = 0): Result<i32> {
    const args = new Args(data, offset);

    this.contract = args.nextString().expect("Can't deserialize contract.");
    this.targetFunc = args
      .nextString()
      .expect("Can't deserialize target function.");
    this.coins = args.nextU64().expect("Can't deserialize coins.");
    this.params = args.nextBytes().expect("Can't deserialize params.");

    return new Result(args.offset);
  }
}

export class CallResult implements Serializable {
  constructor(public res: StaticArray<u8> = []) {}

  serialize(): StaticArray<u8> {
    return new Args().add(this.res).serialize();
  }

  deserialize(data: StaticArray<u8>, offset: i32 = 0): Result<i32> {
    const args = new Args(data, offset);
    this.res = args.nextBytes().expect("Can't deserialize call result.");

    return new Result(args.offset);
  }
}
