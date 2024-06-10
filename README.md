# Music therapy chatbot

Marine Buliard - 202326681 - Last updated 10/06/2023

## Description

This project is a chatbot specialized in music therapy for newborn babies, developped as part of a MISIS (Master's degree in Systems and Computation Engineering) thesis at Los Andes university, Columbia. The aim is to develop a medical chatbot able to provide accurate answers about music therapy using all papers on the matter up to 2022 (applyign the RAG framework). The answers are based on OpenAI's GPT-3.5 and GPT-4.

Assessor: Prof. Ruben Francisco Manrique

## How to use it?

### Install the libraries

To launch the project, ensure you have all required libraries. If this is not the case or you are unsure, please go to the Back_Python folder and run

pip intall -r requirements.txt

### Create the database

The database can be initialized by running the following in the Back_Python folder:

python init_db.py

This will instantiate a local database and fill it with the content of embeddings_complete.csv (this includes chunks of text, associated embeddings, title and page of the papers it is from and numbers of tokens)

### Launch the project

To be able to use the project, you must first create an environment variable called OpenAIKey35 and/or OpenAIKey4 (according to your needs) and enter your OpenAI key. You can also enter the key directly in the back.py file that can be encountered in the Back_Python folder.

To launch the application, open a powershell terminal in the Back_Python, and run the following command:

    python app.py

Go on your navigator on: http://127.0.0.1:3001

You'll be asked for a username and a password first. They can be modified in the Front_React/src folder. To do so, you must create a authConf.json file following the following format:

{
  "username": "your_new_username",
  "password": "your_new_password"
}

Then, use npm run build in the Front_React folder and move the content of the build folder into Back_Python/react_build

### Use the project

Once the project is launched, you can type in any questionin the search bar. However, if this question is not related to music therapy or if the information is not available from the database created for the project, the model will answer the question with "I don't know".

Here are a few examples of questions that should generate an answer:
*What is the ideal duration for a music therapy session?*
*How can music therapy be useful to newborn babies?*

On the other hand, the following examples might generate a simple "I don't know":
*What is the recipe for tiramisu?* (too far from the subject)
*What is the ideal artist for a 15-minute-long music therapy session for a 4-month old with a conjonctivitis?* (too precise, the database will not have a clear answer)
