import Contract from "../src/Contract.js";
import dotenv from 'dotenv/config';
import axios from 'axios';

const MINUTES = parseInt(process.env.TSK_TELOS_DISTRIBUTE_PAY_MN);
const ACCOUNT = 'exrsrv.tf';

class TelosDistribute extends Contract {
    constructor(){
        super(ACCOUNT);
        this.min_timestamp = new Date();
        this.min_timestamp.setMinutes(this.min_timestamp.getMinutes() - MINUTES);
    }
    async findPayAction(actions){
        let found = false;
        for(var i = 0; i < actions.length; i++){
            let timestamp = new Date(actions[i].timestamp);
<<<<<<< HEAD
            if(actions[i].act.name === 'pay' && timestamp.getTime() > this.min_timestamp.getTime()){
=======
            if(actions[i].act.name == 'pay' && timestamp.getTime() > this.min_timestamp.getTime()){
>>>>>>> 847b1ae352b66dd522852d19e006b164bf731a16
                await this.save(); // PAY FOUND
                this.end();
                return true;
            }
        }
        return false;
    }
    async run(){
        try {
            const response = await axios.get(this.hyperion_endpoint + "/history/get_actions?account="+ACCOUNT+"&limit=20");
            await this.findPayAction(response.data.actions);
            // IF PAY WASN'T FOUND TRIGGER PAY OURSELVES
            await this.sendActions([{
                account: ACCOUNT,
                name: 'pay',
                authorization: [{ actor: process.env.TSK_RNG_ORACLE_CONSUMER, permission: 'active' }],
                data: {},
            }]);

            // TIMEOUT FOR HYPERION TO CATCH UP
            setTimeout(async () => {
                try {
                    const response_timed = await axios.get(this.hyperion_endpoint + "/history/get_actions?account="+ACCOUNT+"&limit=20");
                    await this.findPayAction(response_timed.data.actions);
                    this.errors.push("Was not able to pay, action not found");
                } catch (e) {
                    this.errors.push(e.message);
                }
                await this.save();
                this.end();
            }, 3000);
        } catch (e) {
            this.errors.push(e.message);
            await this.save();
            this.end();
        }
    }
}

const test = new TelosDistribute();
test.run();