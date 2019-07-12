<div align='center'>
  <img width="200px" src='https://image.flaticon.com/icons/svg/947/947077.svg'>
</div>

# blueboat

Blueboat is a simple game server backend for NodeJS focused on scalability. Blueboat's job is to focus on networking, timing, and state management so that you can focus on what makes your game special. 

Blueboat was created by and for [Gimkit](https://www.gimkit.com), and because of that, it has some opinionated decisions and requirements. Blueboat's main goal is to be scalable so that you don't have to change anything as your game grows.

**Blueboat takes care of**
* Real-time communication between server and clients
* State management on the server   
* Room joining/leaving
* Timing events
* Scaling

**Blueboat does not take care of**
* State synchronization between server and client
* Matchmaking
* Game or Physics Engine
* External Database (for saving player stats)

### Install
```bash

yarn add blueboat
```

or

```
npm install blueboat --save
```

Blueboat comes with Typescript definitions already so need to install those!


### Documentation
* [Documentation Home (Server)](https://github.com/gimkit/blueboat/wiki)
  * [Server API](https://github.com/gimkit/blueboat/wiki/Server-API)
  * [Room](https://github.com/gimkit/blueboat/wiki/Room)
  * [Client](https://github.com/gimkit/blueboat/wiki/Client)
  * [PubSub API](https://github.com/gimkit/blueboat/wiki/Pubsub-API)
  * [Storage API](https://github.com/gimkit/blueboat/wiki/Storage-API)
* [Documentation Home (Client)](https://github.com/gimkit/blueboat-client/wiki)
  * [Client API](https://github.com/gimkit/blueboat-client/wiki/Client-API)
  * [Room API](https://github.com/gimkit/blueboat-client/wiki/Room-API)
  
  

### Admin Tool
When running your server, you can visit an admin panel, but going to `/blueboat-panel`

**View List Of Rooms**

By default, you can see the list of rooms currently active in your server.

<img src='https://i.imgur.com/xOEYJ07.png'>

**View Room**

Click into a room to see the list of clients and the room's state
<img src='https://i.imgur.com/dv9XMDM.png'>

**Change Game Values**

Use Blueboat's game values tab to quickly change game values. Super useful to easily make balance adjustments or enable/disable game features. Here's an example of a simple chat application that gets a message from a bot when you create a room:

<img src='https://i.imgur.com/mPleH93.gif'>


### Inspirations
Blueboat is inspired by [Colyseus](https://github.com/colyseus/colyseus/). The creator of Colyseus, [Endel Dreyer](https://github.com/endel) helped significantly throughout the building of Blueboat. Thanks so much, Endel!

<div>Icon made by <a href="https://www.flaticon.com/authors/fjstudio" title="fjstudio">fjstudio</a> from <a href="https://www.flaticon.com/" 			    title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" 			    title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a></div>
