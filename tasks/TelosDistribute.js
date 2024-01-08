import Contract from "../src/Contract.js";
import axios from 'axios';

const MINUTES = parseInt(process.env.TSK_TELOS_DISTRIBUTE_PAY_MN);
const ACCOUNT = 'exrsrv.tf';

class TelosDistribute extends Contract {
    constructor(){
        super(ACCOUNT);
        this.min_timestamp = new Date();
        this.min_timestamp.setMinutes(this.min_timestamp.getMinutes() - MINUTES);
        this.double_timestamp = new Date();
        this.double_timestamp.setMinutes(this.double_timestamp.getMinutes() - (MINUTES * 2));
    }
    async findPayAction(actions, timestamp){
        for(var i = 0; i < actions.length; i++){
            let action_timestamp = new Date(actions[i].timestamp + 'Z'); // Force UTC flag
            if(actions[i].act.name === 'pay' && action_timestamp.toISOString() > timestamp.toISOString()){
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
            const response = await axios.get(this.hyperion_endpoint + "/history/get_actions?account="+ACCOUNT+"&limit=30&sort=desc&skip=0");
            if(!await this.findPayAction(response.data.actions, this.min_timestamp)){
                // TIMEOUT & TRY AGAIN
                setTimeout(async () => {
                    const response2 = await axios.get(this.hyperion_endpoint + "/history/get_actions?account="+ACCOUNT+"&limit=30&sort=desc&skip=0");
                    if(!await this.findPayAction(response2.data.actions, this.double_timestamp)){
                        this.errors.push('No pay found for at least ' + (MINUTES * 2) + " minutes");
                    } else {
                        this.alerts.push('Last pay not found');
                    }
                }, 5000);
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
