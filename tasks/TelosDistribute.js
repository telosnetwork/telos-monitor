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
        for(var i = 0; i < actions.length; i++){
            let timestamp = new Date(actions[i].timestamp + 'Z'); // Force UTC flag
            if(actions[i].act.name === 'pay' && timestamp.toISOString() > this.min_timestamp.toISOString()){
                 // PAY FOUND END TASK HERE
                await this.save();
                this.end();
                return true;
            }
        }
        return false;
    }
    async run(){
        try {
            const response = await axios.get(this.hyperion_endpoint + "/history/get_actions?account="+ACCOUNT+"&limit=20&sort=desc&skip=0");
            if(!await this.findPayAction(response.data.actions)){
                // IF PAY WASN'T FOUND, TRIGGER PAY OURSELVES
                const response = await this.sendActions([{
                    account: ACCOUNT,
                    name: 'pay',
                    authorization: [{ actor: process.env.TSK_RNG_ORACLE_CONSUMER, permission: 'active' }],
                    data: {},
                }]);
                console.log(response);
                // TIMEOUT FOR HYPERION TO CATCH UP
                setTimeout(async () => {
                    try {
                        const response_timed = await axios.get(this.hyperion_endpoint + "/history/get_actions?account="+ACCOUNT+"&limit=20&sort=desc&skip=0");
                        if(!await this.findPayAction(response_timed.data.actions)){
                            this.errors.push("Was not able to pay, action not found in history");
                        }
                    } catch (e) {
                        this.errors.push(e.message);
                    }
                    await this.save();
                    this.end();
                }, 4000);
            }
        } catch (e) {
            this.errors.push(e.message);
            await this.save();
            this.end();
        }
    }
}

const test = new TelosDistribute();
test.run();
