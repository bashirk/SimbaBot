"use strict";

const PAYLOADS = require("./payloads.js");

class Bot {
    constructor(bot_config) {
        this.fba_client = bot_config.fba_client;
        this.messenger_client = bot_config.messenger_client;
        this.customer_service_app_id = bot_config.customer_service_app_id;
        this.survey_type = bot_config.survey_type;
    }

    async handleText(event_type, sender_info, webhook_event) {
        let recipient = {
            id: sender_info.value,
        };

        // Determine which action to take
        if (webhook_event.message &&
            webhook_event.message.quick_reply) {
            // Check if user responded to CSAT or NPS survey
                if ((PAYLOADS.CSAT_QUICK_REPLIES.map(qr => qr.payload).includes(webhook_event.message.quick_reply.payload) ||
                PAYLOADS.NPS_QUICK_REPLIES.map(qr => qr.payload).includes(webhook_event.message.quick_reply.payload))
            ) {
                try {
                    const rating = webhook_event.message.quick_reply.payload;
                    switch (this.survey_type) {
                        case "CSAT":
                            console.log(`Logging CSAT rating "${rating}" for user ${recipient.id}`);
                            this.fba_client.logCSATResponse(rating, recipient.id);
                            break;
                        case "NPS":
                            console.log(`Logging NPS rating "${rating}" for user ${recipient.id}`);
                            this.fba_client.logNPSResponse(rating, recipient.id);
                            break;
                    }
                    this.messenger_client.sendText(
                        recipient,
                        "Thank you for your feedback!"
                    );
                } catch(e) {
                    console.error(e);
                }
            }

            // Check if user responded to "Do you want to talk to an agent?"
            else if (PAYLOADS.CONFIRM_HANDOVER_QUICK_REPLIES.map(qr => qr.payload).includes(webhook_event.message.quick_reply.payload)) {
                if (webhook_event.message.quick_reply.payload === PAYLOADS.COMMAND_PAYLOADS.customer_care_accept) {
                    // User requested to talk to an agent -> hand over to the customer service app
                    try {
                        // Let user know that we are handing over
                        await this.messenger_client.sendText(
                            recipient,
                            "Okay, I am connecting you with an agent. That could take a couple of minutes - you will be notified as soon as possible.",
                        );

                        // Pass thread control to the secondary receiver
                        await this.messenger_client.passThreadControl(
                            recipient.id,
                            this.customer_service_app_id,
                            "some-handover-metadata",
                        );

                        // Send a Quick Reply so that the user can cancel the request if needed
                        let text = "In the meantime, you can send additional context or cancel your request if you don't need help anymore.";
                        let quick_replies = [
                            {
                                content_type: "text",
                                title: "Cancel request",
                                payload: PAYLOADS.COMMAND_PAYLOADS.customer_care_cancel,
                            }
                        ];
                        await this.messenger_client.sendQuickReplies(recipient, quick_replies, text);
                    } catch (e) {
                        console.error("Error while handing over thread control to secondary receiver.");
                    }
                }
                else if (webhook_event.message.quick_reply.payload === PAYLOADS.COMMAND_PAYLOADS.customer_care_reject) {
                    // User rejected the offer to talk to an agent
                    try {
                        await this.messenger_client.sendText(
                            recipient,
                            "Great choice! 🙂 Quick reminder that I learn from conversations 🙂🙂",
                        );
                        await this.messenger_client.sendText(
                            recipient,
                            "So. Go on with your queries 👩‍💻🙂",
                        );
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        }

        // Direct request for agent through persistent menu or text entry
        else if ((webhook_event.postback &&
            webhook_event.postback.payload === PAYLOADS.COMMAND_PAYLOADS.persistent_menu_agent_cta_payload) ||
            webhook_event.message.text.includes("talk") && webhook_event.message.text.includes("agent")
        ) {
            const quick_replies = PAYLOADS.CONFIRM_HANDOVER_QUICK_REPLIES.map(qr => {
                return {
                    content_type: "text",
                    title: qr.title,
                    payload: qr.payload,
                }
            });

            try {
                this.messenger_client.sendQuickReplies(
                    recipient,
                    quick_replies,
                    "Do you want me to hand you over to our customer service?");
            } catch(e) {
                console.error(e);
            }
        }

        // Get Started setup
        else if ((webhook_event.postback &&
            webhook_event.postback.payload === PAYLOADS.COMMAND_PAYLOADS.GET_STARTED)
        ) {
            await this.messenger_client.sendText(
                recipient,
                "Hi there! I'm Simba Bot 🦁, personal assistant for DeliveryNow NG, and I'm here to make your life better. I do not know much, but I definitely learn from conversations to get better, I also have smart human friends who can help if I cannot answer your question. 🤓",
            );
            await this.messenger_client.sendText(
                recipient,
                "So. How can I help you today? 🙂",
            );
        }
        
        else if (webhook_event.message) {
            // Catch all section. Any special commands would have been processed above.
            // Use built-in NLP to determine what the user wants.
            let ents = null;
            const nlpThreshold = 0.5;

            if (webhook_event.message.nlp) {
                console.log("NLP data:");
                console.log(JSON.stringify(webhook_event.message.nlp));
                ents = webhook_event.message.nlp.entities;
            }

            if (ents && ents.greetings && ents.greetings[0].confidence > nlpThreshold) {
                await this.messenger_client.sendText(
                    recipient,
                    "Hi there! I'm Simba Bot 🦁, personal assistant for DeliveryNow NG, and I'm here to make your life better. I do not know much, but I definitely learn from conversations to get better, I also have smart human friends who can help if I cannot answer your question. 🤓",
                );
                await this.messenger_client.sendText(
                    recipient,
                    "So. How can I help you today? 🙂",
                );
            }

            else if (ents && ents.thanks && ents.thanks[0].confidence > nlpThreshold) {
                await this.messenger_client.sendText(
                    recipient,
                    `Glad I was able to help you! 🙂🤓🙂`,
                );
                await this.messenger_client.sendText(
                    recipient,
                    "So. Is there anything I might be of help to you for? 🙂",
                );
            }

            else if (ents && ents.working_hour && ents.working_hour[0].confidence > nlpThreshold) {
                await this.messenger_client.sendText(
                    recipient,
                    `Hi Hi! So our working hour is Mondays through Sundays, and from 8AM to 6PM daily. 🤓`,
                );
                await this.messenger_client.sendText(
                    recipient,
                    "Anything else I might help you with? 🙂",
                );
            }

            else if (ents && ents.your_location && ents.your_location[0].confidence > nlpThreshold) {
                await this.messenger_client.sendText(
                    recipient,
                    `Hi there! We do have an office location at 15, Palace of Joy, Behind De-Links Hotel, Adehun, Ado-Ekiti 🤓`,
                );
                await this.messenger_client.sendText(
                    recipient,
                    "Anything else I might help you with? 🙂",
                );
            }

            else if (ents && ents.reminder && ents.reminder[0].confidence > nlpThreshold) {
                this.messenger_client.sendText(
                    recipient,
                    "Alright. This has been noted! 👋",
                );
            }

            else if (ents && ents.anyone_available && ents.anyone_available[0].confidence > nlpThreshold) {
                await this.messenger_client.sendText(
                    recipient,
                    `Hi! We are available Mondays to Sundays, from 8AM to 6PM daily. We do have happy agents that would get your needs delivered in no time 🤓`,
                );
                await this.messenger_client.sendText(
                    recipient,
                    "I can have a meaningful conversation with you as well. Anything I might help you with? 🙂",
                );
            }

            else if (ents && ents.local_search_query && ents.local_search_query[0].confidence > nlpThreshold) {
                await this.messenger_client.sendText(
                    recipient,
                    "Hi Hi! So our working hour is Mondays through Fridays, and from 8AM to 6PM daily. 🤓`",
                );
                await this.messenger_client.sendText(
                    recipient,
                    "Send me 'About Company' so I can send a link to our business' website About section 🙂",
                );
            }

            else if (ents && ents.your_business && ents.your_business[0].confidence > nlpThreshold) {
                this.messenger_client.sendText(
                    recipient,
                    "Alright! So we are an on-demand food and grocery delivery service, operating in Nigeria 🤓`",
                );
            }

            else if (ents && ents.are_you_here && ents.are_you_here[0].confidence > nlpThreshold) {
                this.messenger_client.sendText(
                    recipient,
                    `Hi hello! 👋 yes I'm here with you 🤓`,
                );
            }

            else if (ents && ents.alright && ents.alright[0].confidence > nlpThreshold) {
                await this.messenger_client.sendText(
                    recipient,
                    `Yep. Thanks🤓`,
                );
                await this.messenger_client.sendText(
                    recipient,
                    "Any anything I might help you with? 🙂",
                );
            }

            else if (ents && ents.our_services && ents.our_services[0].confidence > nlpThreshold) {
                await this.messenger_client.sendText(
                    recipient,
                    `We offer an on-demand delivery service. With our platform, you can easily get items from restaurants and stores delivered to you, easily and at low-cost! 🤓`,
                );
                await this.messenger_client.sendText(
                    recipient,
                    "Any other query I might help provide an answer for? Happy to help 🙂",
                );
            }
            
            else if (ents && ents.location && ents.location[0].confidence > nlpThreshold) {
                this.messenger_client.sendText(
                    recipient,
                    `Hi, 👋 we are located on Messenger as at now. We are looking to scale global offices soon `,
                );
            }

            else if (ents && ents.appointment && ents.appointment[0].confidence > nlpThreshold) {
                this.messenger_client.sendText(
                    recipient,
                    "Hi, when do you want to have your appointment booked?",
                );
                if (ents && ents.datetime && ents.datetime[0].confidence > nlpThreshold) {
                    this.messenger_client.sendText(
                        recipient,
                        "Great! When do you want the appointment to last for?",
                    );
                }
                if (ents && ents.duration && ents.duration[0].confidence > nlpThreshold) {
                    this.messenger_client.sendText(
                        recipient,
                        "Awesome! I have just saved a reminder for your appointment booking.",
                    );
                } 
            }

            else if (ents && ents.bye && ents.bye[0].confidence > nlpThreshold) {
                this.messenger_client.sendText(
                    recipient,
                    "Bye! It was a pleasure assisting you 👋",
                );
            }

            else if (ents && ents.thanks && ents.thanks[0].confidence > nlpThreshold) {
                this.messenger_client.sendText(
                    recipient,
                    "You are welcome! 👍",
                );
            }

            else if (webhook_event.message.text.includes("About") && webhook_event.message.text.includes("Company")) {
                let generic_template = {
                    template_type: "generic",
                    elements: [
                        {
                            title: "DeliveryNow NG | About us",
                            subtitle: "Learn more about our mission to help Africans with low-cost access to their needs.",
                            image_url: "https://deliverynow.com.ng/assets/img/various/1590847350hfsgcubbDq.jpg?v=1590847350UXJLj",
                            default_action: {
                                type: "web_url",
                                url: "https://deliverynow.com.ng",
                                webview_height_ratio: "full",
                            },
                            buttons: [
                                {
                                    type: "phone_number",
                                    title: "Call A Representative",
                                    payload: "+2347015117163"
                                },
                                {
                                    type: "web_url",
                                    url: "https://deliverynow.com.ng",
                                    webview_height_ratio: "full",
                                    title: "About Us",
                                }
                            ]
                        }
                    ]
                };
                try {
                    this.messenger_client.sendTemplate(recipient, generic_template)
                } catch (e) {
                    console.error(e);
                }
            }

            else if (webhook_event.message.text.includes("sales") && webhook_event.message.text.includes("rep")) {
                let generic_template = {
                    template_type:"button",
                        text:"Need further assistance? Talk to a representative",
                            buttons:[
                                {
                                    type:"phone_number",
                                    title:"Call Representative",
                                    payload:"+2347015117163"
                                }
                             ]
                            
                         }
                    };
                try {
                    this.messenger_client.sendTemplate(recipient, generic_template)
                } catch (e) {
                    console.error(e);
                }
            }

            else if (webhook_event.message.text.includes("Get") && webhook_event.message.text.includes("Started") || webhook_event.message.text.includes("get") && webhook_event.message.text.includes("started")) {
                this.messenger_client.sendText(
                    recipient,
                    "Hi there! I'm Simba Bot 🦁, personal assistant for DeliveryNow NG, and I'm here to make your life better. I do not know much, but I definitely learn from conversations to get better, I also have smart human friends who can help if I cannot answer your question. 🤓",
                );
            }

            else {
                const quick_replies = PAYLOADS.CONFIRM_HANDOVER_QUICK_REPLIES.map(qr => {
                    return {
                        content_type: "text",
                        title: qr.title,
                        payload: qr.payload,
                    }
                });
    
                try {
                    this.messenger_client.sendQuickReplies(
                        recipient,
                        quick_replies,
                        "I'm not quite sure what you mean by that. Would you like to talk to our customer service?");
                } catch(e) {
                    console.error(e);
                }
            }    
        }

    async handleHandover(event_type, sender_info, webhook_event) {
        let recipient = {
            id: sender_info.value,
        };

        if (webhook_event.pass_thread_control) {
            // Thread control has been passed back to the bot -> follow up with a survey.
            let text, raw_quick_replies;

            switch (this.survey_type) {
                case "CSAT":
                    test = "How satisfied are you with our service today?"
                    raw_quick_replies = PAYLOADS.CSAT_QUICK_REPLIES;
                    break;
                case "NPS":
                    text = "Based on your experience today, how likely is it that you would recommend us to a friend or colleague?"
                    raw_quick_replies = PAYLOADS.NPS_QUICK_REPLIES;
                    break;
            }
            
            try {
                const quick_replies = raw_quick_replies.map(response => {
                    return {
                        content_type: "text",
                        title: response.title,
                        payload: response.payload,
                    };
                });
                this.messenger_client.sendQuickReplies(recipient, quick_replies, text)
            } catch(e) {
                console.error(e);
            }
        }
    }

    async handleStandby(event_type, sender_info, webhook_event) {
        // These are events that are passed to the bot while customer service is dealing with the request.
        let recipient = {
            id: sender_info.value,
        };

        // Check whether the user wants to cancel the handover request and talk to the bot again.
        if ((webhook_event.message &&
            webhook_event.message.quick_reply &&
            webhook_event.message.quick_reply.payload === PAYLOADS.COMMAND_PAYLOADS.customer_care_cancel) ||
            webhook_event.postback && webhook_event.postback.payload === PAYLOADS.COMMAND_PAYLOADS.customer_care_cancel
        ) {
            try {
                await this.messenger_client.takeThreadControl(recipient.id, "Customer has requested that I take the thread control from you.");
                this.messenger_client.sendText(recipient, "You are now talking to Simba again. 🤖");
            } catch(e) {
                console.error(e);
            }
        }
        
        else {
            // You can listen for other user messages or commands here.
        }
    }
}

module.exports = Bot;
