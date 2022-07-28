// Telos Random Oracle Tester
//
// @author Thomas Cuvillier
// @contract requestor
// @version v0.1.0

#include <eosio/eosio.hpp>
#include <eosio/singleton.hpp>
#include <eosio/crypto.hpp>

using namespace std;
using namespace eosio;

CONTRACT rngorctester : public contract {

public:
    rngorctester(name self, name code, datastream<const char*> ds) : contract(self, code, ds) {};
    ~rngorctester() {};

    //======================== request actions ========================

    // request a random value
    ACTION request(uint64_t seed, uint64_t min, uint64_t max);

    // receive a random value
    ACTION receiverand(uint64_t request_id, checksum256 random);

    ACTION rmvrequest(uint64_t request_id);

    //======================== contract tables ========================

    //request
    TABLE rngrequest {
        uint64_t id;
        uint64_t max;
        uint64_t min;
        uint64_t number;

        uint64_t primary_key() const { return id; }
        EOSLIB_SERIALIZE(rngrequest, (id)(max)(min)(number))
    };
    typedef multi_index<name("rngrequests"), rngrequest> requests_table;
};