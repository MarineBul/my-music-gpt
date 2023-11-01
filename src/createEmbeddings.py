import os
import pandas as pd
import openai
import tiktoken
import PyPDF2

openai.api_key = "cf0bd49030ed4aa6a6509be1cd9d604b"
openai.api_base = "https://invuniandesai.openai.azure.com/"
openai.api_type = 'azure'
openai.api_version = '2023-05-15'


def process_to_txt():

    input_directory = "../MT_papers/1980-1989/"
    output_directory = "embeddings/txt_texts/"
    files=[]
    pages=[]
    raw_text = []
    
    for filename in os.listdir(input_directory):
        # Ouvrir le fichier PDF en mode lecture binaire ('rb')
        with open(input_directory+filename, 'rb') as pdf_file:
            # Créer un objet PDFReader
            try:
                pdf_reader = PyPDF2.PdfReader(pdf_file)

                # Parcourir chaque page du PDF
                for page_num in range(len(pdf_reader.pages)):
                    # Extraire le texte de la page
                    files.append(filename.split('.')[0])
                    pages.append(page_num)
                    raw_text.append(pdf_reader.pages[page_num].extract_text())
                    
            except Exception as e:
                print(pdf_file," ", e)
                
    df = pd.DataFrame([[files, pages, raw_text]], columns=['name', 'page', 'raw_text'])
    return df
                
max_tokens = 500

# Function to split the text into chunks of a maximum number of tokens
def split_into_many(text, max_tokens = max_tokens):
    
    # Split the text into paragraphs
    paragraphs = text.split('.\n')
    tokenizer = tiktoken.get_encoding("cl100k_base")
    # Get the number of tokens for each paragraph
    n_tokens = [len(tokenizer.encode(" " + paragraph)) for paragraph in paragraphs]

    chunks = []
    tokens_so_far = 0
    chunk = []

    # Loop through the sentences and tokens joined together in a tuple
    for paragraph, token in zip(paragraphs, n_tokens):

        # If the number of tokens so far plus the number of tokens in the current sentence is greater
        # than the max number of tokens, then add the chunk to the list of chunks and reset
        # the chunk and tokens so far
        if tokens_so_far + token > max_tokens:
            chunks.append(". ".join(chunk) + " ")
            chunk = []
            tokens_so_far = 0

        # If the number of tokens in the current sentence is greater than the max number of
        # tokens, go to the next sentence
        if token > max_tokens:
            continue

        # Otherwise, add the paragraph to the chunk and add the number of tokens to the total
        chunk.append(paragraph + " ")
        tokens_so_far += token + 1

    return chunks

def process_to_embeddings():
    shortened = []

    # Loop through the dataframe
    df = process_to_txt()
    for row in df.iterrows():
        
        # If the text is None, go to the next row
        if row[1]['raw_text'] is None:
            continue

        # If the number of tokens is greater than the max number of tokens, split the text into chunks
        if row[1]['n_tokens'] > max_tokens:
            shortened += split_into_many(row[1]['raw_text'])

        # Otherwise, add the text to the list of shortened texts
        else:
            shortened.append( row[1]['raw_text'] )
            
            
        print(shortened)
            
    df =  pd.DataFrame(shortened, columns = ['text'])
    
    #df['embeddings'] = df.text.apply(lambda x: openai.Embedding.create(input=x, engine='text-embedding-ada-002-rfmanrique')['data'][0]['embedding'])

    #df.to_csv('embeddings.csv')
    df.head()

if __name__ == '__main__':
    process_to_embeddings()