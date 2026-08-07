redis ----> Redis (The Waiting Room): Redis is a lightning-fast database that runs in your RAM. In this project, we aren't using it to cache data; we are using it as a waiting room for incoming code submissions.

BullMQ (The Queue Manager): BullMQ is a Node.js library that sits on top of Redis. It creates a line (a queue).

The Flow:
1.When React sends code to your Express API, Express simply drops the code into the BullMQ Redis Queue and immediately replies to React: "I got your code, you are #4 in line." (This takes 5 milliseconds, meaning Express never freezes).
2.A separate background process (a Worker) looks at the BullMQ queue, takes the next piece of code, spins up a Docker container, runs it, and gets the result.
3.If the user's C++ code crashes the Docker container, BullMQ safely handles the failure. Your Express server is completely untouched and stays online.

