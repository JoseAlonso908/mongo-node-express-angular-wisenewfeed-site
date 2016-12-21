module.exports = (io) => {
	// user ID: socket ID
	var online = {}

	let newMessageEvent = (messageObject) => {
		let recipientSocketId = online[messageObject.to._id.toString()]

		if (recipientSocketId) {
			io.to(recipientSocketId).emit('message', messageObject)
		}
	}

	events.on('message', newMessageEvent)

	io.on('connection', (socket) => {
		online[socket.handshake.query.uid] = socket.id
	
		socket.on('disconnect', () => {
			for (let userId in online) {
				let socketId = online[userId]

				if (socketId == socket.id) delete online[userId]
			}
		})

		socket.on('message', newMessageEvent)
	})

	return {
		isOnline: (id) => {
			return !!online[id]
		},
		messagesIsRead: (users, messagesIds) => {
			for (let id of users) {
				if (online[id]) {
					console.log(`Emitting ${JSON.stringify(messagesIds)} to ${id} - ${online[id]}`)
					io.to(online[id]).emit('messagesread', messagesIds)
				}
			}
		}
	}
}