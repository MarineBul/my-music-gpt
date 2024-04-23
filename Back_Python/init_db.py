import chromadb
import pandas as pd
import numpy as np

df_complete = pd.read_csv("embeddings_complete.csv")
df_complete = df_complete.drop(['Unnamed: 0'], axis=1)

path = "chroma-db/"
chroma_client = chromadb.PersistentClient(path)
collection = chroma_client.create_collection(name="embeddings_1500", metadata={"hnsw:space": "cosine"})

chroma_client.get_collection("embeddings_1500")

df_complete['embeddings'] = df_complete['embeddings'].apply(eval).apply(np.array)

collection.add(
    embeddings=[arr.tolist() for arr in df_complete['embeddings'].to_list()],
    documents=df_complete['text'].to_list(),
    metadatas=df_complete.apply(
        lambda row: {"title": row['title'], "page": str(row['page_number']), "tokens": str(row['n_tokens'])},
        axis=1).tolist(),
    ids=[str(i) for i in range(len(df_complete))]
)
