# Wallet file format standard

Initial meta issue: <https://github.com/massalabs/massa-standards/issues/15>

## Abstract

## Motivation

## Specification

Hereby, after having looked at Thyra and Massa Client, I would suggest the following format below. Since we dont really have menmonic wallets , hierarchical wallets etc. we could simply stick to what we have already done in Thyra and Massa-Client and what I believe wraps up our needs in the best possible ways.

## Implementation

The json format (although not directly used) which describes the wallets structure could look like this:

```json
[
    {
      version: "1.0",
      name: "MyDemoWallet",
      accounts: [
         {
           PrivateKey: 0x0...,
           PublicKey: 0x0...,
         }
      ]
    },
    {
      version: "1.0",
      name: "MyTradingWallet",
      accounts: [
         {
           PrivateKey: 0x0...,
           PublicKey: 0x0...,
         }
      ]
    }
]
```

To illustrate the idea, here is a pseudo-rust implementation of a so-called Vault, which contains n x Wallets.

First, similarly to Thyra and Massa-rs, we can have json serializable and deserializable structures for our KeyPairs and Wallet as shown below. I have also added a walletType which is meant to be a complex type containing the version and the uuid of the given wallet. We could have wallets with equal names, but different versions as a final differentiator.

```rust
    #[derive(Serialize, Deserialize)]
    struct KyPair {
        PrivateKey: PrivateKey,
        PublicKey:  PublicKey,
        Salt:       Option<Salt>,
        Nonce:      Option<Nonce>,
    }

    #[derive(Serialize, Deserialize)]
    struct Wallet {
        version: String,
        name: String,
        accounts: HashMap<Address, Keypair>
    }
```

A possible interface could look like:

```rust
struct Vault {
        wallets: Vec<Wallet>
}

impl Vault {

    // ---------------- initializers/savers/loaders ------------------ //
    pub fn new() -> Self {
        Self {wallets: vec![]}
    }

    fn load_vault(from_path: Path, password: String) -> Vault {
        // loads the .dat file from path
        // decrypts the binary contents
        // initializes a Vault
    }

    fn save_vault(&self, to_path: Path, password: String) -> Result<(), WalletError> {
      // converts the self.wallets to json
      // aes encrypts the json bytes
      // saves output to a file.dat
    }

    // ---------------- setters ------------------ //
    fn empty_vault(&mut self) {
      // removes all wallets from vault
    }

    fn delete_wallet_or_addresses(&mut self, filter: &SearchFilter) -> Result<(), WalletError> {
        // finds the wallet by the filter and deletes all or some of its address-keypairs. The filter controls the deletion query
     }

     fn add_keypair_to_wallet(&mut self, filter: &SearchFilter, keypair: Vec<KeyPair>) -> Result<(), WalletError> { 
       // adds key-pair values to the vault as per search filter
     }

    // ---------------- getters ------------------ //
     fn get_pub_key(&self, filter: &SearchFilter) -> Option<&PublicKey>

     fn get_pub_keys(&self, filter: &SearchFilter) -> Vec<PubKey>>;

     fn get_addresses(&self, filter: &SearchFilter) -> Vec<Address>;

     fn get_keypairs(&self, filter: &SearchFilter) -> Vec<&KeyPair>;

     // ---------------- user methods ------------------ //
     fn sign_message(&self, filter: &SearchFilter, msg: Vec<u8>) -> Option<PubkeySig> {}

     fn get_all_wallets(&self) -> &[&Wallet]

     fn print(&self) -> String {
       // prints the wallet using a formatted string
     }
}
```

The wallets could be json serialized into a bytearray, encrypted and written as such into a .data file.

Encryption:
```rust
   let serialized = Json.stringify(wallets);
    let encrypted_content = encrypt(password, serialized.bytes())
    fs:write(wallet_path, encrypted_content)
```

Decryption:
```rust
   
    let decrypted_content = decrypt(password, deserialized.bytes())
    let vault: Vault = Json.parse(decrypted_content);
```