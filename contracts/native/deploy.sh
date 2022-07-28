#! /bin/bash
#network
if [[ "$1" == "mainnet" ]]; then
    url=http://www.telos.net; # Telos Mainnet
    network="Telos Mainnet";
elif [[ "$1" == "testnet" ]]; then
    url=https://testnet.telos.net/; # Basho Testnet
    network="Telos Testnet";
elif [[ "$1" == "local" ]]; then
    url=http://127.0.0.1:8888
    network="Local"
else
    echo "need network"
    exit 0
fi

echo ">>> Deploying contract rngorc.test..."

cleos -u $url set contract rngorc.test ./build/ rngorc.tester.wasm rngorc.tester.abi -p rngorc.test@active

echo ">>> Deploying contract pforc.test..."

cleos -u $url set contract pforc.test ./build/ pforc.tester.wasm pforc.tester.abi -p pforc.test@active