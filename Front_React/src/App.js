import { React, useState, useRef, useEffect } from "react";
import TextField from "@mui/material/TextField";
import "./App.css";
import authConf from "./authConf.json";

function App() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [connected, setConnected] = useState(false)

  const [query, setQuery] = useState([])
  const [chatHistory, setChatHistory] = useState([[]])
  const [currentChatHistory, setCurrentChatHistory] = useState({ conversation: [], conversationIndex: -1 })
  const chatHistoryRef = useRef(null);

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [GPT4, setGPT4] = useState(false)
  
  const handleError = (errorMessage) => {
    setError(errorMessage);
  };

  const handleClose = () => {
    setError(null);
  };

  function ErrorModal({ error, onClose }) {
    return (
      <div className="modal">
        <div className="modal-content">
          <span className="close" onClick={onClose}>&times;</span>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const handleLogin = (e) =>{
    e.preventDefault();
    if (username==authConf.username && password==authConf.password){
      setConnected(true)
    }
    else{
      console.log("Username or password incorrect")
    }
  }

  const inputHandler = (e) => {
    const userInput = e.target.value;
    setQuery(userInput);
  };

  // Enter key press launch a call to the API
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  // Submission of the query to the back API
  const handleSubmit = () => {
    setLoading(true);
    const jsonData = {
      query: query,
      history: currentChatHistory.conversation,
      gpt4 : GPT4,
    };
  
    fetch('api/query', {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jsonData),
    })
      .then(response => response.json())
      .then(data => {
        console.log('data', data)
        setLoading(false);

        console.log("message", data.message);
        console.log("answer", data.message.answer);
        console.log("sources array", data.message.sources);
        // Update the current chat history so that it includes the answer to the new question
        if (data.message.answer === "You cannot continue this conversation"){
          handleError("An error occured: "+data.message.answer);
          
        
        
        } else {
          setCurrentChatHistory(prevHistory => ({conversation:
            [
            ...(prevHistory.conversation || []),
            { id: data.message.id, query: query, answer: data.message.answer, sources: data.message.sources }
            ],
            conversationIndex: prevHistory.conversationIndex })
          );
            console.log('current chat', currentChatHistory)
            // Update  the global chat history to avoid incoherences
            if (currentChatHistory.conversation===undefined || currentChatHistory.conversation.length===0){
              console.log('current chat', currentChatHistory);
              setChatHistory([...chatHistory, [{ id: data.message.id, query: query, answer: data.message.answer, sources: data.message.sources }]]);
            }else{
              const updatedHistory = chatHistory.map((conversation, index) =>{
                if (index === currentChatHistory.conversationIndex){
                  return [...currentChatHistory.conversation, { id: data.message.id, query: query, answer: data.message.answer, sources: data.message.sources }];
                }
                // No need to say else, because if we entered the if loop then subsequent line not executed
                return conversation;
              });
              setChatHistory(updatedHistory);
            }
        }
      })
      .catch(error => {
        console.error('Error while sending the request to the backend: ', error);
        handleError("An error occured. Did you check the question was not empty?");
        setLoading(false);
      });
      console.log(jsonData);
      console.log("chat history", chatHistory);
  };


  const handleChangeHistory = (index, item) =>{
    console.log("the new current history", item)
    setCurrentChatHistory({conversationIndex: index, conversation: item})
  };

  const handleNewChat = () => {
    const index = chatHistory.length
    setCurrentChatHistory({conversationIndex: index, conversation: []});
    console.log("chat history", chatHistory);
  };

  const handleDeleteMessage = (messageIndex) => {
    console.log('index conversation', currentChatHistory.conversationIndex)
      setChatHistory(prevChatHistory => {
        const updatedChatHistory = prevChatHistory.map((conversation, index) => {
          if (index === currentChatHistory.conversationIndex) {
            const updatedConversation = conversation.filter((_, index) => index !== messageIndex);
            const updatedConversationWithNewIDs = updatedConversation.map((message, index) => ({
              ...message,
              id: index, // Assign new ID based on index
            }));
  
            if (updatedConversationWithNewIDs.length === 0) {
              return null; // Filter out the empty conversation
            }
  
            return updatedConversationWithNewIDs;
          }
          return conversation;
        }).filter(conversation => conversation !== null);
        console.log("New chat history with deleted message", updatedChatHistory);
        return updatedChatHistory;
      });
  
      setCurrentChatHistory(prevHistory => {
        console.log("messageIndex", messageIndex);
        const updatedConversation = prevHistory.conversation.filter((message) => {
          console.log("Message ID:", message.id);
          return message.id !== messageIndex;
        });
      
        // Assign new ID based on index for the updated messages
        const updatedConversationWithNewIDs = updatedConversation.map((message, index) => ({
          ...message,
          id: index,
        }));    
        console.log("currentChatHistory length", updatedConversationWithNewIDs.length);
        console.log(updatedConversationWithNewIDs);
      
        // Return the updated conversation and preserve the conversation index
        return { conversation: updatedConversationWithNewIDs, conversationIndex: prevHistory.conversationIndex };
      });
      
      console.log("New chat history with deleted message", chatHistory);
      console.log("New current chat history with deleted message", currentChatHistory);
    };

  const handleSaveHistory = () =>{
    const jsonData = {
      history: chatHistory,
    };
    fetch('api/save', {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jsonData),
    })
    .then(response => response.json())
    .then(data => {
      console.log(data.message)
    })
    .catch(error => {
      console.error('Error while sending the request to the backend: ', error);
    });
  };

  const handleToggle = () => {
    setGPT4(GPT4 === true? false : true);
  };
  console.log(GPT4)

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [chatHistory]);

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const response = await fetch('History.json');
        const data = await response.json();
        if (data[0].length === 0){
          setChatHistory([]);
          setCurrentChatHistory({conversationIndex: 0, conversation: []});
        }else{
          setChatHistory(data);
          setCurrentChatHistory({ conversationIndex: data.length - 1, conversation: data[data.length - 1] })
        }
        console.log("chat history just after loading",chatHistory)
      } catch (error) {
        console.error('Error fetching chat history:', error);
      }
    };

    fetchChatHistory();
  }, []);   
  console.log("chatHistory", chatHistory);

  if (!connected){
    return(<div className="container-form"> <form  id="msform"><fieldset><h2>Please enter your login information </h2>
      <p><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username"/></p>
      <p><input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password"/></p>
      <button className="saveHistory-button" onClick={handleLogin}>Login</button>
  </fieldset></form></div>);
  }

  // Front
  return (
    <div className="main">
      <div className="head">
        <button
          className="search-button"
          onClick={handleToggle}
        >
          {GPT4 === true? "Using GPT-4, use GPT-3.5 instead" : "Using GPT-3.5, use GPT-4 instead"}
        </button>
        <h1 className="head">Music GPT</h1>
        <button className="search-button" onClick={handleSaveHistory}>Save history</button>
      </div>
      {chatHistory && (
      <div className='container'>
        <div className="history-panel left">
          <div className="history-scroll" ref={chatHistoryRef}>
              <div className="history-container">
                <h3>History</h3>
                <button className="search-button" onClick={handleNewChat}>New chat</button>
              </div>
              {chatHistory.length>0 && chatHistory.map((item, index) => (
                <button className={`history-button ${index === currentChatHistory.conversationIndex ? 'selected-history-button' : ''}`}
                 key={index}  onClick={ () => handleChangeHistory(index, item)}>
                  {item && item[0] && item[0].query}
                </button>
              ))}
            </div>
        </div>
        <div className="history-panel right">
          <div className="history-scroll"  ref={chatHistoryRef}>
            <ul>
              {currentChatHistory && currentChatHistory.conversation.map((item, index) => (
                <li className="messages" key={index}>
                  <p className="text-bubble"><strong>Query:</strong> {item.query}</p>
                  <p className="text-bubble received"><strong>Answer:</strong> {item.answer}</p>
                    <div><strong>Sources:</strong> 
                    {Object.entries(item.sources).length > 0 ? (
                      <ul> 
                        {Object.entries(item.sources).map(([source, ids], sourceIndex) => (
                          <li key={sourceIndex}>
                            <a href={require(`../documents/${source}.pdf`)+`#page=${ids[0][0]}`} target = "_blank" rel="noreferrer"><strong>{source}:</strong></a>
                            <ul>
                              {ids.map((id, subIndex) => (
                                <li key={subIndex}>
                                  p: {Array.isArray(id) ? (
                                    <span>
                                    {id.map((subId, nestedIndex) => (
                                      <a key={nestedIndex} href={require(`../documents/${source}.pdf`)+`#page=${subId}`} target = "_blank" rel="noreferrer">
                                        {nestedIndex > 0 && ', '}
                                        {subId}
                                      </a>
                                    ))}
                                  </span>
                                  ) : (
                                    id
                                  )}
                                </li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-bubble received">No sources available</p>
                    )}
                  </div>
                  <button className="delete-button" onClick={() =>{handleDeleteMessage(index)}}>Delete</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>)}
       <div className="search">
        <TextField
          id="outlined-basic"
          onChange={inputHandler}
          onKeyPress={handleKeyDown} 
          variant="outlined" 
          fullWidth
          label="Search"
        />
      <button className="search-button" onClick={handleSubmit} disabled={loading}>{loading ? <div className="loading-spinner"></div> :'Submit'}</button>
      {error && <ErrorModal error={error} onClose={handleClose} />}
      </div>
    </div>
  );
}

export default App;