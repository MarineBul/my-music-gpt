import os
import requests
import json
import openai
import pandas as pd
import numpy as np
import chromadb
from openai.embeddings_utils import distances_from_embeddings

openai.api_key = os.getenv("OpenAIKey")
openai.api_base = "https://invuniandesai.openai.azure.com/"
openai.api_type = 'azure'
openai.api_version = '2023-05-15'

deployment_name='gpt-35-turbo-rfmanrique'

path = "C:/Users/Marine/Documents/CO_uniandes/0_Tesis/my-music-gpt/src"
chroma_client = chromadb.PersistentClient(path)
collection = chroma_client.get_collection("test_persist")

def create_context(question, df, max_len=1800, size="ada"):
    
    """
    Create a context for a question by finding the most similar context from the dataframe
    """
    # Get the embeddings for the question
    q_embeddings = openai.Embedding.create(input=question, engine='text-embedding-ada-002-rfmanrique')['data'][0]['embedding']
    # Get the distances from the embeddings
    results = collection.query(query_embeddings=q_embeddings, n_results=10)

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
        if ("yes" in (response['choices'][0]['message']['content'].lower())):
            cur_len += int(tokens) + 4
            returns.append(document)
            temp.append(title)
            temp.append(int(page))
            sources.append(temp)
    
    # Return the context
    return (("\n\n###\n\n".join(returns)), sources)

def generate_answer(question,df_embeddings, deployment=deployment_name):
    
    context, sources = create_context(question, df_embeddings, max_len=1800, size="ada")
    response = openai.ChatCompletion.create(
        engine= deployment_name, 
        messages=[
            {"role": "system", "content": "You are a music therapist."},
            {"role": "user", "content": f"Answer the question based on the context below, and if the question can't be answered based on the context, say \"I don't know\"\n\nContext: {context}\n\n---\n\nQuestion: {question}\nAnswer:"},
        ]
    )
    #print(response)
    return ((response['choices'][0]['message']['content']),sources)