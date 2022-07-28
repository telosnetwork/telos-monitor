import Task from "../src/Task.js";
import dotenv from "dotenv/config";
import ethers from "ethers";

const MIN = parseInt(process.env.TSK_RNG_BRIDGE_MIN_BALANCE);

class RNGOracleBridge extends Task {
    constructor(){
        super('rng.bridge', 'contracts');
        this.provider = new ethers.providers.JsonRpcProvider(process.env.RPC_EVM_ENDPOINT);
    }
    async getBalance(address, name){
        try {
            let balance = await this.provider.getBalance(address);
            if(ethers.utils.formatEther(balance) < MIN){
                this.errors.push('TLOS balance is < '+ MIN +' for ' + name);
            }
        } catch (e) {
            this.errors.push('Could not retreive TLOS balance: ' +e.message);
        }
    }
    async run(){
        await this.getBalance(process.env.TSK_RNG_BRIDGE_EVM_CONTRACT, 'EVM contract');
        await this.getBalance(process.env.TSK_RNG_BRIDGE_NATIVE_EVM_ADDRESS, 'Native contract EVM address');
        await this.save();
        this.end();
    }
}

let test = new RNGOracleBridge();
test.run();