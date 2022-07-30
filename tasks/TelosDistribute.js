import Contract from "../src/Contract.js";
import dotenv from 'dotenv/config';
import axios from 'axios';

const MINUTES = parseInt(process.env.TSK_TELOS_DISTRIBUTE_PAY_MN);
const ACCOUNT = 'exrsvr.tf';

class TelosDistribute extends Contract {
    constructor(){
        super(ACCOUNT);
        this.min_timestamp = new Date();
        this.min_timestamp.setMinutes(this.min_timestamp.getMinutes() - MINUTES);
    }
    async run(){
        const response = await axios.get(this.hyperion_endpoint + "/history/get_actions?account="+ACCOUNT+"&limit=20");
        let actions = response.data.actions;
        let found = false;
        for(var i = 0; i < actions.length; i++){
            let timestamp = new Date(actions[i].timestamp);
            if(actions[i].act.name == 'pay' && timestamp.getTime() > this.min_timestamp.getTime()){
                await this.save(); // PAY FOUND
                this.end();
                return;
            }
        }
        // IF PAY WASN'T FOUND TRIGGER PAY OURSELVES
        await this.sendActions([{
            account: ACCOUNT,
            name: 'pay',
            authorization: [{ actor: process.env.TSK_RNG_ORACLE_CONSUMER, permission: 'active' }],
            data: {},
        }]);
        await this.save();
        this.end();
    }
}

const test = new TelosDistribute();
test.run();