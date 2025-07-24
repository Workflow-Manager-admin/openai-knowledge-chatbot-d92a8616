#!/bin/bash
cd /home/kavia/workspace/code-generation/openai-knowledge-chatbot-d92a8616/frontend_chatbot_ui
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

