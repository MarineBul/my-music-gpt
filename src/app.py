from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from back import *

app = Flask(__name__)
cors = CORS(app)


# Definition of the API returning GPT answer to an obstetric related question
@app.route('/api/query', methods=['POST'])
def receive_question():
    try:
        # Obtain the question data from the front
        data = request.get_json()
        question = data.get('query')
        if len(question)==0:
            question.append(" ") 
        print("question:", question)

        # Recovering the embeddings
        df_embeddings=pd.read_csv('src/embeddings_complete.csv', index_col=0)
        #print(df_embeddings.head())
        df_embeddings['embeddings'] = df_embeddings['embeddings'].apply(eval).apply(np.array)
        
        # Generation of the answer
        (answer, sources) =  generate_answer(question,df_embeddings, deployment=deployment_name)
        print(sources)
        sources_to_print = {}
        for src in sources:
            print(src)
            if src[0] in sources_to_print:
                sources_to_print[src[0]].append(src[1]+1)
            else:
                sources_to_print[src[0]] = [src[1]+1]
 
        # Creation of the json answer
        if "I don\'t know" in answer:
            sources_to_print={}
        response = {
            'message': f"{question}",
            'answer': f"{answer}",
            'sources':f"{json.dumps(sources_to_print)}",
        }
        
        return jsonify({'message': response})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=3001, debug=True) 