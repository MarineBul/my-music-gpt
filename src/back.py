import os
import requests
import json
import openai
import pandas as pd
import numpy as np
import chromadb
from openai.embeddings_utils import distances_from_embeddings

openai.api_key = os.getenv("OpenAIKey35")
openai.api_base = "https://invuniandesai.openai.azure.com/"
openai.api_type = 'azure'
openai.api_version = '2023-05-15'

deployment_embeddings_name = 'text-embedding-ada-002-rfmanrique'
deployment_name ='gpt-35-turbo-rfmanrique'

path = "src/"
chroma_client = chromadb.PersistentClient(path)
collection = chroma_client.get_collection("test_persist")

def create_context(question, prev_questions, gpt4, max_len=1800, size="ada"):
    global deployment_embeddings_name
    global deployment_name
   
    # gpt4 is a boolean, so if it is true we want to change the API key and base, as well as the embedding's machine name
    if gpt4==True:
        openai.api_key = os.getenv("OpenAIKey4")
        openai.api_base = "https://invuniandesai-2.openai.azure.com/"
        deployment_embeddings_name = 'gpt4-embedding-ada-002'
        deployment_name='gpt-4-rfmanrique'
   
    # HyDE:
    first_response = openai.ChatCompletion.create(
            engine= deployment_name,
            messages=[
                {"role": "system", "content": "You are an amazing music therapist."},
                # You are a helpful medical knowledge assistant. Provide useful, complete, and 
                # scientifically-grounded answers to common consumer search queries about 
                # obstetric health.

                {"role": "user", "content": f"Rephrase the question to correct the grammatical errors and then answer the question taking into account the previously-asked questions, which are delimitated by three apostrophes. In your answer, you must include the previous question and the answer./\n\n---\n\nPrevious questions and their answers: '''{prev_questions}'''\n\nQuestion: {question}\nAnswer after the colon, with the rephrased question and the answer, without printing a distinct separation between the rephrased question and the answer:"},
            ]          
        )
    print("-------------- FIRST RESPONSE --------------\n", first_response['choices'][0]['message']['content'], "\n\n")

    """
    Create a context for a question by finding the most similar context from the dataframe
    """
    # Get the embeddings for the question
    q_embeddings = openai.Embedding.create(input=first_response['choices'][0]['message']['content'], engine=deployment_embeddings_name)['data'][0]['embedding']
    # else:
    #     q_embeddings = openai.Embedding.create(input=question, engine='text-embedding-ada-002-rfmanrique')['data'][0]['embedding']
    
    # Get the distances from the embeddings
    results = collection.query(query_embeddings=q_embeddings, n_results=20)

    returns = []
    sources = []
    cur_len = 0
    
    # Sort by distance and add the text to the context until the context is too long
    for i in range(len(results['ids'][0])):
        document = results['documents'][0][i]
        title = results['metadatas'][0][i]['title']
        page = results['metadatas'][0][i]['page']
        tokens= results['metadatas'][0][i]['tokens']
        
        # Add the length of the text to the current length
        temp = []

        # If the context is too long, break
        if cur_len > max_len:
            break
        context_chunk = document
        response = openai.ChatCompletion.create(
            engine= deployment_name, 
            messages=[
                {"role": "system", "content": "You are a music therapist."},
                {"role": "user", "content": f"Evaluate the relevance of the following context snippet to answer the following question in the field of music therapy: {context_chunk}\n\n---\n\nThe question is: {question}\nDo you consider it relevant for providing an accurate response in this field? Please respond only with 'yes' or 'no'."},
            ]          
        )
        #print('the problem\'s not on openai side')
        if ("yes" in (response['choices'][0]['message']['content'].lower())):
            cur_len += int(tokens) + 4
            returns.append(document)
            temp.append(title)
            temp.append(int(page))
            sources.append(temp)
    
    # Return the context
    return (("\n\n###\n\n".join(returns)), sources)

def generate_answer(question, history, gpt4, deployment=deployment_name):
    global deployment_name
    prev_questions = get_previous_questions(history)
    context, sources = create_context(question, prev_questions, gpt4, max_len=1800, size="ada")
    nb_tokens = 0
    for quest, ans in prev_questions:
        nb_tokens+=len(quest.split())+len(ans.split())
    if nb_tokens<2000:
        if gpt4==True:
            deployment_name='gpt-4-rfmanrique'
        response = openai.ChatCompletion.create(
            engine= deployment_name, 
            messages=[
                {"role": "system", "content": "You are an amazing music therapist."},
                {"role": "user", "content": f"Answer the question based on the context below and on the previous questions and the answers that have already been given. Give more importance to the previous question. If the question can't be answered based on the context, say \"I don't know\"\n\nContext: {context}\n\n---\n\nPrevious questions and their answers: {prev_questions}\n\nQuestion: {question}\nAnswer:"},
            ]
        )
        #print(response)
        return ((response['choices'][0]['message']['content']),sources)
    else:
        return('You cannot continue this conversation', [])

def get_previous_questions(history):
    questions= [[elem['query'], elem['answer']] for elem in history]
    return questions