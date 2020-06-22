else if (webhook_event.postback && webhook_event.postback.payload) 
            {

                // Get Started setup
                if ((webhook_event.postback &&
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

                // About me setup
                else if ((webhook_event.postback &&
                    webhook_event.postback.payload === PAYLOADS.COMMAND_PAYLOADS.ABOUT_ME)
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

                // Direct request for agent through persistent menu or text entry
                else if ((webhook_event.postback &&
                    webhook_event.postback.payload === PAYLOADS.COMMAND_PAYLOADS.persistent_menu_agent_cta_payload)
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
                            "Are you interested in talking to a real human support?");
                    } catch(e) {
                        console.error(e);
                    }
                }
            }