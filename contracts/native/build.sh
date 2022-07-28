#! /bin/bash
echo ">>> Building contract..."
eosio-cpp -I="./include/"   -o="./build/rngorc.tester.wasm" -contract="rngorctester" -abigen ./src/rngorc.tester.cpp
eosio-cpp -I="./include/"   -o="./build/pforc.tester.wasm" -contract="pforctester" -abigen ./src/pforc.tester.cpp