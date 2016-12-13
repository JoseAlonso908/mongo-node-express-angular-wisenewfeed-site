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

				if (socketId == socket.id) delete socketId
			}
		})

		socket.on('message', newMessageEvent)
	})
}