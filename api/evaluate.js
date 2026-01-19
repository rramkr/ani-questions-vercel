// Vercel Serverless Function to evaluate student answers using Claude API
const Anthropic = require('@anthropic-ai/sdk').default;

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { questionType, question, userAnswer, referenceAnswer, word, meaning } = req.body;

    if (!userAnswer || userAnswer.trim().length === 0) {
        return res.status(400).json({ error: 'No answer provided' });
    }

    try {
        const client = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY
        });

        let prompt;

        if (questionType === 'make_sentences') {
            prompt = `You are evaluating a student's sentence for an English class.

Word: ${word}
Meaning: ${meaning}

Student's sentence: "${userAnswer}"

Please evaluate the sentence on these criteria:
1. Does the sentence use the word "${word}" correctly based on its meaning?
2. Is the sentence grammatically correct?
3. Does it have at least 10 words? (Count the words)

Provide your evaluation in this exact JSON format:
{
    "wordCount": <number>,
    "usesWordCorrectly": <true/false>,
    "isGrammaticallyCorrect": <true/false>,
    "hasMinWords": <true/false>,
    "overallScore": "<Excellent/Good/Needs Improvement>",
    "feedback": "<brief constructive feedback in 1-2 sentences>"
}

Only respond with the JSON, nothing else.`;
        } else {
            prompt = `You are evaluating a student's answer for an exam.

Question: ${question}

Reference Answer: ${referenceAnswer}

Student's Answer: "${userAnswer}"

Please evaluate how well the student's answer matches the reference answer. Consider:
1. Are the key points covered?
2. Is the answer accurate?
3. Is the explanation clear?

Provide your evaluation in this exact JSON format:
{
    "score": "<Excellent/Good/Partial/Needs Improvement>",
    "keyPointsCovered": "<percentage like 80%>",
    "feedback": "<brief constructive feedback in 2-3 sentences explaining what was good and what could be improved>"
}

Only respond with the JSON, nothing else.`;
        }

        const message = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 500,
            messages: [
                { role: 'user', content: prompt }
            ]
        });

        const responseText = message.content[0].text.trim();

        // Parse the JSON response
        let evaluation;
        try {
            evaluation = JSON.parse(responseText);
        } catch (e) {
            // If JSON parsing fails, return raw text as feedback
            evaluation = {
                score: 'Evaluated',
                feedback: responseText
            };
        }

        return res.status(200).json({
            success: true,
            evaluation
        });

    } catch (error) {
        console.error('Evaluation error:', error);
        return res.status(500).json({
            error: 'Failed to evaluate answer',
            message: error.message
        });
    }
};
