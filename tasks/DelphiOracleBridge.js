import Contract from "../src/Contract.js";
import dotenv from "dotenv/config";
import ethers from "ethers";

const MIN = parseInt(process.env.TSK_DELPHI_BRIDGE_MIN_BALANCE);

class DelphiOracleBridge extends Contract {
    constructor(){
        super('delphibridge');
        this.provider = new ethers.providers.JsonRpcProvider(process.env.RPC_EVM_ENDPOINT);
    }
    async getBalance(address, name){
        try {
            let balance = await this.provider.getBalance(address);
            if(ethers.utils.formatEther(balance) < MIN){
                this.errors.push('TLOS balance is < '+ MIN +' for ' + name);
                return false;
            }
            return true;
        } catch (e) {
            this.errors.push('Could not retreive TLOS balance: ' + e.message);
            return false;
        }
    }
    async run(){
        if(process.env.TSK_DELPHI_BRIDGE_EVM_CONTRACT == "" || process.env.TSK_DELPHI_BRIDGE_NATIVE_EVM_ADDRESS == "") { this.end(); return; }
        const evmBalance = await this.getBalance(process.env.TSK_DELPHI_BRIDGE_EVM_CONTRACT, 'EVM contract');
        if(evmBalance){
            const bridgeBalance = await this.getBalance(process.env.TSK_DELPHI_BRIDGE_NATIVE_EVM_ADDRESS, 'Native contract EVM address');
            if(bridgeBalance){
                this.checkAccountLimits('delphibridge', process.env.TSK_DELPHI_BRIDGE_MIN_RESSOURCE);
            }
        }
        await this.save();
        this.end();
    }
}

let test = new DelphiOracleBridge();
test.run();