from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from back import *
import json
import ast
import io
import atexit

app = Flask(__name__)
cors = CORS(app)

#History = []

# def load_history():
#     global History
#     file_path = "public/History.json"
#     if os.path.exists(file_path):
#         with open(file_path, "r") as f:
#             History = json.load(f)
#             print("history loaded")
#     else:
#         with io.open(os.path.join("public/", 'History.json'), 'w') as history_file:
#             history_file.write(json.dumps([]))

@app.route('/api/save', methods=['POST'])
def save_history():
    try: 
        History = request.get_json().get('history')
        if (History != [[]]):
            print("\nSaving history to file...")
            with open("public/History.json", "w") as f:
                json.dump(History, f)
            print("History saved successfully.")
        return jsonify({'message': 'succesfully saved'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Definition of the API returning GPT answer to a music-therapy related question
@app.route('/api/query', methods=['POST'])
def receive_question():
    try:
        # Obtain the question data from the front
        data = request.get_json()
        question = data.get('query')
        history = data.get('history')
        if len(question)==0:
            question.append(" ") 
        print("question:", question)
        
        # Generation of the answer
        print(history)
        (answer, sources) =  generate_answer(question, history, deployment=deployment_name)
        #print(sources)
        sources_to_print = {}
        for src in sources:
            #print(src)
            if src[0] in sources_to_print:
                sources_to_print[src[0]].append(src[1]+1)
            else:
                sources_to_print[src[0]] = [src[1]+1]
 
        # Creation of the json answer
        if "I don\'t know" in answer:
            sources_to_print={}
        response = {
            'query': f"{question}",
            'answer': f"{answer}",
            'sources':sources_to_print,
        }
        
        #History.append(response)
        
        return jsonify({'message': response})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    #load_history()
    atexit.register(save_history)
    app.run(port=3001, debug=True) 