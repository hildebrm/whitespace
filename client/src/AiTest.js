import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: "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",
});

const completion = openai.chat.completions.create({
  model: "gpt-4o-mini",
  store: true,
  messages: [
    {"role": "user", "content": "write a haiku about ai"},
  ],
});

completion.then((result) => console.log(result.choices[0].message));