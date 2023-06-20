import fs from 'fs';
import dotenv from 'dotenv/config';
import { SES } from "@aws-sdk/client-ses";
import axios from 'axios';

const EMAIL_LIST = process.env.EMAIL_JSON;

export default class Mailer {
    constructor(){
        this.sdk = new SES({region: 'us-east-1', apiVersion: '2010-12-01'});
    }
    async sendTelegramMessage(message){
        if(parseInt(process.env.CHAIN_ID) !== 40) return;
        var token = process.env.TELEGRAM_TOKEN;
        if(!token) return;
        var chat_id = process.env.TELEGRAM_CHAT_ID;
        var url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chat_id}&text=${message}&parse_mode=html&disable_web_page_preview=true`;
        return await axios.get(url).then((response) => {
            console.log('Sent alert to Telegram');
            return true;
        }).catch((error) => {
            console.log(error);
            return false;
        });
    }
    formatStatuses(statuses, html, title){
        if(statuses.length){
            html += "<h4 style='margin: 0px;'>" + title +"</h4><ul>";
            for(let i = 0; i < statuses.length; i++){
                html += "<li>"+statuses[i]+"</li>";
            }
            html += "</ul>";
        }
        return html;
    }
    getParams(emails, task, errors, alerts, infos, cat){
        let message = "\n\n";
        let html = this.formatStatuses(errors, "", "Errors");
        html = this.formatStatuses(alerts, html, "Alerts");
        html = this.formatStatuses(infos, html, "Infos");
        errors.concat(alerts).concat(infos).forEach((status) => {
            message += status + "\n";    
        });
        return {
            Destination: {
                ToAddresses: emails
            },
            Message: {
                Body: {
                    Html: {
                        Charset: "UTF-8",
                        Data: this.formatHTMLMessage(task, html, cat)
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
    formatHTMLMessage(task, html, cat){
        var date = new Date();
        return "<!DOCTYPE html><html><body style='text-align:left;'><h1>Alert for "+ task +" !</h1><div style='margin-top:50px;'><p>An alert for task <b>"+task+"</b> on "+ process.env.CHAIN.toLowerCase() +" was saved...</p><table cellspacing='0' cellpadding='0' style='text-align: left;'><tr><th style='padding-right: 20px;'>Date</th><td>"+ date.toUTCString() +"</td></tr><tr><th style='padding-right: 20px;'>Chain</th><td>"+ process.env.CHAIN.toLowerCase() +"</td></tr><tr><th style='padding-right: 20px;'>Category</th><td>"+ cat +"</td></tr><tr><th>Task</th><td>" + task+ "</td></tr><tr><th></th><td><br /></td></tr><tr><th style='padding-right: 20px; vertical-align: top;'>Statuses</th><td style='vertical-align: top;'>"+html+"</td></tr></table></div><p style='margin-top:20px;'><a href='"+ process.env.DASHBOARD_URL +"' target='_blank'>Visit Telos Monitoring</a></p><small style='margin-top:60px;display:block;'>To unsubscribe from this mailing list please edit <a href='https://github.com/telosnetwork/telos-monitor/blob/master/emails-to-notify.json' target='_blank'>this file</a> and submit a PR. </small> </body></html>"
    }
    async notify(task, cat, errors, alerts, infos){
        if(errors.length === 0) return;
        try {
            if(await this.sendTelegramMessage("<b>Error(s) for " + cat + " " + task + ": </b>\n" + errors.join("\n") + "\n\n<a href='" + process.env.DASHBOARD_URL + "'>Visit Telos Monitoring</a>")){
               return;
            }
        } catch (error) {
            console.log('Telegram error: ', error, '. Sending message via email instead...');
        }
        const emails = this.getEmails(task);
        if(emails.length === 0){
            console.log('No subscribed emails found');
            return;
        }
        await this.sendEmail(this.getParams(emails, task, errors, alerts, infos, cat));
        return;
    }
    getEmails(task){
        let filtered = [];
        let emails = JSON.parse(fs.readFileSync(EMAIL_LIST))[0];
        emails[process.env.CHAIN.toLowerCase()].forEach(row => {
            if(row.subscriptions?.length == 0 || row.subscriptions?.includes(task)){
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