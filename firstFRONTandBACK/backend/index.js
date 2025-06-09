import express from "express";
const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/api/jokes", (req, res) => {
  const Jokes = [
    {
      id: 1,
      title: "Joke1",
      content: "This is the first Joke",
    },
    {
      id: 2,
      title: "Joke2",
      content: "This is the second Joke",
    },
    {
      id: 3,
      title: "Joke3",
      content: "This is the third Joke",
    },
  ];
  res.send(Jokes);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
