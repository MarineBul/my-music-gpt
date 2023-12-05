# Music therapy chatbot

Marine Buliard - 202326681 - Last updated 04/12/2023

## Description

This project is a chatbot specialized in music therapy for newborn babies, developped as part of a master thesis at Los Andes university, Columbia.

## How to use it?

### Install

To launch the project, ensure you have Node.js and Python installed on your computer.
You will also need the Flask python module, openai, pandas, matplotlib, plotly, scipy, sklearn and the mui material library.
Finally, you will need to have **your OpenAI key set as an environement variable** named OpenAIKey.

* To install the Flask module run:
pip install Flask

* To install the openai library run:
pip install openai

* To install the pandas library run:
pip install pandas

* To install the matplotlib library run:
pip install matplotlib

* To install the plotly library run:
pip install plotly

* To install the scipy library run:
pip install scipy

* To install the sklearn library run:
pip install sklearn

* To install the mui material library run:
npm install @mui/material

### Launch the project

To launch the frontend, open a powershell terminal in the APP/front folder, and run the following command:
    npm start
A new window will be opened automatically in your default browser

To launch the backend, open a python terminal in the APP folder and run:
    python3 front/src/app.py

### Use the project

Once the project is launched, you can type in any questionin the search bar. However, if this question is not related to music therapy or if the information is not available from the database created for the project, the model will answer the question with "I don't know".

Here are a few examples of questions that should generate an answer:
*What is the ideal duration for a music therapy session?*
*How can music therapy be useful to newborn babies?*

On the other hand, the following examples might generate a simple "I don't know":
*What is the recipe for tiramisu?* (too far from the subject)
*What is the ideal artist for a 15-minute-long music therapy session for a 4-month old with a conjonctivitis?* (too precise, the database will not have a clear answer)
