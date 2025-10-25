// index.js
import CelloAgent from "./agent";

const agent = new CelloAgent().model().systemPrompt();

agent.createTransaction("Create transaction when user requests payment.");
agent.log().telegram("Check if the transaction was successful.");

agent.run();
