import { React, useState, useRef, useEffect } from "react";
import TextField from "@mui/material/TextField";
import "./App.css";
import authConf from "./authConf.json";


function App() {

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [query, setQuery] = useState([])
  const [chatHistory, setChatHistory] = useState([[]])
  const [currentChatHistory, setCurrentChatHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [GPT4, setGPT4] = useState(false)
  const chatHistoryRef = useRef(null);
  
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
    const jsonData = {
      query: query,
      history: currentChatHistory,
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
        
        console.log("message", data.message);
        console.log("answer", data.message.answer);
        console.log("sources array", data.message.sources);
        // Update the current chat history so that it includes the answer to the new question
        setCurrentChatHistory(prevHistory => [
          ...prevHistory,
          { query: query, answer: data.message.answer, sources: data.message.sources }
        ]);
        console.log("lengthes", currentChatHistory.length, chatHistory.length)
        // Update  the global chat history to avoid incoherences
        if (currentChatHistory.length==0){
          console.log('current chat', currentChatHistory);
          setChatHistory([...chatHistory, [{ query: query, answer: data.message.answer, sources: data.message.sources }]]);
        }else{
          const updatedHistory = chatHistory.map((row, rowIndex) =>{
            if (chatHistory[rowIndex].every(item => currentChatHistory.includes(item))){
              return [...currentChatHistory, { query: query, answer: data.message.answer, sources: data.message.sources }];
            }
            // No need to say else, because if we entered the if loop then subsequent line not executed
            return row;
          });
          setChatHistory(updatedHistory);
        }
      })
      .catch(error => {
        console.error('Error while sending the request to the backend: ', error);
      });
      console.log(jsonData);
      console.log("chat history", chatHistory);
  };

  const handleLogin = () =>{
    if (username==authConf.username && password==authConf.password){
      setConnected(true)
    }
    else{
      console.log("Sorry, try again")
    }
  }


  const handleChangeHistory = (item) =>{
    console.log("the new current history", item)
    setCurrentChatHistory(item)
  };

  const handleNewChat = () => {
    setCurrentChatHistory([]);
    console.log("chat history", chatHistory);
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
        const response = await fetch('./History.json');
        const data = await response.json();
        setChatHistory(data);
        setCurrentChatHistory(data[data.length - 1])
      } catch (error) {
        console.error('Error fetching chat history:', error);
      }
      finally{
        setLoading(false);
      }
    };

    fetchChatHistory();
  }, []);   
  console.log("chatHistory", chatHistory);

  if (!connected){
    return(<div className="container-form"> <form>
      <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username"/>
      <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password"/>
      <button className="search-button" onClick={handleLogin}>Login</button>
  </form></div>);
  }

  if (loading){
    return <div>Loading... </div>
  }
  // Front
  return (
    <div className="main">
      <div className="head">
        <div className="head">GPT-3.5</div>
        <label className="switch head">
          <input
            type="checkbox"
            checked={GPT4 === true}
            onChange={handleToggle}
          />
          <span className="slider"></span>
        </label>
        <div className="head">GPT-4</div>
        <h1 className="head">Music GPT</h1>
        <button className="search-button" onClick={handleSaveHistory}>Save history</button>
      </div>
      {chatHistory && (
      <div className='container'>
        <div className="history-panel left">
          <div className="history-scroll" ref={chatHistoryRef}>
              <div className="container">
                <h3>History</h3>
                <button className="search-button" onClick={handleNewChat}>New chat</button>
              </div>
              {chatHistory.map((item, index) => (
                <button className={`history-button ${item === currentChatHistory ? 'selected-history-button' : ''}`}
                 key={index}  onClick={ () => handleChangeHistory(item)}>
                  {item[0].query}
                </button>
              ))}
            </div>
        </div>
        <div className="history-panel right">
          <div className="history-scroll"  ref={chatHistoryRef}>
            <ul>
              {currentChatHistory.map((item, index) => (
                <li key={index}>
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
      <button className="search-button" onClick={handleSubmit}>Submit</button>
      </div>
    </div>
  );
}

export default App;