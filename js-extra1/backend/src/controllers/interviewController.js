import axios from "axios";

// Helper to get domain topics for AI prompt
const getDomainTopics = (domain) => {
  const mapping = {
    "frontend-developer": "React, JavaScript, CSS, Performance, Web Accessibility",
    "ai-ml-engineer": "Python, Machine Learning models, Neural Networks, Statistics, Data Pipelines",
    "ui-ux-designer": "Design systems, User Research, Wireframing, Figma, Accessibility",
    "backend-developer": "Node.js, REST APIs, System Design, Databases (SQL/NoSQL), Security",
    "data-analyst": "SQL, Python/R, Data Visualization, Case Studies, A/B Testing"
  };
  return mapping[domain] || "General software engineering and problem-solving";
};

// @desc    Start an AI interview session
// @route   POST /api/v1/interview/start
// @access  Private
export const startInterview = async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain) {
      return res.status(400).json({ success: false, message: "Domain is required" });
    }

    const friendlyDomain = domain.replace(/-/g, " ");
    
    res.status(200).json({
      success: true,
      data: {
        domain,
        message: `Welcome to your ${friendlyDomain} interview. I am your AI coach. Are you ready for your first question?`,
        questionCount: 0
      }
    });
  } catch (error) {
    console.error("Start interview error:", error);
    res.status(500).json({ success: false, message: "Failed to start interview session" });
  }
};

// @desc    Evaluate answer and get next question from Groq
// @route   POST /api/v1/interview/evaluate
// @access  Private
export const evaluateAnswer = async (req, res) => {
  try {
    const { domain, question, answer, questionCount } = req.body;

    if (!domain || !answer) {
      return res.status(400).json({ success: false, message: "Domain and answer are required" });
    }

    // Process up to 5 questions
    if (questionCount >= 5) {
      return res.status(200).json({
        success: true,
        data: {
          isComplete: true,
          message: "Interview complete! Great job. You can review your feedback below."
        }
      });
    }

    const topics = getDomainTopics(domain);
    const friendlyDomain = domain.replace(/-/g, " ");

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ success: false, message: "GROQ API Key is missing on the server" });
    }

    const systemPrompt = `You are an expert technical interviewer for the ${friendlyDomain} role. 
The candidate is answering this question: "${question || "Are you ready?"}".
The core topics for this role are: ${topics}.

Evaluate the candidate's answer.
Provide a score out of 10.
Provide short, constructive feedback.
Generate the NEXT technical interview question based on the role topics.

You MUST respond in pure JSON format exactly like this, with no markdown formatting or extra text:
{
  "score": 8,
  "feedback": "Short feedback here.",
  "nextQuestion": "Next technical question here?"
}`;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `My answer: ${answer}` }
        ],
        temperature: 0.5,
        max_tokens: 500,
        response_format: { type: "json_object" }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const aiResponse = JSON.parse(response.data.choices[0].message.content);

    res.status(200).json({
      success: true,
      data: {
        isComplete: false,
        score: aiResponse.score,
        feedback: aiResponse.feedback,
        nextQuestion: aiResponse.nextQuestion,
        newQuestionCount: (questionCount || 0) + 1
      }
    });
  } catch (error) {
    console.error("Groq API Error:", error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      message: "Error communicating with AI coach. Please try again." 
    });
  }
};

// @desc    Generate comprehensive interview feedback summary
// @route   POST /api/v1/interview/feedback
// @access  Private
export const generateFeedback = async (req, res) => {
  try {
    const { domain, conversations } = req.body;

    if (!domain || !conversations || !conversations.length) {
      return res.status(400).json({ success: false, message: "Domain and conversations are required" });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ success: false, message: "GROQ API Key is missing on the server" });
    }

    const friendlyDomain = domain.replace(/-/g, " ");
    const topics = getDomainTopics(domain);

    // Build a transcript of the interview
    const transcript = conversations
      .map((msg) => `${msg.role === "user" ? "Candidate" : "Interviewer"}: ${msg.content}`)
      .join("\n\n");

    const systemPrompt = `You are a senior technical interview evaluator for the ${friendlyDomain} role.
The core topics for this role are: ${topics}.

Below is the full transcript of an interview session. Analyze ALL the candidate's answers holistically.

You MUST respond in pure JSON format exactly like this, with no markdown formatting or extra text:
{
  "overallScore": 7,
  "scoreOutOf": 10,
  "summary": "2-3 sentence overall performance summary",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "topicsToImprove": [
    { "topic": "Topic Name", "reason": "Why they need to improve this" },
    { "topic": "Topic Name", "reason": "Why they need to improve this" }
  ],
  "recommendation": "One paragraph of actionable advice for the candidate"
}`;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Here is the interview transcript:\n\n${transcript}` }
        ],
        temperature: 0.4,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const feedback = JSON.parse(response.data.choices[0].message.content);

    res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error("Feedback generation error:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Error generating feedback. Please try again."
    });
  }
};
