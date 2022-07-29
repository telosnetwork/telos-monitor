import Task from "../src/Task.js";
import dotenv from 'dotenv/config';
import axios from 'axios';

const MINUTES = parseInt(process.env.TSK_TELOS_DISTRIBUTE_PAY_MN);

class TelosDistribute extends Task {
    constructor(){
        super('exrsvr.tf', "contracts");
        this.min_timestamp = new Date();
        this.min_timestamp.setMinutes(this.min_timestamp.getMinutes() - MINUTES);
    }
    async run(){
        const response = await axios.get(this.hyperion_endpoint + "/history/get_actions?account=exrsrv.tf&limit=20");
        let actions = response.data.actions;
        let found = false;
        for(var i = 0; i < actions.length; i++){
            let timestamp = new Date(actions[i].timestamp);
            if(actions[i].act.name == 'pay' && timestamp.getTime() > this.min_timestamp.getTime()){
                this.save(); // PAY FOUND
                this.end();
                return;
            }
        }
        // IF PAY WASN'T FOUND IN TIME LIMIT
        this.errors.push("Could not find a pay action in the last "+ MINUTES +" minutes");
        await this.save();
        // TRIGGER PAY OURSELVES
        await this.sendActions([{
            account: 'exrsvr.tf',
            name: 'pay',
            authorization: [{ actor: process.env.TSK_RNG_ORACLE_CONSUMER, permission: 'active' }],
            data: {},
        }]);
        this.end();
    }
}

const test = new TelosDistribute();
test.run();