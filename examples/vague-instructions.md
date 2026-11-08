# Example vague instructions

Each example shows a vague instruction, what the layer should understand, what it assumes from context, and when it should ask. Use these to test the demo and to review contributions: a change is good when more of these come out right.

Context used below (the demo's default profile — a fictional persona): Alex follows the Chicago Bears, runs a Weekend Bakery, prefers posting on X, likes a funny tone, and has no paid X account.

## 1. "post bears content"

- **Intent:** post
- **Topic:** Chicago Bears (from interests)
- **Platform:** X (from preference: defaultPlatform)
- **Assumptions:** platform X; tone funny; spaced through today (from routine)
- **Confidence:** medium — topic and platform were assumed, not stated
- **Question:** none

## 2. "remind me about the thing tomorrow"

- **Intent:** remind
- **Task:** ??? — "the thing" has no referent in the profile
- **Time:** tomorrow
- **Confidence:** low — the task slot is missing
- **Question:** "Which thing should I remind you about?"

## 3. "text sam"

- **Intent:** message
- **Person:** Sam (from people)
- **Message body:** ??? — nothing to send yet
- **Confidence:** low — the content slot is missing
- **Question:** "What should I tell her?"

## 4. "get milk"

- **Intent:** buy
- **Item:** milk
- **Confidence:** high — the item was stated outright
- **Question:** none
- **Note:** a shopping provider could add "usual store" as an assumption; without one, don't invent it.

## 5. "schedule the thing for Friday"

- **Intent:** schedule
- **Event:** ??? — "the thing" has no referent
- **Time:** Friday
- **Confidence:** low
- **Question:** "What's the event?"

## 6. "make it funnier"

- **Intent:** unknown on its own — this is a follow-up, not a fresh instruction
- **Expected behavior:** the layer should apply it to the last action (e.g. rewrite the last draft funnier), not ask "make what funnier?"
- **Status:** follow-ups are on the roadmap, not in the prototype yet.

## 7. "post it"

- **Intent:** post
- **Topic/platform:** from the last action in the conversation
- **Expected behavior:** same as #6 — needs conversation memory. Roadmap.

## 8. "what's the weather like tomorrow"

- **Intent:** search
- **Query:** weather tomorrow
- **Confidence:** high — everything needed was stated
- **Note:** answering needs a weather provider; the layer's job is understanding the request, not fetching the forecast.
