module.exports = (io) => {
	const EventEmitter = require('events')
	class WSEmitterClass extends EventEmitter{}
	var WSEmitter = new WSEmitterClass()

	// user ID: socket ID
	var online = {}

	let newMessageEvent = (messageObject) => {
		let recipientSocketId = online[messageObject.to._id.toString()]

		if (recipientSocketId) {
			// console.log(`Sending message to ${messageObject.to.name} (${messageObject.to._id}) from ${messageObject.from.name} (${messageObject.from._id})`)
			io.to(recipientSocketId).emit('message', messageObject)
		}
	}

	events.on('message', newMessageEvent)

	io.on('connection', (socket) => {
		online[socket.handshake.query.uid] = socket.id

		// console.log(`New connection: ${socket.handshake.query.uid}`)

		socket.on('disconnect', () => {
			for (let userId in online) {
				let socketId = online[userId]

				if (socketId == socket.id) {
					// console.log(`Disconnection: ${userId}`)
					WSEmitter.emit('disconnect', userId)
					delete online[userId]
				}
			}
		})

		socket.on('message', newMessageEvent)
	})

	return {
		WSEmitter,
		isOnline: (id) => {
			return !!online[id]
		},
		messagesIsRead: (users, messagesIds) => {
			for (let id of users) {
				if (online[id]) {
					io.to(online[id]).emit('messagesread', messagesIds)
				}
			}
		}
	}
}
