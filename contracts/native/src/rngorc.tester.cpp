#include "../include/rngorc.tester.hpp";

//======================== Actions ========================
ACTION rngorctester::request(uint64_t seed, uint64_t min, uint64_t max)
{
    requests_table requests(get_self(), get_self().value);

    auth(get_self());
    // add request
    uint64_t request_id = requests.available_primary_key();
    requests.emplace(get_self(), [&](auto& r) {
        r.id = request_id;
        r.max = max;
        r.min = min;
    });

    action(
        permission_level{ get_self(),"active"_n},
        "rng.oracle"_n,
        "requestrand"_n,
        std::make_tuple(request_id, seed, get_self())
    ).send();
}

ACTION rngorctester::receiverand(uint64_t request_id, checksum256 random)
{
    // find request
    requests_table requests(get_self(), get_self().value);
    auth('rng.oracle'_n);
    auto &request = requests.get(request_id, "Request could not be found");
    auto byte_array = random.extract_as_byte_array();
    uint64_t random_int = 0;
    for (int i = 0; i < 32; i++) {
        random_int <<= 32;
        random_int |= (uint64_t)byte_array[i];
    }
    uint64_t number = request.min + ( random_int % ( request.max - request.min + 1 ) );
    requests.modify(request, get_self(), [&](auto& row){
        row.number = number;
    });
}

// remove a request
ACTION rngorctester::rmvrequest(uint64_t request_id)
{
    auth(get_self());
    // find request
    requests_table requests(get_self(), get_self().value);
    auto itr = requests.find(request_id);
    check(itr != requests.end(), "Request not found");

    //delete it
    requests.erase(itr);
};