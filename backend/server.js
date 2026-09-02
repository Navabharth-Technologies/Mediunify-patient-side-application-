require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

const PORT = 5000;

const OLLAMA_URL = 'http://127.0.0.1:11434/api/chat';

const MODEL = 'meditron:7b';


app.use(cors());

app.use(express.json());


/*
==================================================
UNNATHI ONECARE MEDICAL AI INSTRUCTIONS
==================================================
*/

const MEDICAL_INSTRUCTIONS = `
You are the Unnathi OneCare Health Assistant.

You are an AI health information assistant.

Your purpose is to provide general healthcare information
in simple and understandable language.

You can answer questions about:

- General health
- Symptoms
- Common diseases
- Medical terminology
- Blood tests
- Laboratory tests
- Medical reports
- Imaging and scans
- Nutrition
- Exercise
- Sleep
- Preventive healthcare
- General medication information
- Healthcare procedures
- Doctor specialities

IMPORTANT SAFETY RULES:

1. You are not a doctor.
2. Do not provide a definitive diagnosis.
3. Do not prescribe medication.
4. Do not provide personalized medication dosage.
5. Do not tell users to stop prescribed medication.
6. Provide general health information only.
7. Encourage users to consult a qualified doctor when appropriate.
8. If the user describes a medical emergency, tell them to seek
   emergency medical care immediately.
9. Do not claim that you examined the user.
10. Do not claim that you have access to the user's medical records.
11. Do not invent medical information.
12. Use simple language.
13. If the question is unclear, ask a clarification question.
14. For children, pregnancy, elderly patients, or serious conditions,
    recommend professional medical evaluation.

EMERGENCY SYMPTOMS INCLUDE:

- Severe chest pain
- Severe breathing difficulty
- Unconsciousness
- Severe bleeding
- Stroke symptoms
- Seizures
- Severe allergic reaction
- Suicidal thoughts
- Sudden severe neurological symptoms

For emergency symptoms, clearly advise the user to seek
urgent medical attention.

RESPONSE STYLE:

- Be clear.
- Be concise.
- Use bullet points when useful.
- Explain medical terms simply.
- Do not diagnose.
- Do not prescribe.
- Recommend a doctor when appropriate.

You are part of the Unnathi OneCare healthcare application.
`;


/*
==================================================
TEST ROUTE
==================================================
*/

app.get('/', (req, res) => {

  res.json({
    success: true,
    message: 'Unnathi OneCare backend is running.',
  });

});


/*
==================================================
CHATBOT API
==================================================
*/

app.post('/api/chatbot', async (req, res) => {

  try {

    const {
      message,
      history = [],
    } = req.body;


    if (!message || !message.trim()) {

      return res.status(400).json({

        success: false,

        message: 'Please enter a health question.',

      });

    }


    /*
    -----------------------------------------------
    Create conversation
    -----------------------------------------------
    */

    const messages = [

      {
        role: 'system',
        content: MEDICAL_INSTRUCTIONS,
      },

    ];


    /*
    -----------------------------------------------
    Add previous conversation
    -----------------------------------------------
    */

    history
      .slice(-10)
      .forEach((item) => {

        messages.push({

          role:
            item.sender === 'user'
              ? 'user'
              : 'assistant',

          content: item.message,

        });

      });


    /*
    -----------------------------------------------
    Add current question
    -----------------------------------------------
    */

    messages.push({

      role: 'user',

      content: message.trim(),

    });


    /*
    -----------------------------------------------
    Send request to Ollama
    -----------------------------------------------
    */

    const response = await fetch(
      OLLAMA_URL,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({

          model: MODEL,

          messages: messages,

          stream: false,

        }),

      }
    );


    if (!response.ok) {

      throw new Error(
        `Ollama returned HTTP ${response.status}`
      );

    }


    const data = await response.json();


    /*
    -----------------------------------------------
    Get AI answer
    -----------------------------------------------
    */

    const answer =
      data?.message?.content;


    if (!answer) {

      throw new Error(
        'Ollama returned an empty response.'
      );

    }


    /*
    -----------------------------------------------
    Send response to mobile app
    -----------------------------------------------
    */

    res.json({

      success: true,

      answer: answer.trim(),

    });


  } catch (error) {

    console.error(
      'Chatbot Error:',
      error.message
    );


    res.status(500).json({

      success: false,

      message:
        'Unable to connect to the Unnathi OneCare Health Assistant.',

      error:
        error.message,

    });

  }

});


/*
==================================================
START SERVER
==================================================
*/

app.listen(PORT, () => {

  console.log('');
  console.log(
    '=============================================='
  );

  console.log(
    '   UNNATHI ONECARE BACKEND'
  );

  console.log(
    '=============================================='
  );

  console.log(
    `Backend: http://localhost:${PORT}`
  );

  console.log(
    `Ollama:  ${OLLAMA_URL}`
  );

  console.log(
    `Model:   ${MODEL}`
  );

  console.log(
    '=============================================='
  );

  console.log('');

});