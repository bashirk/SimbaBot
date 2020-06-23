# SimbaBot
The one bot businesses need to keep customers engaged, and get them help in real time - using the handover protocol API

## Inspiration
Over the years, a number of businesses have shut down due to low engagement ratio with their users. Globally, 1 in 10 businesses shut or close up due to issues relating to customer retention and engagement. The tendency to be a player in solving this issue is the key mother to the project idea for this solution, the Simba Bot.

## What it does
Using the Messenger handover protocol API and quick replies, this bot is able to provide an unflinching customer support service for businesses (we partnered with DeliveryNow NG to test this beta version) whereby users can request for information about a specific business (DeliveryNow NG in this case), track orders, and reach out to a real human support via inbox (using the handover protocol API), or via phone call. The Simba Bot uses wit.ai to understand languages, while it spurts out coded-in responses based on the expressions and intents it receives.

Even after taking back the control of a conversation, the bot sends the user a short NPS (Net Promoter Score) survey using quick replies which helps measure customer satisfaction after it takes back a conversation from a real human using the handover protocol. The response of this survey is logged on Facebook Analytics, where the business can make meaningful decisions using the survey data.

## How we built it
Wit.ai is used in powering the bot, it serves as the brain. The bot was setup using the Messenger Node SDK, while the whole project is written in NodeJS.

## Challenges we ran into
Time was a major challenge, even though, we still work on this project day in day out, it isn't yet what we envision it to be.

## Accomplishments that we're proud of
Being able to write and run many conditions against the wit.ai entities in such a small amount of time, the project's GitHub commit history is a testament to this

## What we learned
It is not enough to write code for a virtual assistant, training the bot on wit.ai felt just as important as writing the code itself

## What's next for Simba Bot
To continue improving the bot, till it can run as a SaaS solution that provides real time support for businesses while also continuing to provide powerful analytics
