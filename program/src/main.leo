// The 'quest_mint' program.
program quest_mint_v1.aleo {
    // base uri ascii bits. Include as many data pieces as necessary to encapsulate the uri. Padded with 0s at the end.
    struct BaseURI {
        data0: u128, // Part 1 of the base uri in bits. Bits should be the representation of the hexadecimal bytes for the ASCII text of the URL
        data1: u128,
        data2: u128,
        data3: u128
    }

    struct TokenId {
        data1: u128, // Part 1 of the image data -- i.e., a way to link this nft to image or aws
    }

    struct SymbolBits {
        data: u128 // The sybmol's ascii text represented in bits, and the u128 value of the bitstring.
    }

    record NFT {
        private owner: address,
        private data: TokenId, // data is required to work with our rpc
        private edition: scalar, // edition is required to work with our rpc
    }

    // keys: setting index
    // values: setting value
    mapping general_settings: u8 => u128;

    // 0: collection has been initialized
    // 1: can minters mint
    // 2: do minters have to have a mint record (i.e. is the private whitelist a requirement)
    // 3: is the collection frozen
    mapping toggle_settings: u8 => u32;

    mapping minted_nfts: u128 => bool;
    mapping nft_owners: field => address;

    transition initialize_collection(
        public total: u128,
        public symbol: u128,
        public base_uri: BaseURI,
    ) {
        assert_eq(self.caller, aleo1pv0g5swuw3akqegrktvf3aqngzpd4e5w5vlleh5zjd0gf9yxgcfqurnfu0);
        return then finalize(total, symbol, base_uri);
    }

    finalize initialize_collection(
        public total: u128,
        public symbol: u128,
        public base_uri: BaseURI,
    ) {
        // Ensure initialize cannot be called twice!
        let toggle_settings_status: u32 = toggle_settings.get_or_use(0u8, 0u32);
        let is_initialized: u32 = toggle_settings_status & 1u32;
        assert_eq(is_initialized, 0u32);

        general_settings.set(0u8, 0u128); // number of mintable NFTs (all editions)
        general_settings.set(1u8, total); // Number of total NFTs (first-editions) that can be minted
        general_settings.set(2u8, symbol); // Symbol for the NFT
        general_settings.set(3u8, base_uri.data0); // Base URI for NFT
        general_settings.set(4u8, base_uri.data1);
        general_settings.set(5u8, base_uri.data2);
        general_settings.set(6u8, base_uri.data3);
        // initialized flag = 0b0000...0001 = 1u32
        // minting flag = 0b0000...0010 = 2u32
        // whitelist flag = 0b0000...0100 = 4u32
        // frozen flag = 0b0000...1000 = 8u32
        // defaults -- not frozen, whitelist required, not minting, initialized
        // 0b0000...0101 = 5u32.
        toggle_settings.set(0u8, 5u32);
        toggle_settings.set(1u8, 0u32); // block height when mint is allowed
    }

    // call this function to toggle minting, the whitelist requirement, or to permanently freeze the contract
    transition update_toggle_settings(public toggle_settings_bitstring: u32) {
        assert_eq(self.caller, aleo1pv0g5swuw3akqegrktvf3aqngzpd4e5w5vlleh5zjd0gf9yxgcfqurnfu0);
        return then finalize(toggle_settings_bitstring);
    }

    finalize update_toggle_settings(public toggle_settings_bitstring: u32) {
        // Ensure collection is initialized and not frozen.
        let toggle_settings_status: u32 = toggle_settings.get(0u8);
        // initialized & frozen flags = 0b0000...1001 = 9u32
        // what the settings should be = 0b0000...0001 = 1u32
        let is_initialized_and_not_frozen: u32 = toggle_settings_status & 9u32;
        assert_eq(is_initialized_and_not_frozen, 1u32);

        // Ensure updated settings are not uninitializing the collection.
        let still_initialized: u32 = toggle_settings_bitstring & 1u32;
        assert_eq(still_initialized, 1u32);

        toggle_settings.set(0u8, toggle_settings_bitstring);
    }

    transition set_mint_block(public mint_block: u32) {
        assert_eq(self.caller, aleo1pv0g5swuw3akqegrktvf3aqngzpd4e5w5vlleh5zjd0gf9yxgcfqurnfu0);
        return then finalize(mint_block);
    }

    finalize set_mint_block(public mint_block: u32) {
        // Ensure collection is initialized and not frozen.
        let toggle_settings_status: u32 = toggle_settings.get(0u8);
        // initialized & frozen flags = 0b0000...1001 = 9u32
        // what the settings should be = 0b0000...0001 = 1u32
        let is_initialized_and_not_frozen: u32 = toggle_settings_status & 9u32;
        assert_eq(is_initialized_and_not_frozen, 1u32);

        toggle_settings.set(1u8, mint_block);
    }

    transition update_symbol(public symbol: u128) {
        assert_eq(self.caller, aleo1pv0g5swuw3akqegrktvf3aqngzpd4e5w5vlleh5zjd0gf9yxgcfqurnfu0);
        return then finalize(symbol);
    }

    finalize update_symbol(public symbol: u128) {
        // Ensure collection is initialized and not frozen.
        let toggle_settings_status: u32 = toggle_settings.get(0u8);
        // initialized & frozen flags = 0b0000...1001 = 9u32
        // what the settings should be = 0b0000...0001 = 1u32
        let is_initialized_and_not_frozen: u32 = toggle_settings_status & 9u32;
        assert_eq(is_initialized_and_not_frozen, 1u32);

        general_settings.set(2u8, symbol);
    }

    transition update_base_uri(public base_uri: BaseURI) {
        assert_eq(self.caller, aleo1pv0g5swuw3akqegrktvf3aqngzpd4e5w5vlleh5zjd0gf9yxgcfqurnfu0);
        return then finalize(base_uri);
    }

    finalize update_base_uri(public base_uri: BaseURI) {
       // Ensure collection is initialized and not frozen.
        let toggle_settings_status: u32 = toggle_settings.get(0u8);
        // initialized & frozen flags = 0b0000...1001 = 9u32
        // what the settings should be = 0b0000...0001 = 1u32
        let is_initialized_and_not_frozen: u32 = toggle_settings_status & 9u32;
        assert_eq(is_initialized_and_not_frozen, 1u32);

        general_settings.set(3u8, base_uri.data0); // Base URI for NFT
        general_settings.set(4u8, base_uri.data1);
        general_settings.set(5u8, base_uri.data2);
        general_settings.set(6u8, base_uri.data3);
    }

    transition mint(private next_mint: u128) -> NFT {
        // ascii for decimals is always 0011 + 4 bits for the number, 0-9
        // 64053151420411946063694043751862251568 = 0b00110000 00110000 ... 00110000
        // apply a bit mask of 11110000 11110000 ... 11110000 to make sure the ascii bits are correct
        // Reserve the last 5 bytes for the nft extension (e.g. ".json")
        // 11110000111100001111000011110000111100001111000011110000111100001111000011110000111100000000000000000000000000000000000000000000
        let ascii_syntax: u128 = next_mint & 320265757102059730318470217724476784640u128;
        // 00110000001100000011000000110000001100000011000000110000001100000011000000110000001100000000000000000000000000000000000000000000
        assert_eq(ascii_syntax, 64053151420411946063694043544895356928u128);

        let tokenId: TokenId = TokenId {
            data1: next_mint
        };
        return NFT {
            owner: self.caller,
            data: tokenId,
            edition: 0scalar
        } then finalize(next_mint);
    }

    finalize mint(public next_mint: u128) {
        // Ensure mint block height is less than current block height
        let mint_block: u32 = toggle_settings.get(1u8);
        let passed_height_check: bool = mint_block <= block.height;
        assert_eq(passed_height_check, true);

        // Ensure collection is not frozen, minting is allowed, and is initialized, 
        let toggle_settings_status: u32 = toggle_settings.get(0u8);
        // frozen & minting & initialized flags = 0b0000...1011 = 11u32
        // what the settings should be = 0b0000...0011 = 3u32
        let is_initialized_and_not_frozen_and_minting: u32 = toggle_settings_status & 11u32;
        assert_eq(is_initialized_and_not_frozen_and_minting, 3u32);

        // Ensure nft not already minted
        let nft_already_minted: bool = minted_nfts.get_or_use(next_mint, false);
        assert_eq(nft_already_minted, false);
        minted_nfts.set(next_mint, true);
    }

    // Proof that you own an nft without revealing the nft.
    // this burn never actually destroys the nft as the finalize
    // block is guaranteed to fail.
    transition authorize(
        nft: NFT,
        public nonce: u64
    )
    {
        return then finalize();
    }

    finalize authorize(
    )
    {
        // fails on purpose, so that the nft is not burned.
        assert_eq(0u8, 1u8);
    }

    // rpc requirement
    transition transfer_private(
        nft: NFT,
        private receiver: address
    ) -> NFT
    {
        return NFT {
            owner: receiver,
            data: nft.data,
            edition: nft.edition
        };
    }

    // rpc requirement
    transition transfer_public(
        private receiver: address,
        private data: TokenId,
        private edition: scalar
    )
    {
        let tokenHash: field = BHP256::hash_to_field(data);
        let tokenEditionHash: field = BHP256::commit_to_field(tokenHash, edition);
        let caller: address = self.caller;
        return then finalize(receiver, tokenEditionHash, caller);
    }

    finalize transfer_public(
        public receiver: address,
        public tokenEditionHash: field,
        public caller: address
    )
    {
        assert_eq(caller, nft_owners.get(tokenEditionHash));
        nft_owners.set(tokenEditionHash, receiver);
    }

    // rpc requirement
    transition convert_private_to_public(
        nft: NFT
    )
    {
        let tokenHash: field = BHP256::hash_to_field(nft.data);
        let tokenEditionHash: field = BHP256::commit_to_field(tokenHash, nft.edition);
        return then finalize(nft.owner, tokenEditionHash);
    }

    finalize convert_private_to_public(
        public owner: address,
        public tokenEditionHash: field
    )
    {
        nft_owners.set(tokenEditionHash, owner);
    }

    // rpc requirement
    transition convert_public_to_private(
        private owner: address,
        private data: TokenId,
        private edition: scalar
    ) -> NFT
    {
        assert_eq(owner, self.caller);
        let tokenHash: field = BHP256::hash_to_field(data);
        let tokenEditionHash: field = BHP256::commit_to_field(tokenHash, edition);
        return NFT {
            owner,
            data,
            edition
        } then finalize(owner, tokenEditionHash);
    }

    finalize convert_public_to_private(
        public owner: address,
        public tokenEditionHash: field
    )
    {
        assert_eq(owner, nft_owners.get(tokenEditionHash));
        nft_owners.remove(tokenEditionHash);
    }
}
