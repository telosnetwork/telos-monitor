import fs from 'fs';
import dotenv from 'dotenv/config';
import AWS from 'aws-sdk';

const EMAIL_LIST = process.env.EMAIL_JSON;

export default class Mailer {
    constructor(){
        AWS.config.update({region: 'us-east-1'});
        this.sdk = new AWS.SES({apiVersion: '2010-12-01'});
    }
    getParams(emails, task, message, cat){
        return {
            Destination: {
                ToAddresses: emails
            },
            Message: {
                Body: {
                    Html: {
                        Charset: "UTF-8",
                        Data: this.formatHTMLMessage(task, message, cat)
                    },
                    Text: {
                        Charset: "UTF-8",
                        Data: "An alert for task " + task + " was saved: " + message
                    }
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: "[" + process.env.CHAIN + "] Alert for " + task + " (" + cat + ")"
                }
            },
            Source: 'noreply@telos.net', /* required */
            ReplyToAddresses: [],
        };
    }
    formatHTMLMessage(task, message, cat){
        var date = new Date();
        return "<!DOCTYPE html><html><body><h1 style='text-align:center;'>Alert for "+ task +" !</h1><div style='margin-top:50px;text-align: left;'><p>An alert for task <b>"+task+"</b> on "+ process.env.CHAIN.toLowerCase() +" was saved...</p><table cellspacing='0' cellpadding='0' style='text-align: left;width:100%;'><tr><th style='padding-right: 20px;'>Date</th><td>"+ date.toUTCString() +"</td></tr><tr><th style='padding-right: 20px;'>Chain</th><td>"+ process.env.CHAIN.toLowerCase() +"</td></tr><tr><th style='padding-right: 20px;'>Category</th><td>"+ cat +"</td></tr><tr><th>Task</th><td>" + task+ "</td></tr><tr><th style='padding-right: 20px;'>Message</th><td>"+message+"</td></tr></table></div><p style='margin-top:20px;'><a href='"+ process.env.DASHBOARD_URL +"' target='_blank'>Visit Telos Monitoring</a></p><small style='margin-top:60px;display:block;'>To unsubscribe from this mailing list please edit <a href='https://github.com/telosnetwork/telos-monitor/blob/master/emails-to-notify.json' target='_blank'>this file</a> and submit a PR. </small> </body></html>"
    }
    async notify(task, cat, message){
        if(message == "") return;
        const emails = this.getEmails(task);
        if(emails.length == 0){
            console.log('No subscribed emails found');
            return;
        }
        await this.sendEmail(this.getParams(emails, task, message, cat));
        return;
    }
    getEmails(task){
        let filtered = [];
        let emails = JSON.parse(fs.readFileSync(EMAIL_LIST));
        emails.forEach(row => {
            if(row.subscriptions.length == 0 || row.subscriptions.includes(task)){
                filtered.push(row.email);
            }
        })
        return filtered;
    }
    async sendEmail(params) {
        console.log("... Sending email")
        try {
            const results = await this.sdk.sendEmail(params).promise();
            console.log("... Email sent:", results.MessageId, "to", params.Destination.ToAddresses.length, "subscribers")
        } catch (err) {
            console.error(err);
        }
    }
}