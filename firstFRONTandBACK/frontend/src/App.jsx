import { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";

function App() {
  const [jokes, setJokes] = useState([]);

  useEffect(() => {
    axios
      .get("/api/jokes")
      .then((response) => setJokes(response.data))
      .catch((error) => console.log("error", error));
  });
  return (
    <>
      <h1>JOKES: {jokes.length}</h1>
      <div>
        {jokes.map((joke) => (
          <div key={joke.id}>
            <h3>{joke.title}</h3>
            <p>{joke.content}</p>
          </div>
        ))}
      </div>
    </>
  );
}

export default App;
