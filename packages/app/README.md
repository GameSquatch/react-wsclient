# Demo Application

This is the demo application that shows some basic features of the react-wsclient library.

As of right now, there are three basic functions:

1. Echo - what is sent gets received. Also displays any other messages received by the server.
2. Filter - filters out messages using criteria. This allows you to call the hook but only receive message events when the filter criteria are met. This is akin to a "channel" in something like websocket.io.
3. Blast - this shows what happens when the server sends many messages in rapid succession and how React is built to handle and batch updates in combination with that.
