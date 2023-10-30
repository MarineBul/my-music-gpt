from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from back import *

app = Flask(__name__)
cors = CORS(app)
# Gestion de la route POST pour recevoir la question du frontend
@app.route('/api/query', methods=['POST'])
def receive_question():
    try:
        data = request.get_json()
        question = data.get('query')
        print("query : ", question)
        df_embeddings=pd.read_csv('src/embeddings.csv', index_col=0)
        print(df_embeddings['embeddings'][1])
        df_embeddings['embeddings'] = df_embeddings['embeddings'].apply(eval).apply(np.array)

        answer =  generate_answer(question,df_embeddings, deployment=deployment_name)

        # Vous pouvez traiter la question ici, par exemple, renvoyer une réponse.
        # Pour cet exemple, nous allons simplement renvoyer un message de confirmation.
        response = {
            'message': f"Vous avez posé la question : '{question}'",
            'answer': f"Voici la réponse à votre question : {answer}",
        }
        # Envoyer une réponse JSON au frontend
        return jsonify({'message': response})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=3001)  # Vous pouvez utiliser un autre port si nécessaire
